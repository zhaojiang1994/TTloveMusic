// 歌词处理模块
let currentLyricsArray = [];
let lyricsUpdateHandler = null;
let lyricsAnimId = null;  // 全局 RAF id，切歌时取消旧循环
let lyricsPlayHandler = null;  // 播放时重启 smoothScroll
// 刷新歌词颜色：从当前 CSS 读取颜色并应用到所有歌词行
window.refreshLyricsColors = function() {
    var allLines = document.querySelectorAll('.lyrics-text');
    if (allLines.length === 0) return;
    // 从 .lyrics-text 读底色（主题 CSS 可能只在这一层设颜色）
    var _first = allLines[0];
    var _norm = getComputedStyle(_first).color;
    // 用 .active 类读高亮色
    _first.classList.add('active');
    var _hi = getComputedStyle(_first).color;
    _first.classList.remove('active');
    // 应用到所有行（当前行由 smoothScroll 覆盖，不打紧）
    for (var _li = 0; _li < allLines.length; _li++) {
        allLines[_li].style.background = 'none';
        allLines[_li].style.webkitBackgroundClip = 'initial';
        allLines[_li].style.backgroundClip = 'initial';
        allLines[_li].style.webkitTextFillColor = 'initial';
        allLines[_li].style.color = _norm;
    }
    window._lyricsColorsDirty = true;
};

// 不再缓存歌词颜色，每帧实时读取

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m));
}

// 在外部统一复用，避免在 high-frequency 循环里重复实例化
const flacDecoder = new TextDecoder('utf-8');

function parseFlacVorbisForLyrics(data) {
    // FLAC: "fLaC" + metadata blocks
    if (data.length < 4 || String.fromCharCode(data[0], data[1], data[2], data[3]) !== 'fLaC') return null;

    var offset = 4;
    while (offset + 4 < data.length) {
        var isLast = data[offset] & 0x80;
        var type = data[offset] & 0x7F;
        var size = ((data[offset+1] & 0xFF) << 16) | ((data[offset+2] & 0xFF) << 8) | (data[offset+3] & 0xFF);
        offset += 4;

        // 【安全防线】：防止坏文件或未知异常导致 size 为 0，引发下面的 offset += size 死循环
        if (size <= 0 || offset + size > data.length) break;

        if (type === 4) { // VORBIS_COMMENT block
            var pos = offset;
            var blockEnd = offset + size;

            if (pos + 4 > blockEnd) break;
            // 厂商字符串长度 (小端序)
            var vendorLen = (data[pos] & 0xFF) | ((data[pos+1] & 0xFF) << 8) | ((data[pos+2] & 0xFF) << 16) | ((data[pos+3] & 0xFF) << 24);
            pos += 4 + vendorLen;

            if (pos + 4 > blockEnd) break;
            // 评论项总数
            var commentCount = (data[pos] & 0xFF) | ((data[pos+1] & 0xFF) << 8) | ((data[pos+2] & 0xFF) << 16) | ((data[pos+3] & 0xFF) << 24);
            pos += 4;

            for (var ci = 0; ci < commentCount; ci++) {
                if (pos + 4 > blockEnd) break;
                var clen = (data[pos] & 0xFF) | ((data[pos+1] & 0xFF) << 8) | ((data[pos+2] & 0xFF) << 16) | ((data[pos+3] & 0xFF) << 24);
                pos += 4;

                if (clen > 0 && pos + clen <= blockEnd) {
                    // 【核心优化一】：改用 subarray 提取字节视图（0 内存拷贝开销）
                    // 【核心优化二】：使用外部全局复用的 flacDecoder 进行统一解码
                    var comment = flacDecoder.decode(data.subarray(pos, pos + clen));
                    pos += clen;

                    // 快速匹配前缀，用 startsWith 替代 indexOf === 0，语义更清晰且被 V8 深度优化
                    var upperComment = comment.toUpperCase();
                    if (upperComment.startsWith('LYRICS=')) {
                        return comment.substring(7) || null;
                    }
                    if (upperComment.startsWith('UNSYNCEDLYRICS=')) {
                        return comment.substring(14) || null;
                    }
                } else {
                    break;
                }
            }
            // 既然已经找到了 VORBIS_COMMENT 块并且处理完了（无论找没找到歌词），
            // 在 FLAC 中通常不需要再看其他块了，直接 break 退出可以获得更优的性能。
            break;
        }

        offset += size;
        if (isLast) break;
    }
    return null;
}

// 在函数外部复用 TextDecoder 实例
const mp4Decoder = new TextDecoder('utf-8');

function parseMp4ForLyrics(data) {
    if (data.length < 8) return null;

    // 读取 Atom 的基础结构
    function readAtom(d, off, max) {
        if (off + 8 > max) return null;
        var size = ((d[off] << 24) | (d[off+1] << 16) | (d[off+2] << 8) | d[off+3]) >>> 0; // 强制转为无符号整数
        var type = String.fromCharCode(d[off+4], d[off+5], d[off+6], d[off+7]);
        return { size, type, off };
    }

    // 优化后的 Atom 链路寻找：增加安全边界，避免死循环，直接跳过无关的大型 Atom
    function findAtom(d, off, max, targetTypes, depth) {
        if (depth > 6 || off + 8 > max) return null;

        while (off + 8 <= max) {
            var atom = readAtom(d, off, max);
            if (!atom || atom.size < 8 || off + atom.size > max) {
                // 如果 atom 损毁、尺寸异常或超出边界，立刻终止，防止无限死循环
                break;
            }

            // 如果匹配到了当前层级想要的 Atom 类型
            if (atom.type === targetTypes[0]) {
                // 如果已经是最底层（我们要找的 ©lyr 或 ----），直接返回
                if (targetTypes.length === 1) return atom;

                // 否则，进入这个 Atom 内部继续往深层找
                var inner = off + 8;
                var subMax = off + atom.size;
                var res = findAtom(d, inner, subMax, targetTypes.slice(1), depth + 1);
                if (res) return res;
            }

            // 【核心优化】：如果当前顶级 Atom 不是我们想要的（比如碰到了超级巨大的 mdat 块）
            // 直接将指针跳过它的 size，绝对不进去做无意义的递归读取
            off += atom.size;
        }
        return null;
    }

    // 尝试寻找苹果标准的内置歌词 Atom 链路
    var lyrAtom = findAtom(data, 0, data.length, ['moov', 'udta', 'meta', 'ilst', '\u00A9lyr'], 0);
    // 如果没找到，尝试寻找自定义的常用歌词链路 '----'
    if (!lyrAtom) {
        lyrAtom = findAtom(data, 0, data.length, ['moov', 'udta', 'meta', 'ilst', '----'], 0);
    }
    if (!lyrAtom) return null;

    var off = lyrAtom.off + 8;
    var end = lyrAtom.off + lyrAtom.size;

    // 遍历目标歌词 Atom 内部，寻找存放文字的 'data' 块
    while (off + 8 <= end) {
        var sub = readAtom(data, off, end);
        if (!sub || sub.size < 8 || off + sub.size > end) break; // 安全防线

        if (sub.type === 'data') {
            var dataOff = off + 16;       // 跳过 data box 自身的 4字节 type + 4字节 flags + 4字节 locale 等标志位
            var dlen = sub.size - 16;

            if (dlen > 0 && dataOff + dlen <= data.length) {
                // 【核心修复】：利用 subarray 截取纯字节视图，再用 TextDecoder 一口气整体高速解码
                var lyricBytes = data.subarray(dataOff, dataOff + dlen);

                // 去除末尾可能存在的 \0 空终止符
                var actualLen = lyricBytes.length;
                while (actualLen > 0 && lyricBytes[actualLen - 1] === 0) {
                    actualLen--;
                }

                if (actualLen > 0) {
                    var txt = mp4Decoder.decode(lyricBytes.subarray(0, actualLen));
                    if (txt.trim()) return txt.trim();
                }
            }
        }
        off += sub.size;
    }
    return null;
}

async function readEmbeddedLyrics(song, lyricsBox) {
    if (!song.src) {
        return await fetchNetworkLyrics(song);
    }

    if (lyricsBox) {
        lyricsBox.innerHTML = '<div style="padding:20px;text-align:center">📝 正在读取内嵌歌词...</div>';
    }

    // 统一用 fetchRealSongMeta 读取文件头拿真实元数据（歌名、歌手、内嵌歌词）
    var _searchName = song.name;
    var _searchArtist = song.artist;
    if (typeof window.fetchRealSongMeta === 'function' && song.src && song.src.indexOf('://') > 0) {
        var _meta = await window.fetchRealSongMeta(song.src).catch(function(){});
        try { console.log('🎵 普通元数据:', _meta ? JSON.stringify(_meta) : 'null', '源:', song.name, song.artist); } catch(e) {}

        if (_meta) {
            if (_meta.title) _searchName = _meta.title;
            if (_meta.artist) _searchArtist = _meta.artist;
            if (_meta.lyrics) { console.log('📝 内嵌歌词: ' + (_searchName || '')); return _meta.lyrics; }
        }
    }
    // 无内嵌歌词 → 用真实歌名/歌手搜索网络
    var _net = typeof window.fetchLyricsFromProvider === 'function' ? await window.fetchLyricsFromProvider(_searchName, _searchArtist).catch(function(){}) : null;
    if (_net) console.log('📝 网络歌词: ' + (_searchName || ''));
    return _net;
}

async function fetchNetworkLyrics(song) {
    if (typeof window.fetchLyricsFromProvider !== 'function') return null;
    try {
        var providerLyrics = await window.fetchLyricsFromProvider(song.name, song.artist);
        if (providerLyrics) {
            // console.log('✅ 网络歌词匹配成功 [' + song.name + ']');
            return providerLyrics;
        }
    } catch(e) {
        console.warn('❌ 网络歌词接口异常:', e);
    }
    return null;
}

// 从 ID3v2 数据中提取标题(TIT2)、歌手(TPE1)、歌词(USLT)
// 在函数外层或全局只实例化一次，彻底避免高频创建对象的开销
const id3Decoders = {
    utf8: new TextDecoder('utf-8'),
    latin1: new TextDecoder('latin1'),
    utf16: new TextDecoder('utf-16') // 原生接管 UTF-16，干掉手工循环
};

function parseID3v2Metadata(data) {
    var result = { title: null, artist: null, lyrics: null };
    if (data.length < 10 || String.fromCharCode(data[0], data[1], data[2]) !== 'ID3') return result;

    var ver = data[3];
    var size = ((data[6] & 0x7F) << 21) | ((data[7] & 0x7F) << 14) | ((data[8] & 0x7F) << 7) | (data[9] & 0x7F);
    var offset = 10;

    if (ver >= 3 && (data[4] & 0x40)) {
        offset += 4 + (((data[offset] & 0x7F) << 21) | ((data[offset+1] & 0x7F) << 14) | ((data[offset+2] & 0x7F) << 7) | (data[offset+3] & 0x7F));
    }

    while (offset + 8 < data.length && offset < size + 10) {
        var frameId, rawSize;
        if (ver === 2) {
            frameId = String.fromCharCode(data[offset], data[offset+1], data[offset+2]);
            rawSize = ((data[offset+3] & 0xFF) << 16) | ((data[offset+4] & 0xFF) << 8) | (data[offset+5] & 0xFF);
            offset += 6;
        } else {
            frameId = String.fromCharCode(data[offset], data[offset+1], data[offset+2], data[offset+3]);
            if (ver === 4) {
                rawSize = ((data[offset+4] & 0x7F) << 21) | ((data[offset+5] & 0x7F) << 14) | ((data[offset+6] & 0x7F) << 7) | (data[offset+7] & 0x7F);
            } else {
                rawSize = (((data[offset+4] << 24) | (data[offset+5] << 16) | (data[offset+6] << 8) | data[offset+7]) >>> 0);
            }
            offset += 10;
        }

        if (frameId === '\0\0\0\0' || rawSize === 0 || rawSize > 10000000) break;

        // 提取要解析的目标数据切片视图（使用 subarray 保证零拷贝）
        if (offset + rawSize > data.length) break;

        var isTitle = frameId === 'TIT2' || frameId === 'TT2';
        var isArtist = frameId === 'TPE1' || frameId === 'TP1';
        var isLyrics = frameId === 'USLT' || frameId === 'ULT';

        if ((isTitle || isArtist) && rawSize > 1) {
            var enc = data[offset];
            var start = offset + 1;
            var end = offset + rawSize;

            // 快速跳过末尾的空终止符 \0
            while (end > start && data[end - 1] === 0) end--;

            if (start < end) {
                var strBytes = data.subarray(start, end); // 零内存拷贝
                var str = '';
                if (enc === 0) str = id3Decoders.latin1.decode(strBytes);
                else if (enc === 3) str = id3Decoders.utf8.decode(strBytes);
                else if (enc === 1 || enc === 2) str = id3Decoders.utf16.decode(strBytes);

                var trimmed = str.trim();
                if (trimmed) {
                    if (isTitle) result.title = trimmed;
                    else result.artist = trimmed;
                }
            }
        }
        else if (isLyrics && rawSize > 5) {
            var encoding = data[offset];
            // USLT 帧结构: 1字节编码 + 3字节语言 + 描述文本(以\0结尾) + 真正的歌词内容
            var pos = offset + 4;
            var frameEnd = offset + rawSize;

            // 寻找描述文本的结束标记 \0
            if (encoding === 1 || encoding === 2) {
                // UTF-16 的 \0 占两个字节
                while (pos < frameEnd - 1 && !(data[pos] === 0 && data[pos+1] === 0)) pos += 2;
                pos += 2; // 跳过 \0\0
            } else {
                // Latin1 / UTF-8 的 \0 占一个字节
                while (pos < frameEnd && data[pos] !== 0) pos++;
                pos++; // 跳过 \0
            }

            // 清理并截取末尾多余的空字节
            while (frameEnd > pos && data[frameEnd - 1] === 0) frameEnd--;

            if (pos < frameEnd) {
                var lyricBytes = data.subarray(pos, frameEnd); // 零内存拷贝
                var txt = '';
                if (encoding === 0) txt = id3Decoders.latin1.decode(lylyricBytes);
                else if (encoding === 3) txt = id3Decoders.utf8.decode(lyricBytes);
                else if (encoding === 1 || encoding === 2) txt = id3Decoders.utf16.decode(lyricBytes);

                if (txt.trim()) result.lyrics = txt;
            }
        }

        offset += rawSize;
    }
    return result;
}

// 保持一个全局或模块顶层的唯一正则实例
const LRC_LINE_REGEXP = /\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\](.*)/;

function parseLrcToArray(lrcText) {
    if (!lrcText) return [];
    const lines = lrcText.split(/\r?\n/);
    const result = [];
    for (const line of lines) {
        const match = line.match(LRC_LINE_REGEXP); // 这样不会在循环内部高频重建正则对象
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const ms = match[3] ? parseInt(match[3].padEnd(2, '0').slice(0, 2)) : 0;
            const time = minutes * 60 + seconds + ms / 100;
            const text = match[4].trim();
            if (text) result.push({ time, text });
        }
    }
    result.sort((a, b) => a.time - b.time);
    return result;
}

function displayLyrics(lyricsArray, lyricsBox, audioElement) {
    if (audioElement && window._oldLyricsPlayHandler) {
        audioElement.removeEventListener('play', window._oldLyricsPlayHandler);
        window._oldLyricsPlayHandler = null;
    }
    if (lyricsAnimId) { cancelAnimationFrame(lyricsAnimId); lyricsAnimId = null; }
    if (lyricsUpdateHandler && audioElement) {
        audioElement.removeEventListener('timeupdate', lyricsUpdateHandler);
        lyricsUpdateHandler = null;
    }

    currentLyricsArray = lyricsArray || [];

    if (currentLyricsArray.length === 0) {
        lyricsBox.innerHTML = '<div style="padding:20px;text-align:center; opacity:0.7;">暂无歌词<br>🎵 纯音乐欣赏 🎵</div>';
        return;
    }

    lyricsBox.innerHTML = currentLyricsArray.map(function(l) {
        return '<div class="lyrics-line" data-time="' + l.time + '" style="text-align: center;">' +
            '<span class="lyrics-text" style="display: inline-block;">' + escapeHtml(l.text || '') + '</span>' +
            '</div>';
    }).join('');

    var scrollWrapper = lyricsBox.parentElement;
    var lastCt = 0;

    var _cachedLines = null, _cachedNormColor = null, _cachedHiColor = null;
    var _geometryCache = [];
    var lastActiveIdx = -1;
    var wrapperH = scrollWrapper ? scrollWrapper.clientHeight : 0;

    // 监听窗口缩放，防止缩放后歌词错位
    var resizeHandler = function() { window._lyricsColorsDirty = true; };
    window.removeEventListener('resize', window._oldLyricsResizeHandler || (() => {}));
    window.addEventListener('resize', resizeHandler);
    window._oldLyricsResizeHandler = resizeHandler;

    function smoothScroll() {
        if (!scrollWrapper || !audioElement) { lyricsAnimId = requestAnimationFrame(smoothScroll); return; }
        var ct = audioElement.currentTime;
        if (isNaN(ct) || ct < 0) ct = 0;

        if (audioElement.paused) { lyricsAnimId = null; return; }

        if (window._lyricsColorsDirty) {
            _cachedLines = null;
            _cachedNormColor = null;
            _cachedHiColor = null;
            _geometryCache = [];
            lastActiveIdx = -1;
            wrapperH = scrollWrapper.clientHeight;
            window._lyricsColorsDirty = false;
        }

        if (!_cachedLines || _cachedLines.length === 0) {
            _cachedLines = document.querySelectorAll('.lyrics-line');
            if (_cachedLines.length === 0) { lyricsAnimId = requestAnimationFrame(smoothScroll); return; }

            _geometryCache = new Array(_cachedLines.length);
            for (var _ci = 0; _ci < _cachedLines.length; _ci++) {
                var el = _cachedLines[_ci];
                el._ts = el.querySelector('.lyrics-text');
                _geometryCache[_ci] = {
                    top: el.offsetTop,
                    height: el.offsetHeight
                };
            }
            var _nb = document.querySelector('.lyrics-box');
            _cachedNormColor = _nb ? getComputedStyle(_nb).color : '';
            var _tmp = _cachedLines[0];
            if (_tmp) {
                _tmp.classList.add('active');
                _cachedHiColor = getComputedStyle(_tmp).color;
                _tmp.classList.remove('active');
            }
        }

        var lines = _cachedLines;
        var normColor = _cachedNormColor;
        var hiColor = _cachedHiColor;

        var isSeeking = Math.abs(ct - lastCt) > 0.4;
        lastCt = ct;

        var activeIdx = -1;
        var audioDur = audioElement.duration || 99999;
        var nextTime = 99999;
        for (var i = 0; i < currentLyricsArray.length; i++) {
            var curr = currentLyricsArray[i].time;
            var next = i + 1 < currentLyricsArray.length ? currentLyricsArray[i+1].time : audioDur;
            if (ct >= curr && ct < next) { activeIdx = i; nextTime = next; break; }
        }

        if (activeIdx !== -1) {
            // 【核心修复】：跨行时，彻底移除上一行身上的所有内联样式，还原成初始 CSS 状态
            if (lastActiveIdx !== activeIdx && lastActiveIdx !== -1 && lines[lastActiveIdx]) {
                var oldSpan = lines[lastActiveIdx]._ts;
                if (oldSpan) {
                    oldSpan.style.background = '';
                    oldSpan.style.webkitBackgroundClip = '';
                    oldSpan.style.backgroundClip = '';
                    oldSpan.style.webkitTextFillColor = '';
                    oldSpan.style.color = ''; // 设为空字符串，让它自动服从外层样式表的颜色，不再用JS给它写死
                }
            }

            var textSpan = lines[activeIdx]._ts;
            if (textSpan) {
                var curLine = currentLyricsArray[activeIdx];
                var lineDuration = nextTime - curLine.time || 1;
                var isLastLine = (activeIdx >= currentLyricsArray.length - 1);
                var karaokeDuration = isLastLine ? 3 : Math.min(lineDuration, 6);
                var lineProgress = Math.min(1, Math.max(0, (ct - curLine.time) / karaokeDuration));
                var pct = lineProgress * 100;

                textSpan.style.background = 'linear-gradient(to right, ' + hiColor + ' 0%, ' + hiColor + ' ' + pct + '%, ' + normColor + ' ' + pct + '%, ' + normColor + ' 100%)';
                textSpan.style.webkitBackgroundClip = 'text';
                textSpan.style.backgroundClip = 'text';
                textSpan.style.webkitTextFillColor = 'transparent';
                textSpan.style.color = 'transparent';
            }

            lastActiveIdx = activeIdx;
        }

        var targetScroll = scrollWrapper.scrollTop;
        var useIdx = activeIdx;
        if (useIdx < 0 && currentLyricsArray.length > 0) {
            useIdx = ct < currentLyricsArray[0].time ? 0 : currentLyricsArray.length - 1;
        }

        if (useIdx >= 0 && _geometryCache[useIdx]) {
            var geo = _geometryCache[useIdx];
            targetScroll = geo.top - wrapperH / 2 + geo.height / 2;

            var rawProgress = (ct - currentLyricsArray[useIdx].time) / (nextTime - currentLyricsArray[useIdx].time || 1);
            rawProgress = Math.min(1, Math.max(0, rawProgress));
            targetScroll += rawProgress * 30;
            targetScroll = Math.max(0, Math.min(targetScroll, scrollWrapper.scrollHeight - wrapperH));
        }

        if (isSeeking) {
            scrollWrapper.scrollTop = targetScroll;
        } else {
            var diff = targetScroll - scrollWrapper.scrollTop;
            if (Math.abs(diff) > 0.5) {
                scrollWrapper.scrollTop += diff * 0.08;
            }
        }

        lyricsAnimId = requestAnimationFrame(smoothScroll);
    }

    lyricsPlayHandler = function() {
        if (!lyricsAnimId && !audioElement.paused) smoothScroll();
    };
    window._oldLyricsPlayHandler = lyricsPlayHandler;
    audioElement.addEventListener('play', lyricsPlayHandler);

    if (!audioElement.paused) smoothScroll();
}


async function loadSongLyrics(song, lyricsBox, audioElement) {
    const lyrics = await readEmbeddedLyrics(song, lyricsBox);
    if (lyrics) {
        const arr = parseLrcToArray(lyrics);
        if (arr.length) displayLyrics(arr, lyricsBox, audioElement);
        else lyricsBox.innerHTML = '<div style="padding:20px;text-align:center">纯音乐/无歌词</div>';
    } else {
        const demo = [{ time: 0, text: `${song.name} - ${song.artist}` }, { time: 5, text: "♪ 天天爱听 与你相伴 ♪" }];
        displayLyrics(demo, lyricsBox, audioElement);
    }
}