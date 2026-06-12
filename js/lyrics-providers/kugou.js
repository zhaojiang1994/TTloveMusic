/**
 * kugou.js — 酷狗音乐 lyrics/comment 提供者
 * 
 * 搜索走酷狗公开接口，歌词/评论走本地部署的 KuGouMusicApi
 */

(function() {
    'use strict';

    class KugouProvider extends window.LyricProviderBase {
        constructor(baseUrl) {
            super('kugou', baseUrl);
            this.displayName = '酷狗音乐';
        }

        async _fetch(url) {
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        }

        async _apiFetch(path) {
            if (!this.baseUrl) throw new Error('API 地址未配置');
            return this._fetch(this.baseUrl.replace(/\/+$/, '') + path);
        }

        /** 搜索歌曲（走 CORS 代理访问酷狗公开搜索） */
        async search(keywords) {
            var directUrl = 'https://songsearch.kugou.com/song_search_v2?keyword=' + encodeURIComponent(keywords) + '&platform=WebFilter&page=1&pagesize=10';
            // 用本地 API 做中转代理（无需修改服务端）
            var data = await this._apiFetch('/search?keywords=' + encodeURIComponent(keywords) + '&page=1&pagesize=10&type=song&timestamp=' + Date.now() + '&cookie=' + encodeURIComponent('dfid='));
            // 如果本地搜索失败，尝试 CORS 代理
            if (!data || data.error_code === 152) {
                try {
                    var proxyUrl = 'https://api.allorigins.win/raw?url=';
                    var resp = await fetch(proxyUrl + encodeURIComponent(directUrl));
                    data = await resp.json();
                } catch(e2) {
                    // 最后的备选：用 search/complex
                    data = await this._apiFetch('/search/complex?keywords=' + encodeURIComponent(keywords) + '&page=1&pagesize=10&timestamp=' + Date.now());
                }
            }

            var list = [];
            if (data) {
                var src = data.data || data;
                // song_search_v2 返回 data.lists；search/complex 返回 data.song.list
                var sList = src.lists || src.list || [];
                if (src.song) sList = src.song.list || src.song.lists || sList;
                list = sList;
            }
            if (!Array.isArray(list) || list.length === 0) return [];

            return list.map(function(s) {
                return {
                    id: s.ID || s.MixSongID || s.id || 0,
                    name: s.SongName || s.name || s.songname || '',
                    artist: s.SingerName || s.singername || s.author || '未知',
                    hash: s.FileHash || s.hash || '',
                    album_id: s.AlbumID || s.album_id || 0,
                    mixsongid: s.MixSongID || s.mixsongid || s.ID || s.id || 0
                };
            });
        }

        /** 获取歌词 */
        async getLyric(songId, extra) {
            var lrc = '';
            try {
                var hash = (extra && extra.hash) || '';
                if (!hash) return { lrc: '', tlyric: '' };

                // 第一步：用 hash 搜索歌词，获取 id + accesskey
                var searchData = await this._apiFetch('/search/lyric?hash=' + encodeURIComponent(hash));
                var candidates = (searchData && searchData.candidates) || [];
                if (candidates.length === 0) return { lrc: '', tlyric: '' };

                var info = candidates[0];
                var lid = info.id || 0;
                var accesskey = info.accesskey || '';
                if (!lid) return { lrc: '', tlyric: '' };

                // 第二步：获取歌词内容
                var lrcData = await this._apiFetch('/lyric?id=' + lid + '&accesskey=' + accesskey + '&fmt=lrc&decode=true');
                if (lrcData && lrcData.decodeContent) {
                    lrc = lrcData.decodeContent;
                } else if (lrcData && lrcData.content) {
                    try { lrc = atob(lrcData.content); } catch(e) { lrc = lrcData.content; }
                }
            } catch(e) {
                console.log('酷狗歌词获取失败:', e);
            }
            return { lrc: lrc, tlyric: '' };
        }

        /** 获取评论 */
        async getComments(songId, sort, page) {
            var p = page || 1;
            var data = await this._apiFetch('/comment/music?mixsongid=' + songId + '&page=' + p + '&pagesize=30&show_classify=0');
            var list = [];
            if (data && data.data) {
                list = data.data.list || data.data.comments || [];
            }
            var comments = list.map(function(c) {
                return {
                    user: c.nickname || c.user_name || '匿名',
                    avatar: '',
                    content: c.content || '',
                    time: c.created ? new Date(c.created).toLocaleString('zh-CN') : '',
                    likes: c.likecount || c.likedCount || 0,
                    id: c.comment_id || c.id || 0
                };
            });
            return {
                list: comments,
                total: (data && data.data) ? (data.data.total || data.data.count || comments.length) : comments.length,
                hasMore: comments.length >= 30
            };
        }
    }

    window.KugouProvider = KugouProvider;
})();
