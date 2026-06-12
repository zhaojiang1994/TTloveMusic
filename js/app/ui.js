/**
 * ui.js - UI渲染和交互（数据驱动版 + 全部歌曲分页优化）
 * 功能：渲染歌曲列表、文件夹视图、分页、跑马灯、添加/删除来源
 */

// ========== 辅助函数 ==========

/**
 * 转义HTML特殊字符，防止XSS攻击
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

/**
 * 获取模板并克隆
 * @param {string} id - 模板ID
 * @returns {DocumentFragment|null} 克隆的模板节点
 */
function getTemplate(id) {
    var tpl = document.getElementById(id);
    return tpl ? tpl.content.cloneNode(true) : null;
}

// ========== 跑马灯滚动（歌手名过长时滚动） ==========

var currentRollingId = null;   // 当前滚动的元素ID
var rollInterval = null;       // 滚动定时器

/** 停止滚动 */
function stopRoll() {
    if (rollInterval) {
        clearInterval(rollInterval);
        rollInterval = null;
    }
    if (currentRollingId) {
        var el = document.getElementById(currentRollingId);
        if (el) {
            el.classList.remove('marquee-active');
            var ts = el.querySelector('.artist-text');
            if (ts) { ts.style.animationDuration = ''; }
        }
    }
}

/** 重置滚动状态 */
function resetRoll() {
    stopRoll();
    if (currentRollingId) {
        var el = document.getElementById(currentRollingId);
        if (el) {
            el.classList.remove('marquee-active');
            var ts = el.querySelector('.artist-text');
            if (ts) { ts.style.animationDuration = ''; }
        }
    }
    currentRollingId = null;
}

/**
 * 启动跑马灯滚动（CSS 动画版）
 * @param {string} marqueeId - 要滚动的元素ID
 */
function startRoll(marqueeId) {
    if (!marqueeId) return;
    var el = document.getElementById(marqueeId);
    if (!el) return;
    var textSpan = el.querySelector('.artist-text');
    if (!textSpan) return;

    // 内容不超出，无需滚动
    if (textSpan.scrollWidth <= el.clientWidth) {
        el.scrollLeft = 0;
        return;
    }

    // 首次滚动：复制文本实现无缝循环
    if (!el.dataset.copied) {
        var originalText = textSpan.innerText;
        textSpan.innerText = originalText + '  ' + originalText;
        el.dataset.copied = 'true';
    }

    stopRoll();
    currentRollingId = marqueeId;

    // 计算动画时长：每 50px 约 1 秒，至少 3 秒
    var halfWidth = textSpan.scrollWidth / 2;
    var dur = Math.max(3, halfWidth / 50);
    textSpan.style.animationDuration = dur + 's';
    el.classList.add('marquee-active');
}

// ========== 全局分页状态 ==========
var _savedPageSize = parseInt(localStorage.getItem('ttplayer-page-size')) || 100;

var _folderPageState = {
    currentPage: 1,
    totalPages: 1,
    songs: [],
    pageSize: _savedPageSize
};

var _allSongsPageState = {
    currentPage: 1,
    totalPages: 1,
    filteredSongs: [],
    pageSize: _savedPageSize
};

// ========== 渲染函数（使用HTML模板） ==========

/**
 * 渲染全部歌曲模式（带分页优化）
 * @param {Array} songs - 所有歌曲
 * @param {Array} filtered - 过滤后的歌曲
 * @returns {Object} { wrapper, totalPages, pagination }
 */
/**
 * 直接渲染歌曲列表（用于收藏模式）
 */
function renderAllModeWithSongs(songs, globalIndices) {
    var container = document.createElement('div');
    container.className = 'fav-songs-wrapper';
    container.style.cssText = 'height:100%;overflow-y:auto;';
    if (songs.length === 0) {
        container.innerHTML = '<div style="padding:40px;text-align:center;opacity:0.5;"><i class="fas fa-heart" style="font-size:2rem;display:block;margin-bottom:10px;"></i>还没有收藏歌曲<br>点击歌曲旁的 ♡ 添加收藏</div>';
        return { wrapper: container };
    }
    songs.forEach(function(song, idx) {
        var itemTpl = getTemplate('template-song-item');
        if (itemTpl) {
            var itemEl = itemTpl.firstElementChild;
            itemEl.dataset.index = globalIndices ? globalIndices[idx] : idx;
            itemEl.dataset.src = song.src;
            itemTpl.querySelector('.song-index').textContent = idx + 1;
            itemTpl.querySelector('.artist-text').textContent = song.artist || '未知歌手';
            itemTpl.querySelector('.song-name').textContent = song.name;
            itemTpl.querySelector('.song-duration').textContent = song.duration || '--:--';
            var favIcon = itemTpl.querySelector('.fav-icon i');
            var favSet = window.favoriteSet;
            if (favIcon && favSet) {
                favIcon.className = favSet.has(song.src) ? 'fas fa-heart' : 'far fa-heart';
            }
            // 收藏点击直接绑定
            var favWrap = itemTpl.querySelector('.fav-icon');
            if (favWrap) {
                favWrap.onclick = function(e) {
                    e.stopPropagation();
                    var p = this.closest('.song-item');
                    if (!p) return;
                    var s = p.dataset.src;
                    if (!s || !window.favoriteSet) return;
                    window.favoriteSet.delete(s);
                    localStorage.setItem('ttplayer-fav', JSON.stringify(Array.from(window.favoriteSet)));
                    p.remove();
                    // 如果全部移除完了显示空提示
                    if (container.querySelectorAll('.song-item').length === 0) {
                        container.innerHTML = '<div style="padding:40px;text-align:center;opacity:0.5;"><i class="fas fa-heart" style="font-size:2rem;display:block;margin-bottom:10px;"></i>还没有收藏歌曲<br>点击歌曲旁的 ♡ 添加收藏</div>';
                    }
                };
            }
            container.appendChild(itemTpl);
        }
    });
    return { wrapper: container };
}

function renderAllMode(songs, filtered) {
    var container = document.createElement('div');
    container.className = 'normal-songs-wrapper';

    if (filtered.length === 0) {
        var emptyTpl = getTemplate('template-empty-list');
        if (emptyTpl) {
            emptyTpl.querySelector('.empty-message').textContent = '没有找到匹配的歌曲';
            container.appendChild(emptyTpl);
        }
        return { wrapper: container, totalPages: 1, filteredSongs: [] };
    }

    // 过滤掉虚拟文件夹和目录条目（AList 占位用，不显示在全部歌曲视图）
    var realFiltered = filtered.filter(function(s) { return !s._virtualFolder && !s._alistDir; });
    // 只显示已勾选文件夹内的歌曲，没有勾选则显示空
    if (window._checkedFolders && window._checkedFolders.size > 0) {
        realFiltered = realFiltered.filter(function(s) {
            var srcKey = s.sourceId || s.source || '';
            var matchPath = s._fullFolderPath || s.folder || '';
            var folderKey = srcKey + '::' + matchPath;
            return window._checkedFolders.has(folderKey);
        });
    } else {
        realFiltered = [];
    }

    // 空列表提示
    if (realFiltered.length === 0) {
        var emptyTpl = getTemplate('template-empty-list');
        if (emptyTpl) {
            var msg = (!window._checkedFolders || window._checkedFolders.size === 0)
                ? '请先在「文件夹」中勾选要收听的目录' : '没有找到匹配的歌曲';
            emptyTpl.querySelector('.empty-message').textContent = msg;
            container.appendChild(emptyTpl);
        }
        return { wrapper: container, totalPages: 1, filteredSongs: [] };
    }

    // 分页计算
    var pageSize = _allSongsPageState.pageSize;
    var totalPages = Math.max(1, Math.ceil(realFiltered.length / pageSize));

    // 修正页码边界
    if (_allSongsPageState.currentPage > totalPages) _allSongsPageState.currentPage = totalPages;
    if (_allSongsPageState.currentPage < 1) _allSongsPageState.currentPage = 1;

    var start = (_allSongsPageState.currentPage - 1) * pageSize;
    var pageSongs = realFiltered.slice(start, start + pageSize);

    // 构建索引 Map（避免 indexOf 每次 O(n) 扫描全列表）
    var _idxMap = {};
    for (var _im = 0; _im < songs.length; _im++) { if (songs[_im].src) _idxMap[songs[_im].src] = _im; }
    // 渲染当前页歌曲
    pageSongs.forEach(function(song, idx) {
        var globalIdx = _idxMap[song.src] !== undefined ? _idxMap[song.src] : songs.indexOf(song);
        var itemTpl = getTemplate('template-song-item');
        if (itemTpl) {
            itemTpl.firstElementChild.dataset.index = globalIdx;
            itemTpl.firstElementChild.dataset.src = song.src;
            itemTpl.querySelector('.song-index').textContent = start + idx + 1;
            itemTpl.querySelector('.artist-text').textContent = song.artist || '未知歌手';
            itemTpl.querySelector('.song-name').textContent = song.name;
            itemTpl.querySelector('.song-duration').textContent = song.duration || '--:--';
            var favIcon = itemTpl.querySelector('.fav-icon i');
            var favSet = window.favoriteSet;
            if (favIcon && favSet) {
                favIcon.className = favSet.has(song.src) ? 'fas fa-heart' : 'far fa-heart';
            }
            container.appendChild(itemTpl);
        }
    });

    return {
        wrapper: container,
        totalPages: totalPages,
        filteredSongs: realFiltered
    };
}

/**
 * 渲染文件夹内歌曲（带分页）
 * @param {Array} songs - 所有歌曲
 * @param {Array} filtered - 过滤后的歌曲
 * @param {string} folderPath - 当前文件夹路径
 * @returns {Object} { wrapper, totalPages, folderSongs }
 */
function renderFolderSongs(songs, filtered, folderPath) {
    var wrapper = document.createElement('div');
    wrapper.className = 'folder-songs-wrapper';

    // 过滤出当前文件夹的歌曲
    var folderSongs = filtered.filter(function(s) { return s.folder === folderPath && !s._virtualFolder; });
    var pageSize = _folderPageState.pageSize;
    var totalPages = Math.max(1, Math.ceil(folderSongs.length / pageSize));

    // 修正页码边界
    if (_folderPageState.currentPage > totalPages) _folderPageState.currentPage = totalPages;
    if (_folderPageState.currentPage < 1) _folderPageState.currentPage = 1;

    var start = (_folderPageState.currentPage - 1) * pageSize;
    var pageSongs = folderSongs.slice(start, start + pageSize);

    if (pageSongs.length === 0) {
        var emptyTpl = getTemplate('template-empty-list');
        if (emptyTpl) {
            emptyTpl.querySelector('.empty-message').textContent = '没有找到歌曲';
            wrapper.appendChild(emptyTpl);
        }
        return { wrapper: wrapper, totalPages: totalPages, folderSongs: folderSongs };
    }

    var _idxMap2 = {};
    for (var _im2 = 0; _im2 < songs.length; _im2++) { if (songs[_im2].src) _idxMap2[songs[_im2].src] = _im2; }
    pageSongs.forEach(function(song, idx) {
        var globalIdx = _idxMap2[song.src] !== undefined ? _idxMap2[song.src] : songs.indexOf(song);
        var itemTpl = getTemplate('template-song-item');
        if (itemTpl) {
            itemTpl.firstElementChild.dataset.index = globalIdx;
            itemTpl.firstElementChild.dataset.src = song.src;
            itemTpl.querySelector('.song-index').textContent = start + idx + 1;
            itemTpl.querySelector('.artist-text').textContent = song.artist || '未知歌手';
            itemTpl.querySelector('.song-name').textContent = song.name;
            itemTpl.querySelector('.song-duration').textContent = song.duration || '--:--';
            // 收藏图标
            var favIcon = itemTpl.querySelector('.fav-icon i');
            var favSet = window.favoriteSet;
            if (favIcon && favSet) {
                favIcon.className = favSet.has(song.src) ? 'fas fa-heart' : 'far fa-heart';
            }
            wrapper.appendChild(itemTpl);
        }
    });

    return { wrapper: wrapper, totalPages: totalPages, folderSongs: folderSongs };
}

/**
 * 渲染分页控件（通用）
 * @param {number} currentPage - 当前页
 * @param {number} totalPages - 总页数
 * @param {string} mode - 模式 ('folder' 或 'all')
 * @returns {DocumentFragment|null} 分页控件
 */
function renderPagination(currentPage, totalPages, mode) {
    if (totalPages <= 1) return null;
    var tpl = getTemplate('template-pagination');
    if (!tpl) return null;
    tpl.querySelector('.page-info').textContent = currentPage + ' / ' + totalPages;
    var prevBtn = tpl.querySelector('[data-page="prev"]');
    var nextBtn = tpl.querySelector('[data-page="next"]');
    if (currentPage <= 1) prevBtn.disabled = true;
    if (currentPage >= totalPages) nextBtn.disabled = true;
    tpl.firstElementChild.dataset.mode = mode;
    // 同步每页数量选择器的当前值
    var sel = tpl.querySelector('.page-size-select');
    if (sel) {
        var curSize = String(mode === 'all' ? _allSongsPageState.pageSize : _folderPageState.pageSize);
        sel.value = curSize;
        if (sel.value !== curSize) sel.selectedIndex = 0;
    }
    return tpl;
}

/**
 * 渲染文件夹根目录（按来源分组，带分隔线和删除按钮）
 * @param {Array} songs - 所有歌曲
 * @param {Array} filtered - 过滤后的歌曲
 * @returns {HTMLElement} 文件夹网格容器
 */
function renderFolderRoot(songs, filtered) {
    var gridWrapper = document.createElement('div');
    gridWrapper.className = 'folder-grid-wrapper';

    // 按来源 ID 分组（每个来源独立，同 URL 也不合并）
    // 只显示原始文件夹结构，跳过动态勾选加载的歌曲（_alistFile）
    var sourceMap = {};
    filtered.forEach(function(s) {
        if (s._alistFile || s._checkedFile || s._alistDir) return;  // 跳过 AList 动态加载的文件/子目录，只保留虚拟文件夹用于来源分组
        var srcKey = s.sourceId || s.source;
        if (!srcKey) return;
        if (!sourceMap[srcKey]) {
            sourceMap[srcKey] = {
                name: s.sourceName || srcKey,
                isDefault: s.isDefault || false,
                folders: {}
            };
        }
        if (s.folder) {
            sourceMap[srcKey].folders[s.folder] = true;
        }
    });

    var srcKeys = Object.keys(sourceMap);

    // 空状态（使用flex居中，不是grid）
    if (srcKeys.length === 0) {
        gridWrapper.style.display = 'flex';
        gridWrapper.style.flexDirection = 'column';
        gridWrapper.style.alignItems = 'center';
        gridWrapper.style.justifyContent = 'center';
        gridWrapper.style.gridTemplateColumns = 'none';
        var emptyTpl = getTemplate('template-empty-list');
        if (emptyTpl) {
            var msg = filtered.length ? '没有找到匹配的文件夹' : '暂无音乐库，点击"添加"按钮添加';
            emptyTpl.querySelector('.empty-message').textContent = msg;
            gridWrapper.appendChild(emptyTpl);
        }
        return gridWrapper;
    }

    // 遍历每个来源
    srcKeys.forEach(function(srcKey) {
        var src = sourceMap[srcKey];

        // 1. 添加来源分隔线（带地址、日期、删除图标）
        var dividerTpl = getTemplate('template-source-divider');
        if (dividerTpl) {
            dividerTpl.firstElementChild.dataset.source = srcKey;
            dividerTpl.firstElementChild.dataset.isDefault = src.isDefault;

            // 获取来源详情（按 ID 查找，支持独立分组）
            var sources = getMusicSources();
            var sourceInfo = null;
            for (var si = 0; si < sources.length; si++) {
                if (sources[si].id === srcKey || sources[si].url === srcKey) {
                    sourceInfo = sources[si];
                    break;
                }
            }
            if (sourceInfo && sourceInfo.id) {
                dividerTpl.firstElementChild.dataset.sourceId = sourceInfo.id;
            }

            var icon = dividerTpl.querySelector('.source-divider-label i');
            icon.className = 'fas fa-home';
            dividerTpl.querySelector('.source-name').textContent = src.name;

            // 添加日期（只显示年月日）
            var dateEl = dividerTpl.querySelector('.source-date-display');
            if (dateEl && sourceInfo && sourceInfo.date) {
                dateEl.textContent = sourceInfo.date.split(' ')[0];
            }

            // 默认来源不显示删除按钮（已无默认来源，保留逻辑备用）
            if (src.isDefault) {
                var deleteBtn = dividerTpl.querySelector('.source-divider-delete');
                if (deleteBtn) deleteBtn.style.display = 'none';
            }
            gridWrapper.appendChild(dividerTpl);
        }

        // 2. 添加该来源下的所有文件夹
        var folders = Object.keys(src.folders);
        folders.forEach(function(folderName) {
            var folderTpl = getTemplate('template-folder-item');
            if (folderTpl) {
                folderTpl.firstElementChild.dataset.path = folderName;
                folderTpl.firstElementChild.dataset.source = srcKey;
                var scrollEl = folderTpl.querySelector('.folder-name-scroll');
                if (scrollEl) {
                    scrollEl.textContent = folderName;
                    // 等DOM挂载后再检测是否溢出
                    setTimeout(function(el, text) {
                        var parent = el.parentNode;
                        if (parent && el.scrollWidth > parent.clientWidth) {
                            // 内容溢出：复制文本实现无缝滚动
                            el.innerHTML = '<span>' + escapeHtml(text) + '</span><span>' + escapeHtml(text) + '</span>';
                            var dur = Math.max(4, text.length * 3);
                            el.style.animationDuration = dur + 's';
                            el.classList.add('marquee-active');
                        } else if (el) {
                            el.textContent = text;
                        }
                    }, 50, scrollEl, folderName);
                }
                // 显示文件夹勾选状态
                var folderKey = srcKey + '::' + folderName;
                if (window._checkedFolders && window._checkedFolders.has(folderKey)) {
                    folderTpl.firstElementChild.classList.add('checked');
                    var cbIcon = folderTpl.querySelector('.folder-checkbox i');
                    if (cbIcon) { cbIcon.className = 'fas fa-check-square'; }
                }
                gridWrapper.appendChild(folderTpl);
            }
        });
    });

    return gridWrapper;
}

/**
 * 渲染导航栏
 * @param {string} folderPath - 当前路径（空表示根目录）
 * @returns {DocumentFragment|null} 导航栏
 */
function renderNavBar(folderPath) {
    if (folderPath) {
        var tpl = getTemplate('template-folder-nav-sub');
        if (tpl) {
            tpl.querySelector('.folder-path-value').textContent = folderPath;
            tpl.querySelector('.folder-path-value').title = folderPath;
            return tpl;
        }
    } else {
        var tpl = getTemplate('template-folder-nav-root');
        if (tpl) return tpl;
    }
    return null;
}

/**
 * 主渲染函数
 * @param {Array} songs - 所有歌曲
 * @param {string} searchText - 搜索关键词
 * @param {string} viewMode - 视图模式 ('all' 或 'folder')
 * @param {string} folderPath - 文件夹路径
 * @returns {HTMLElement} 渲染后的容器
 */
function renderList(songs, searchText, viewMode, folderPath,flist) {

    console.log("flist3", flist);
    console.log("flist3", folderPath);

    var container = document.createElement('div');
    container.className = 'folder-view-container';

    var filtered = songs;
    if (searchText && searchText.trim()) {
        var kw = searchText.trim().toLowerCase();
        var hasFlist = flist && flist.length > 0;

        filtered = songs.filter(function(s) {
            // 1. 推荐文件夹（_virtualFolder）直接通过
            if (s._virtualFolder) return true;

            // 2. flist 路径匹配：仅对 AList 条目按搜索结果路径过滤
            if (hasFlist && (s._alistDirPath || s._alistFilePath || s._alistDir || s._alistFile)) {
                var sPath = s._fullFolderPath || s.folder || s._alistFilePath || '';
                var matchFlist = false;
                for (var i = 0; i < flist.length; i++) {
                    if (flist[i].indexOf(sPath) >= 0 || sPath.indexOf(flist[i].replace(/^\/+/, '')) >= 0) {
                        matchFlist = true;
                        break;
                    }
                }
                if (!matchFlist) return false;
            }

            // 3. 歌名或歌手匹配关键词
            return matchSearchText(s, kw);
        });

        // 搜索时重置页码
        _allSongsPageState.currentPage = 1;
        _folderPageState.currentPage = 1;
    }

    // AList 搜索结果目录过滤：只保留 flist 中可达的虚拟文件夹
    if (flist && flist.length > 0) {
        filtered = filtered.filter(function(s) {
            return matchFlist(s, flist);
        });
    }

    if (viewMode === 'fav') {
        // 收藏模式 - 只显示收藏的歌曲（跳过虚拟文件夹等不可播放条目）
        var favSet = window.favoriteSet || new Set();
        var favSongs = filtered.filter(function(s) {
            return !s._virtualFolder && !s._alistDir && favSet.has(s.src);
        });
        // 为每首收藏歌曲找到全局索引（供 playback fallback 用）
        var favGlobalIdx = favSongs.map(function(fs) { return songs.indexOf(fs); });
        var favResult = renderAllModeWithSongs(favSongs, favGlobalIdx);
        container.appendChild(favResult.wrapper);
    } else if (viewMode === 'folder') {
        // 添加导航栏
        var navBar = renderNavBar(folderPath);
        if (navBar) container.appendChild(navBar);

        if (folderPath) {
            // 文件夹内歌曲（分页）
            var result = renderFolderSongs(songs, filtered, folderPath);
            container.appendChild(result.wrapper);
            _folderPageState.songs = result.folderSongs;
            _folderPageState.totalPages = result.totalPages;

            var pagination = renderPagination(_folderPageState.currentPage, result.totalPages, 'folder');
            if (pagination) container.appendChild(pagination);
        } else {
            // 根目录：显示所有来源的文件夹
            var folderGrid = renderFolderRoot(songs, filtered);
            container.appendChild(folderGrid);
        }
    } else {
        // 全部歌曲模式（带分页优化）
        var allResult = renderAllMode(songs, filtered);
        container.appendChild(allResult.wrapper);
        _allSongsPageState.filteredSongs = allResult.filteredSongs;
        _allSongsPageState.totalPages = allResult.totalPages;

        var pagination = renderPagination(_allSongsPageState.currentPage, allResult.totalPages, 'all');
        if (pagination) container.appendChild(pagination);
    }

    return container;
}

// ========== 事件绑定 ==========

/**
 * 绑定UI事件
 * @param {HTMLElement} container - 容器元素
 * @param {Array} playlist - 播放列表
 * @param {Function} playCallback - 播放回调
 * @param {Function} folderCallback - 文件夹回调
 */
function attachSongEvents(container, playlist, playCallback, folderCallback) {
    if (!container) return;

    // 统一事件委托（歌曲、收藏、文件夹、返回、来源、刷新、添加）
    container.onclick = function(e) {
        var t = e.target;

        // 收藏图标
        var icon = t.closest('.fav-icon');
        if (icon) {
            e.stopPropagation();
            var item = icon.closest('.song-item');
            if (!item || !window.toggleFavorite) return;
            var src = item.dataset.src;
            if (src) { window.toggleFavorite(src, item); return; }
        }

        // 歌曲播放：用 src 在当前 allSongsMaster 中查找（避免旧闭包引用）
        var songItem = t.closest('.song-item');
        if (songItem && playCallback) {
            e.stopPropagation();
            var src = songItem.dataset.src;
            var master = window.allSongsMaster || playlist || [];
            if (src && master) {
                for (var _pi = 0; _pi < master.length; _pi++) {
                    if (master[_pi].src === src) { playCallback(_pi); return; }
                }
            }
            // 兜底：用 data-index
            var idx = parseInt(songItem.dataset.index);
            if (!isNaN(idx)) { playCallback(idx); return; }
        }

        // 文件夹勾选框（7 秒防抖：只阻止重复勾选，取消不受限）
        var checkboxEl = t.closest('.folder-checkbox');
        if (checkboxEl) {
            var folderItem = checkboxEl.closest('.folder-item.grid-box');
            if (!folderItem) return;
            // AList 子目录由 renderAListGrid 的委托处理（含级联勾选逻辑）
            if (folderItem.hasAttribute('data-alist')) return;
            e.stopPropagation();
            var srcKey = folderItem.dataset.source || '';
            var path = folderItem.dataset.path || '';
            var folderKey = srcKey + '::' + path;
            if (!window._checkedFolders) window._checkedFolders = new Set();

            // 7 秒防抖：只对「未勾选→勾选」生效，阻止重复触发
            if (!window._checkedFolders.has(folderKey)) {
                if (!window._checkTimers) window._checkTimers = {};
                var last = window._checkTimers[folderKey] || 0;
                if (Date.now() - last < 7000) return;
                window._checkTimers[folderKey] = Date.now();
            }

            if (window._checkedFolders.has(folderKey)) {
                // 取消勾选 — 无限制
                window._checkedFolders.delete(folderKey);
                if (typeof window.saveCheckedFolders === 'function') window.saveCheckedFolders();
                folderItem.classList.remove('checked');
                var cbIcon = checkboxEl.querySelector('i');
                if (cbIcon) cbIcon.className = 'far fa-square';
                if (typeof window.onFolderCheck === 'function') {
                    window.onFolderCheck(srcKey, path, false);
                }
            } else {
                // 勾选
                window._checkedFolders.add(folderKey);
                if (typeof window.saveCheckedFolders === 'function') window.saveCheckedFolders();
                folderItem.classList.add('checked');
                var cbIcon = checkboxEl.querySelector('i');
                if (cbIcon) cbIcon.className = 'fas fa-check-square';
                if (typeof window.onFolderCheck === 'function') {
                    window.onFolderCheck(srcKey, path, true);
                }
            }
            return;
        }

        // 文件夹点击（非勾选框区域）：进入文件夹（AList 的由 renderAListGrid 处理）
        var folderItem = t.closest('.folder-item.grid-box');
        if (folderItem && folderItem.hasAttribute('data-alist')) return;
        if (folderItem && folderCallback) {
            e.stopPropagation();
            folderCallback('folder', folderItem.dataset.path || '', folderItem.dataset.source || '');
            return;
        }

        // 返回按钮（AList 的 data-alist="back" 由 renderAListGrid 处理，逐级返回）
        var backItem = t.closest('.back-item');
        if (backItem && backItem.hasAttribute('data-alist')) return;
        if (backItem && folderCallback) {
            e.stopPropagation();
            folderCallback('back', '');
            return;
        }

        // 刷新按钮（1秒防抖 + 居中转圈 Toast）
        var refreshBtn = t.closest('#forceRefreshCache');
        if (refreshBtn) {
            e.stopPropagation();
            var now = Date.now();
            if (window._lastRefreshTime && now - window._lastRefreshTime < 1000) return;
            window._lastRefreshTime = now;
            // 居中加载 Toast
            var loadingToast = document.createElement('div');
            loadingToast.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);';
            loadingToast.innerHTML = '<div style="background:#2a2a3a;border-radius:10px;padding:20px 30px;text-align:center;"><div style="width:30px;height:30px;border:3px solid rgba(255,255,255,0.2);border-top-color:#88ccff;border-radius:50%;animation:spin 0.6s linear infinite;margin:0 auto 10px;"></div><div style="font-size:13px;color:#eee;">正在刷新...</div></div>';
            document.body.appendChild(loadingToast);
            refreshBtn.classList.add('is-refreshing');
            if (typeof refreshList === 'function') refreshList();
            if (typeof initLibrary === 'function') {
                initLibrary().catch(function() {}).then(function() {
                    refreshBtn.classList.remove('is-refreshing');
                    if (typeof markViewDirty === 'function') { markViewDirty('all'); markViewDirty('folder'); markViewDirty('fav'); }
                    setTimeout(function() { if (loadingToast.parentNode) loadingToast.remove(); }, 1000);
                });
            } else {
                setTimeout(function() { if (loadingToast.parentNode) loadingToast.remove(); }, 1000);
            }
            return;
        }

        // 来源标签弹框
        var sourceLabel = t.closest('.source-divider-label');
        if (sourceLabel) {
            e.stopPropagation();
            var div = sourceLabel.parentNode;
            while (div && !div.classList.contains('source-divider')) div = div.parentNode;
            if (!div) return;
            var url = div.getAttribute('data-source') || '';
            var nameEl = sourceLabel.querySelector('.source-name');
            if (typeof showSourceUrlDialog === 'function') {
                showSourceUrlDialog(nameEl ? nameEl.textContent : '来源', url);
            }
            return;
        }

        // 添加来源按钮
        var addBtn = t.closest('#addSourceBtn');
        if (addBtn && typeof showAddSourceDialog === 'function') {
            e.stopPropagation();
            showAddSourceDialog();
            return;
        }
    };

    // 6. 删除来源（使用 source-id，支持重复地址）
    var deleteBtns = container.querySelectorAll('.source-divider-delete');
    for (var di = 0; di < deleteBtns.length; di++) {
        deleteBtns[di].onclick = function(e) {
            e.stopPropagation();
            var div = this.parentNode;
            while (div && !div.classList.contains('source-divider')) div = div.parentNode;
            if (!div) return;
            var sourceId = div.getAttribute('data-source-id') || '';
            var nameEl = div.querySelector('.source-name');
            var sourceName = nameEl ? nameEl.textContent : '来源';
            showDeleteConfirmDialog(sourceId, sourceName);
        };
    }

    // 7. 分页按钮（支持 folder 和 all 两种模式）
    container.querySelectorAll('.page-btn').forEach(function(btn) {
        btn.onclick = function(e) {
            e.stopPropagation();
            if (this.disabled) return;
            var action = this.dataset.page;
            var mode = this.closest('.pagination-bar')?.dataset.mode || 'folder';

            if (mode === 'all') {
                if (action === 'prev' && _allSongsPageState.currentPage > 1) {
                    _allSongsPageState.currentPage--;
                } else if (action === 'next' && _allSongsPageState.currentPage < _allSongsPageState.totalPages) {
                    _allSongsPageState.currentPage++;
                }
            } else {
                if (action === 'prev' && _folderPageState.currentPage > 1) {
                    _folderPageState.currentPage--;
                } else if (action === 'next' && _folderPageState.currentPage < _folderPageState.totalPages) {
                    _folderPageState.currentPage++;
                }
            }
            if (typeof refreshList === 'function') refreshList();
        };
    });

    // 8. 每页数量选择器
    container.querySelectorAll('.page-size-select').forEach(function(sel) {
        sel.onchange = function(e) {
            e.stopPropagation();
            var newSize = parseInt(this.value);
            if (isNaN(newSize) || newSize < 1) return;
            var mode = this.closest('.pagination-bar')?.dataset.mode || 'folder';
            localStorage.setItem('ttplayer-page-size', newSize);
            if (mode === 'all') {
                _allSongsPageState.pageSize = newSize;
                _allSongsPageState.currentPage = 1;
            } else {
                _folderPageState.pageSize = newSize;
                _folderPageState.currentPage = 1;
            }
            if (typeof refreshList === 'function') refreshList();
        };
    });
}

// ========== 高亮当前播放歌曲 ==========

/**
 * 高亮当前播放的歌曲，并启动跑马灯
 * @param {HTMLElement} container - 容器
 * @param {Array} playlist - 播放列表
 * @param {number} currentIndex - 当前播放索引
 */
function highlightCurrentSong(container, playlist, currentIndex) {
    if (!container) return;
    resetRoll();
    container.querySelectorAll('.song-item').forEach(function(item) {
        var idx = parseInt(item.dataset.index);
        if (idx === currentIndex) {
            item.classList.add('active');
            var marquee = item.querySelector('.artist-marquee');
            if (marquee) {
                var mId = 'marquee_active_' + idx;
                marquee.id = mId;
                startRoll(mId);
            }
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * 更新播放按钮图标
 * @param {HTMLElement} btn - 按钮元素
 * @param {boolean} isPlaying - 是否正在播放
 */
function updatePlayButton(btn, isPlaying) {
    if (btn) btn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

// ========== 添加来源弹窗（支持多种协议） ==========

/**
 * 检测地址是否重复
 */
function isDuplicateSourceUrl(url) {
    var sources = getMusicSources();
    for (var i = 0; i < sources.length; i++) {
        if (sources[i].url === url) return true;
    }
    return false;
}

/**
 * 显示重复地址警告弹框
 */
function showDuplicateWarning(url) {
    var overlay = document.createElement('div');
    overlay.className = 'add-source-overlay';
    overlay.innerHTML =
        '<div class="add-source-dialog dialog-warning">' +
        '<div class="dialog-title"><i class="fas fa-exclamation-triangle" style="color:#f0a030;"></i> 地址重复</div>' +
        '<div class="dialog-body">' +
        '<p style="font-size:12px;color:#ccc;">该地址已添加过：</p>' +
        '<p style="font-size:11px;color:#999;word-break:break-all;padding:6px 0;">' + escapeHtml(url) + '</p>' +
        '</div>' +
        '<div class="dialog-actions">' +
        '<button class="dialog-btn confirm" id="dupOkBtn">知道了</button>' +
        '</div>' +
        '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#dupOkBtn').onclick = function() { overlay.remove(); };
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
}

/**
 * 显示删除确认弹框
 */
function showDeleteConfirmDialog(sourceId, sourceName) {
    var overlay = document.createElement('div');
    overlay.className = 'add-source-overlay';
    overlay.innerHTML =
        '<div class="add-source-dialog dialog-delete">' +
        '<div class="dialog-title"><i class="fas fa-trash-alt" style="color:#e74c3c;"></i> 删除来源</div>' +
        '<div class="dialog-body">' +
        '<p style="font-size:12px;color:#ccc;">确定要删除以下音乐来源吗？</p>' +
        '<p style="font-size:11px;color:#e74c3c;font-weight:500;padding:4px 0;">' + escapeHtml(sourceName) + '</p>' +
        '<p style="font-size:10px;color:#888;word-break:break-all;padding:2px 0;">' + escapeHtml(sourceId) + '</p>' +
        '</div>' +
        '<div class="dialog-actions">' +
        '<button class="dialog-btn cancel" id="delCancelBtn">取消</button>' +
        '<button class="dialog-btn confirm" id="delConfirmBtn" style="background:#c0392b;">确认删除</button>' +
        '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#delCancelBtn').onclick = function() { overlay.remove(); };
    overlay.querySelector('#delConfirmBtn').onclick = function() {
        if (typeof removeMusicSource === 'function') {
            removeMusicSource(sourceId);
            overlay.remove();
            if (typeof initLibrary === 'function') {
                initLibrary().then(function() {
                    if (typeof refreshList === 'function') refreshList();
                });
            }
        }
    };
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
}

/**
 * 显示来源地址弹框（点击别名时弹出）
 */
function showSourceUrlDialog(name, url) {
    var overlay = document.createElement('div');
    overlay.className = 'add-source-overlay';
    overlay.innerHTML =
        '<div class="add-source-dialog" style="max-width:400px;">' +
        '<div class="dialog-title"><i class="fas fa-link" style="color:#4da6ff;"></i> ' + escapeHtml(name) + '</div>' +
        '<div class="dialog-body">' +
        '<label>来源地址</label>' +
        '<p style="font-size:11px;color:#ccc;word-break:break-all;padding:6px 0;background:rgba(0,0,0,0.2);border-radius:4px;padding:8px;">' + escapeHtml(url) + '</p>' +
        '<div class="dialog-hint">可在添加来源时设置别名，方便识别</div>' +
        '</div>' +
        '<div class="dialog-actions">' +
        '<button class="dialog-btn confirm" id="urlOkBtn">知道了</button>' +
        '</div>' +
        '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#urlOkBtn').onclick = function() { overlay.remove(); };
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
}

/**
 * 显示添加音乐库的弹窗
 */
/**
 * 显示添加音乐库的弹窗（支持 HTTP / WebDAV / AList 三种协议）
 */
function showAddSourceDialog() {
    var overlay = document.createElement('div');
    overlay.className = 'add-source-overlay';
    overlay.innerHTML =
        '<div class="add-source-dialog" style="width: 500px;">' +
        '<div class="dialog-title" style="padding: 14px 0 8px 0;"><i class="fas fa-plus-circle"></i> 添加音乐来源</div>' +
        '<div class="dialog-body">' +

        '<div style="margin-bottom: 14px;">' +
        '<label>来源名称 <span style="opacity:0.5;">（可选）</span></label>' +
        '<input type="text" id="newSourceName" placeholder="例如：我的音乐库、AList服务器...">' +
        '</div>' +

        '<div style="margin-bottom: 14px;">' +
        '<label>协议类型</label>' +
        '<div class="dialog-radio-group">' +
        '<label><input type="radio" name="protocol" value="http" checked><span>HTTP / HTTPS</span><span class="dialog-hint" style="display:inline;margin:0 0 0 4px;">（无需认证）</span></label>' +
        '<label><input type="radio" name="protocol" value="alist"><span>AList API</span><span class="dialog-hint" style="display:inline;margin:0 0 0 4px;">（需用户名密码）</span></label>' +

        '</div>' +
        '</div>' +

        '<div style="margin-bottom: 14px;">' +
        '<label>服务器地址 <span style="color:#e74c3c;">*</span></label>' +
        '<input  id="newSourceUrl" placeholder="http://192.168.1.100:5244">' +
        '</div>' +

        '<div id="authFields" style="display: none;">' +
        '<div style="margin-bottom: 10px;">' +
        '<label>用户名</label>' +
        '<input  id="newSourceUser" placeholder="admin">' +
        '</div>' +
        '<div style="margin-bottom: 10px;">' +
        '<label>密码</label>' +
        '<input  id="newSourcePass" placeholder="密码">' +
        '</div>' +
        '<div id="authHintAlist" class="dialog-hint" style="display:none;padding:6px 8px;background:rgba(77,166,255,0.08);border-left:2px solid #4da6ff;border-radius:4px;margin-bottom:8px;">' +
        '<i class="fas fa-info-circle" style="color:#4da6ff;margin-right:6px;"></i>AList示例：http://192.168.1.100:5244（填写后台地址，自动调用 API 扫描）' +
        '</div>' +

        '</div>' +

        '<div class="dialog-hint" style="padding:6px 8px;border-radius:4px;">' +
        '<i class="fas fa-info-circle" style="margin-right:6px;"></i>HTTP/HTTPS 浏览器直接可用，AList API 需用户名密码' +
        '</div>' +

        '<div class="dialog-actions">' +
        '<button class="dialog-btn cancel" id="cancelAddSource">取消</button>' +
        '<button class="dialog-btn confirm" id="confirmAddSource">添加</button>' +
        '</div>' +
        '</div>' +
        '</div>';

    document.body.appendChild(overlay);

    // Electron 兼容：确保输入框和按钮能接收事件
    overlay.querySelectorAll('input, textarea, button, .dialog-actions *').forEach(function(_el) {
        _el.style.setProperty('-webkit-user-select', 'text', 'important');
        _el.style.setProperty('user-select', 'text', 'important');
        _el.style.setProperty('pointer-events', 'auto', 'important');
    });

    var urlInput = overlay.querySelector('#newSourceUrl');
    var nameInput = overlay.querySelector('#newSourceName');
    var radioHttp = overlay.querySelector('input[value="http"]');
    var radioAlist = overlay.querySelector('input[value="alist"]');
    var authFields = overlay.querySelector('#authFields');
    var authHintAlist = overlay.querySelector('#authHintAlist');
    var userInput = overlay.querySelector('#newSourceUser');
    var passInput = overlay.querySelector('#newSourcePass');

    function toggleAuthFields() {
        authFields.style.display = radioAlist.checked ? 'block' : 'none';
        authHintAlist.style.display = radioAlist.checked ? 'block' : 'none';
    }

    radioHttp.onchange = toggleAuthFields;
    radioAlist.onchange = toggleAuthFields;

    toggleAuthFields();

    urlInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') overlay.querySelector('#confirmAddSource').click();
    });

    overlay.querySelector('#cancelAddSource').addEventListener('click', function(e) {
        e.stopPropagation();
        overlay.remove();
    });

    overlay.querySelector('#confirmAddSource').addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('🔘 确认添加来源');
        var url = urlInput.value.trim().replace(/\/+$/, '');
        var name = nameInput.value.trim();
        var protocol = 'http';
        if (radioAlist.checked) protocol = 'alist';

        var username = userInput.value.trim();
        var password = passInput.value.trim();

        if (!url) { alert('请输入服务器地址'); return; }

        if (protocol === 'alist') {
            if (!username || !password) {
                alert('AList 需要填写用户名和密码');
                return;
            }
        }

        if (isDuplicateSourceUrl(url)) {
            console.warn('该地址已添加过，将更新信息:', url);
        }

        if (typeof addMusicSource !== 'function') {
            alert('添加来源功能不可用，请确认 musicLibrary.js 已加载');
            return;
        }

        addMusicSource(url, name, protocol, username, password);
        overlay.remove();
        if (typeof initLibrary === 'function') {
            initLibrary().then(function() {
                if (typeof markViewDirty === 'function') { markViewDirty('all'); markViewDirty('folder'); markViewDirty('fav'); }
                if (typeof refreshList === 'function') refreshList();
            });
        }
    });

    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    setTimeout(function() { urlInput.focus(); }, 100);
}

// ========== 居中扫描进度 Toast ==========
var _scanToast = null;
function showScanToast() {
    // 立即移除旧 toast，不等 1.5 秒
    if (_scanToast && _scanToast.parentNode) { try { _scanToast.remove(); } catch(e) {} _scanToast = null; }
    _scanToast = document.createElement('div');
    _scanToast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99998;padding:10px 24px;border-radius:8px;background:rgba(30,30,30,0.92);box-shadow:0 4px 16px rgba(0,0,0,0.5);text-align:center;pointer-events:none;';
    _scanToast.innerHTML = '<div id="scanToastText" style="font-size:13px;color:#eee;line-height:1.8;">正在读取目录...</div>';
    document.body.appendChild(_scanToast);
    // 无交互遮挡，等待自动关闭
}
function updateScanToast(folders, songs) {
    var el = document.getElementById('scanToastText');
    if (!el) return;
    // 数字动画
    var curText = el.innerHTML;
    var matchFolders = curText.match(/(\d+) 个目录/);
    var matchSongs = curText.match(/(\d+) 首歌曲/);
    var oldF = matchFolders ? parseInt(matchFolders[1]) : 0;
    var oldS = matchSongs ? parseInt(matchSongs[1]) : 0;
    el.innerHTML = '已扫描到 ' + folders + ' 个目录，<br><span class="num-anim">' + songs + '</span> 首歌曲';
    // 如果数字变了，加动画 class
    if (folders !== oldF || songs !== oldS) {
        var spans = el.querySelectorAll('.num-anim');
        spans.forEach(function(s) { s.style.animation = 'none'; setTimeout(function() { s.style.animation = 'numPop 0.3s ease'; }, 10); });
    }
}
function closeScanToast() {
    if (_scanToast && _scanToast.parentNode) {
        var el = document.getElementById('scanToastText');
        if (el) {
            var finalText = el.innerHTML;
            el.innerHTML = finalText.replace('已扫描到', '✅ 已完成');
            // 隐藏转圈
            var spinner = _scanToast.querySelector('div[style*="animation:spin"]');
            if (spinner) spinner.style.display = 'none';
            setTimeout(function() { if (_scanToast && _scanToast.parentNode) _scanToast.remove(); _scanToast = null; }, 1500);
            return;
        }
        _scanToast.remove();
    }
    _scanToast = null;
}
// 动画
var style = document.createElement('style');
style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes numPop{0%{transform:scale(1)}50%{transform:scale(1.3);color:#ffcc66}100%{transform:scale(1)}}';
document.head.appendChild(style);

// ========== 视图缓存已迁移到 main.js 容器隐藏/显示机制 ==========

// ========== 工具函数 ==========

/**
 * 检查 AList 条目是否在搜索结果路径 flist 中可达
 * @param {Object} s - 歌曲/目录条目
 * @param {Array} flist - AList 搜索结果路径列表（如 ["/抖音/热歌", ...]）
 * @returns {boolean}
 */
function matchFlist(s, flist) {
    if (!flist || !flist.length) return true;
    var path = s._alistDirPath || s._alistPath || s._alistFilePath || '';
    if (!path) return true;
    return flist.some(function(fp) { return fp.indexOf(path) === 0; });
}

/**
 * 按搜索关键词匹配歌曲名或歌手
 * @param {Object} s - 歌曲条目
 * @param {string} kw - 小写搜索关键词
 * @returns {boolean}
 */
function matchSearchText(s, kw) {
    return (s.name && s.name.toLowerCase().indexOf(kw) >= 0) ||
        (s.artist && s.artist.toLowerCase().indexOf(kw) >= 0);
}

/**
 * 从 allSongsMaster 中移除某 AList 来源的子目录/文件条目
 * @param {Array} master - allSongsMaster
 * @param {string} srcUrl - 来源 URL
 * @returns {Array} 过滤后的新数组
 */
function removeAListSubdirs(master, srcUrl) {
    return master.filter(function(s) {
        return s.source !== srcUrl || (!s._alistDir && !s._alistFile);
    });
}

// ========== 暴露全局变量/函数 ==========
window._folderPageState = _folderPageState;
window._allSongsPageState = _allSongsPageState;
window.renderList = renderList;
window.attachSongEvents = attachSongEvents;
window.matchFlist = matchFlist;
window.matchSearchText = matchSearchText;
window.removeAListSubdirs = removeAListSubdirs;
window.highlightCurrentSong = highlightCurrentSong;
window.updatePlayButton = updatePlayButton;
window.showAddSourceDialog = showAddSourceDialog;
window.showDeleteConfirmDialog = showDeleteConfirmDialog;
window.showSourceUrlDialog = showSourceUrlDialog;
window.isDuplicateSourceUrl = isDuplicateSourceUrl;
window.showScanToast = showScanToast;
window.updateScanToast = updateScanToast;
window.closeScanToast = closeScanToast;