// musicLibrary.js - 完整版（支持多来源）
// const DEFAULT_ROOT = 'http://192.168.5.232/music';  // 开发用默认库，现已注释

// ========== AList API 工具类 ==========
var AListAPI = (function() {
    var _tokens = JSON.parse(localStorage.getItem('ALIST_TOKENS') || '{}');
    function _saveTokens() { localStorage.setItem('ALIST_TOKENS', JSON.stringify(_tokens)); }
    async function _getToken(source) {
        var baseUrl = source.url.replace(/\/+$/, '');
        var cached = _tokens[source.id];
        if (cached && cached.baseUrl === baseUrl) return cached.token;
        var res = await fetch(baseUrl + '/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: source.auth.user, password: source.auth.pass })
        });
        var j = await res.json();
        if (j.code !== 200 || !j.data || !j.data.token) throw new Error(j.message || 'AList 登录失败');
        _tokens[source.id] = { token: j.data.token, baseUrl: baseUrl };
        _saveTokens(); return j.data.token;
    }
    async function _renewToken(sourceKey) {
        var sources = typeof getMusicSources === 'function' ? getMusicSources() : [];
        for (var i = 0; i < sources.length; i++) {
            if (sources[i].id === sourceKey || sources[i].url === sourceKey) {
                delete _tokens[sourceKey]; _saveTokens();
                return await _getToken(sources[i]);
            }
        }
        return null;
    }
    async function _request(source, apiPath, body) {
        var baseUrl = source.url.replace(/\/+$/, '');
        var token = await _getToken(source);
        var res = await fetch(baseUrl + apiPath, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify(body)
        });
        var j = await res.json();
        if (j.code === 401) {
            token = await _renewToken(source.id || source.url || '');
            if (!token) return null;
            var res2 = await fetch(baseUrl + apiPath, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify(body)
            });
            j = await res2.json();
        }
        return j;
    }
    return {
        listDir: async function(source, dirPath) {
            return await _request(source, '/api/fs/list', { path: dirPath, page: 1, per_page: 500, refresh: false });
        },
        search: async function(source, dirPath, keyword) {
            return await _request(source, '/api/fs/search', { parent: dirPath || '/', keywords: keyword, scope: 0, page: 1, per_page: 200 });
        },
        getFileInfo: async function(source, filePath) {
            return await _request(source, '/api/fs/get', { path: filePath });
        },
        renewToken: _renewToken,
        getToken: _getToken
    };
})();

// ========== 工具函数 ==========
function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return '--:--';
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs);
}

function cleanName(str) {
    if (!str) return '';
    let cleaned = str.replace(/^\d+[\s\.\-_]+/, '');
    cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z\s\.\-]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned || str;
}

function extractArtistFromFolder(folderName) {
    if (!folderName) return '未知歌手';
    let cleaned = folderName.replace(/专辑|全集|无损|flac|mp3|CD\d?|Disc\d?|部分|合集|精选|经典|歌曲|音乐|大全|收藏/g, '');
    cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '');
    cleaned = cleaned.trim();
    return cleaned || folderName;
}

function parseSongFile(filename) {
    let name = filename.replace(/\.(mp3|wav|flac|m4a|ogg)$/i, '');
    if (name.includes(' - ')) {
        const parts = name.split(' - ');
        let song = cleanName(parts[0]);
        let artist = cleanName(parts[1]);
        if (artist.length < 2 || /^\d+$/.test(artist)) {
            return { artist: null, song: cleanName(name) };
        }
        return { artist: artist, song: song };
    }
    return { artist: null, song: cleanName(name) };
}

// ========== 来源管理（v2：每个来源独立记录，支持重复地址） ==========
var SOURCES_KEY = 'MUSIC_SOURCES_V2';

// 从旧格式迁移
function migrateSources() {
    var data = localStorage.getItem(SOURCES_KEY);
    if (data) return JSON.parse(data);
    var oldUrls = JSON.parse(localStorage.getItem('CUSTOM_MUSIC_URLS') || '[]');
    if (oldUrls.length === 0) return [];
    var customNames = JSON.parse(localStorage.getItem('CUSTOM_MUSIC_NAMES') || '{}');
    var customDates = JSON.parse(localStorage.getItem('CUSTOM_MUSIC_DATES') || '{}');
    var protocols = JSON.parse(localStorage.getItem('SOURCE_PROTOCOLS') || '{}');
    var auths = JSON.parse(localStorage.getItem('SOURCE_AUTHS') || '{}');
    var sources = [];
    for (var i = 0; i < oldUrls.length; i++) {
        var url = oldUrls[i];
        sources.push({
            id: 's' + i + '_' + Date.now(),
            url: url,
            name: customNames[url] || url.replace(/^https?:\/\//, '').split('/')[0],
            date: customDates[url] || '',
            protocol: protocols[url] || 'http',
            auth: auths[url] || null
        });
    }
    localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
    // 清理旧数据
    ['CUSTOM_MUSIC_URLS','CUSTOM_MUSIC_NAMES','CUSTOM_MUSIC_DATES','SOURCE_PROTOCOLS','SOURCE_AUTHS'].forEach(function(k) { localStorage.removeItem(k); });
    return sources;
}

function getMusicSources() {
    var sources = migrateSources();
    return sources.map(function(s) {
        return {
            id: s.id,
            url: s.url,
            name: s.name || s.url.replace(/^https?:\/\//, '').split('/')[0],
            isDefault: false,
            date: s.date || '',
            protocol: s.protocol || 'http',
            auth: s.auth || null
        };
    });
}

function addMusicSource(url, name, protocol, username, password) {
    var sources = migrateSources();
    var now = new Date();
    var dateStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');

    sources.push({
        id: 's' + sources.length + '_' + Date.now(),
        url: url,
        name: (name && name.trim()) ? name.trim() : '',
        date: dateStr,
        protocol: protocol || 'http',
        auth: (username || password) ? { user: username || '', pass: password || '' } : null
    });

    localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));
    localStorage.removeItem('MUSIC_LIBRARY_CACHE');
    return true;
}

function removeMusicSource(sourceId) {
    var sources = migrateSources();
    var idx = -1;
    for (var i = 0; i < sources.length; i++) {
        if (sources[i].id === sourceId) { idx = i; break; }
    }
    if (idx < 0) return false;

    var removed = sources.splice(idx, 1)[0];
    localStorage.setItem(SOURCES_KEY, JSON.stringify(sources));

    // 删除该来源下的收藏
    var fav = JSON.parse(localStorage.getItem('ttplayer-fav') || '[]');
    var newFav = fav.filter(function(src) {
        return src.indexOf(removed.url) !== 0;
    });
    if (newFav.length !== fav.length) {
        localStorage.setItem('ttplayer-fav', JSON.stringify(newFav));
        if (window.favoriteSet) {
            window.favoriteSet = new Set(newFav);
        }
    }
    localStorage.removeItem('MUSIC_LIBRARY_CACHE');
    return true;
}

// ========== HTTP 目录解析（带认证，PROPFIND 降级用） ==========
async function fetchHttpDirWithAuth(baseUrl, sourceName, headers, idPrefix) {
    var songs = [];
    var folders = [];

    try {
        var res = await fetch(baseUrl, { headers: headers });
        if (!res.ok) return [];
        var html = await res.text();
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var links = doc.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var href = link.getAttribute('href');
            if (!href || href === '../' || href === '/') continue;
            try { href = decodeURIComponent(href); } catch(e) {}
            if (href.endsWith('/')) {
                folders.push(href.slice(0, -1));
            }
        }
    } catch(e) { return []; }

    // 扫描文件夹内的音乐文件
    for (var j = 0; j < folders.length; j++) {
        var f = folders[j];
        try {
            var fUrl = baseUrl + encodeURIComponent(f) + '/';
            var fRes = await fetch(fUrl, { headers: headers });
            if (!fRes.ok) continue;
            var fHtml = await fRes.text();
            var fDoc = new DOMParser().parseFromString(fHtml, 'text/html');
            var fLinks = fDoc.querySelectorAll('a');
            for (var k = 0; k < fLinks.length; k++) {
                var fHref = fLinks[k].getAttribute('href');
                if (!fHref || !fHref.match(/\.(mp3|wav|flac|m4a|ogg)$/i)) continue;
                try { fHref = decodeURIComponent(fHref); } catch(e) {}
                var parsed = parseSongFile(fHref);
                songs.push({
                    id: idPrefix + '_' + songs.length,
                    name: parsed.song || fHref.replace(/\.[^/.]+$/, '').substring(0, 30),
                    artist: parsed.artist || '未知歌手',
                    src: fUrl + encodeURIComponent(fHref),
                    folder: f,
                    source: baseUrl,
                    sourceName: sourceName,
                    isDefault: false,
                    duration: '--:--'
                });
            }
        } catch(e) {}
    }
    return songs;
}

// ========== WebDAV PROPFIND 目录扫描 ==========
async function fetchWebdavDir(rootUrl, sourceName, headers, idPrefix) {
    var baseUrl = rootUrl.endsWith('/') ? rootUrl : rootUrl + '/';
    var songs = [];

    // 发送 PROPFIND 获取根目录文件列表
    var res = await fetch(baseUrl, {
        method: 'PROPFIND',
        headers: Object.assign({ 'Depth': '1' }, headers)
    });
    // PROPFIND 不支持时降级为 HTTP 目录解析
    if (res.status === 405) {
        return await fetchHttpDirWithAuth(baseUrl, sourceName, headers, idPrefix);
    }
    if (!res.ok) return [];

    var xmlText = await res.text();
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // 解析 WebDAV XML 响应 (DAV: href 元素)
    var namespace = 'DAV:';
    var hrefs = xmlDoc.getElementsByTagNameNS(namespace, 'href');
    if (!hrefs || hrefs.length === 0) {
        // 降级：尝试无 namespace 解析
        hrefs = xmlDoc.getElementsByTagName('d:href');
    }
    if (!hrefs || hrefs.length === 0) {
        hrefs = xmlDoc.getElementsByTagName('href');
    }

    var folders = [];

    for (var i = 0; i < hrefs.length; i++) {
        var href = hrefs[i].textContent || '';
        if (!href || href === rootUrl || href === baseUrl) continue;
        // 解码 URL 编码
        try { href = decodeURIComponent(href); } catch(e) {}

        // 去掉 baseUrl 前缀得到相对路径
        var relPath = href;
        if (relPath.indexOf(baseUrl) === 0) relPath = relPath.substring(baseUrl.length);
        else if (relPath.indexOf('/') === 0) relPath = relPath.substring(1);

        if (!relPath) continue;

        if (href.endsWith('/')) {
            // 子文件夹
            folders.push(relPath.replace(/\/$/, ''));
        } else if (relPath.match(/\.(mp3|wav|flac|m4a|ogg)$/i)) {
            // 音乐文件
            var parsed = parseSongFile(relPath);
            var folderName = relPath.split('/').slice(0, -1).join('/') || 'root';
            songs.push({
                id: idPrefix + '_' + songs.length,
                name: parsed.song || relPath.replace(/\.[^/.]+$/, '').substring(0, 30),
                artist: parsed.artist || '未知歌手',
                src: baseUrl + encodeURIComponent(relPath),
                folder: folderName,
                source: rootUrl,
                sourceName: sourceName,
                isDefault: false,
                duration: '--:--'
            });
        }
    }

    // 递归扫描子文件夹（一层）
    for (var f = 0; f < folders.length; f++) {
        var subUrl = baseUrl + encodeURIComponent(folders[f]) + '/';
        try {
            var subRes = await fetch(subUrl, {
                method: 'PROPFIND',
                headers: Object.assign({ 'Depth': '1' }, headers)
            });
            if (!subRes.ok) continue;
            var subXml = await subRes.text();
            var subDoc = parser.parseFromString(subXml, 'text/xml');
            var subHrefs = subDoc.getElementsByTagName('href');
            for (var si = 0; si < subHrefs.length; si++) {
                var sh = subHrefs[si].textContent || '';
                if (!sh || sh === subUrl || sh.endsWith('/')) continue;
                try { sh = decodeURIComponent(sh); } catch(e) {}
                var relFile = sh;
                if (relFile.indexOf(baseUrl) === 0) relFile = relFile.substring(baseUrl.length);
                if (!relFile || !relFile.match(/\.(mp3|wav|flac|m4a|ogg)$/i)) continue;
                var fp = parseSongFile(relFile);
                songs.push({
                    id: idPrefix + '_' + songs.length,
                    name: fp.song || relFile.replace(/\.[^/.]+$/, '').substring(0, 30),
                    artist: fp.artist || folders[f] || '未知歌手',
                    src: baseUrl + encodeURIComponent(relFile),
                    folder: folders[f],
                    source: rootUrl,
                    sourceName: sourceName,
                    isDefault: false,
                    duration: '--:--'
                });
            }
        } catch(e) {}
    }

    return songs;
}

// ========== 从单个HTTP来源获取歌曲（支持WebDAV PROPFIND） ==========
async function fetchSongsFromHttpSource(sourceRoot, sourceName, auth) {
    var songs = [];
    var idPrefix = sourceRoot.replace(/[^a-zA-Z0-9]/g, '_');
    var isWebdav = auth && auth.user && auth.pass;

    // 构建请求头
    var headers = {};
    if (isWebdav) {
        var encoded = btoa(auth.user + ':' + auth.pass);
        headers['Authorization'] = 'Basic ' + encoded;
    }

    // WebDAV 模式：用 PROPFIND 获取目录列表
    if (isWebdav) {
        try {
            return await fetchWebdavDir(sourceRoot, sourceName, headers, idPrefix);
        } catch(e) {
            console.warn('WebDAV 扫描失败:', e);
            return [];
        }
    }

    // 普通 HTTP 模式：解析 HTML 目录列表
    try {
        var response = await fetch(sourceRoot, { headers: headers });
        if (!response.ok) return [];
        var html = await response.text();
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var links = doc.querySelectorAll('a');
        var folders = [];

        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var href = link.getAttribute('href');
            if (!href || href === '../' || href === '/') continue;
            href = decodeURIComponent(href);
            if (href.endsWith('/')) {
                folders.push(href.slice(0, -1));
            }
        }

        for (var j = 0; j < folders.length; j++) {
            var folder = folders[j];
            try {
                var folderUrl = sourceRoot + (sourceRoot.endsWith('/') ? '' : '/') + encodeURIComponent(folder) + '/';
                var folderRes = await fetch(folderUrl, { headers: headers });
                if (!folderRes.ok) continue;
                var folderHtml = await folderRes.text();
                var folderDoc = parser.parseFromString(folderHtml, 'text/html');
                var folderLinks = folderDoc.querySelectorAll('a');

                for (var k = 0; k < folderLinks.length; k++) {
                    var fileLink = folderLinks[k];
                    var fileHref = fileLink.getAttribute('href');
                    if (!fileHref) continue;
                    fileHref = decodeURIComponent(fileHref);
                    if (!fileHref.match(/\.(mp3|wav|flac|m4a|ogg)$/i)) continue;

                    var parsed = parseSongFile(fileHref);
                    songs.push({
                        id: idPrefix + '_' + songs.length,
                        name: parsed.song || fileHref.replace(/\.[^/.]+$/, '').substring(0, 30),
                        artist: parsed.artist || extractArtistFromFolder(folder) || '未知歌手',
                        src: folderUrl + encodeURIComponent(fileHref),
                        folder: folder,
                        source: sourceRoot,
                        sourceName: sourceName,
                        isDefault: false,
                        duration: '--:--'
                    });
                }
            } catch(e) { console.warn('读取文件夹失败:', folder, e); }
        }
    } catch(e) { console.warn('读取来源失败:', sourceRoot, e); }
    return songs;
}

// ========== AList API 懒加载扫描（仅加载根目录结构，不扫描文件） ==========
// 首次只拉取文件夹目录树供浏览，点击具体文件夹时才加载该文件夹内的歌曲
async function fetchAListSongs(source) {
    var rootUrl = source.url;
    var sourceName = source.name;
    var idPrefix = source.url.replace(/[^a-zA-Z0-9]/g, '_');
    var baseUrl = rootUrl.replace(/\/+$/, '');
    var songs = [];

    // 列出根目录，创建虚拟文件夹条目
    try {
        var result = await AListAPI.listDir(source, '/');
        if (result.code === 200 && result.data && result.data.content) {
            var items = result.data.content;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.is_dir) {
                    // 创建虚拟文件夹条目——用于在"文件夹"视图中显示目录
                    songs.push({
                        id: idPrefix + '_dir_' + i,
                        name: item.name,
                        artist: '📁 文件夹',
                        src: 'alist://virtual/' + encodeURIComponent(item.name),
                        folder: item.name,
                        source: rootUrl,
                        sourceName: sourceName,
                        isDefault: false,
                        duration: '',
                        _virtualFolder: true,
                        _alistDirPath: '/' + item.name
                    });
                }
                // 根目录下的音频文件这里不加载（进子目录时 loadAListDir 会处理）
            }
        }
    } catch(e) {
        console.warn('AList 读取根目录失败:', rootUrl, e);
    }

    console.log('AList 根目录扫描完成:', rootUrl, '虚拟文件夹:', songs.filter(function(s) { return s._virtualFolder; }).length, '首歌曲(根目录):', songs.filter(function(s) { return !s._virtualFolder; }).length);
    return songs;
}




// ========== 获取所有音乐库（统一走 HTTP，Electron 也走 HTTP 避免 IPC 空跑） ==========
async function fetchRealMusicLibrary() {
    var sources = getMusicSources();
    var allSongs = [];

    for (var i = 0; i < sources.length; i++) {
        var source = sources[i];
        console.log('正在扫描:', source.name, source.url);
        // 浏览器模式：按协议分发
        var songs;
        if (source.protocol === 'alist') {
            songs = await fetchAListSongs(source);
        } else {
            songs = await fetchSongsFromHttpSource(source.url, source.name, source.auth);
        }
        // 带上 sourceId，用于来源独立分组
        if (source.id && songs) {
            for (var si2 = 0; si2 < songs.length; si2++) {
                songs[si2].sourceId = source.id;
            }
        }
        allSongs = allSongs.concat(songs);
        console.log('  找到', songs.length, '首歌曲');
    }

    console.log('总计:', allSongs.length, '首歌曲');
    return allSongs;
}

// ========== 获取单首歌时长 ==========
function fetchSingleDuration(src) {
    return new Promise(function(resolve) {
        var audio = new Audio();
        audio.preload = 'metadata';
        var loaded = false;
        function done(val) {
            if (loaded) return;
            loaded = true;
            audio.src = '';
            resolve(val);
        }
        audio.onloadedmetadata = function() {
            var d = audio.duration;
            done(d && isFinite(d) && d > 0 ? formatTime(d) : '--:--');
        };
        audio.onerror = function() { done('--:--'); };
        audio.src = src;
        setTimeout(function() { done('--:--'); }, 10000);
    });
}

// 暴露全局
// window.DEFAULT_ROOT = DEFAULT_ROOT;  // 已注释默认库
window.getMusicSources = getMusicSources;
window.addMusicSource = addMusicSource;
window.removeMusicSource = removeMusicSource;
window.fetchRealMusicLibrary = fetchRealMusicLibrary;
window.fetchSingleDuration = fetchSingleDuration;
window.fetchAListSongs = fetchAListSongs;

