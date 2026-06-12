/**
 * netease.js — 网易云音乐 lyrics/comment 提供者
 * 
 * 适配 NeteaseCloudMusicApi / NeteaseCloudMusicApiEnhanced
 * 
 * 接口标准：
 *   GET {baseUrl}/search?keywords={keywords}     → 搜索歌曲
 *   GET {baseUrl}/lyric?id={id}                   → 获取歌词
 *   GET {baseUrl}/comment/music?id={id}&limit=20  → 获取评论
 */

(function() {
    'use strict';

    class NeteaseProvider extends window.LyricProviderBase {
        constructor(baseUrl) {
            super('netease', baseUrl);
            this.displayName = '网易云音乐';
        }

        /** 通用 fetch + 错误处理（使用共享 request.js） */
        async _fetch(path) {
            if (typeof apiRequest === 'function') {
                return apiRequest(this.baseUrl, path);
            }
            // 降级：直接 fetch
            if (!this.baseUrl) throw new Error('API 地址未配置');
            const url = this.baseUrl.replace(/\/+$/, '') + path;
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (data.code && data.code !== 200) throw new Error('API 错误: ' + data.code);
            return data;
        }

        /** 搜索歌曲 */
        async search(keywords) {
            const data = await this._fetch('/search?keywords=' + encodeURIComponent(keywords) + '&limit=30');
            const songs = data.result && data.result.songs;
            if (!songs || songs.length === 0) return [];
            return songs.map(s => ({
                id: s.id,
                name: s.name,
                artist: (s.artists || []).map(a => a.name).join(' / ') || '未知'
            }));
        }

        /** 获取歌词 */
        async getLyric(songId) {
            const data = await this._fetch('/lyric?id=' + songId);
            let lrc = '';
            let tlyric = '';

            if (data.lrc && data.lrc.lyric) lrc = data.lrc.lyric;
            if (data.tlyric && data.tlyric.lyric) tlyric = data.tlyric.lyric;

            return { lrc, tlyric };
        }

        /** 获取评论（支持分页） */
        async getComments(songId, sort, page) {
            // sortType: 1=推荐排序, 2=热度排序, 3=时间排序（最新）
            const sortMap = { hot: 2, new: 3 };
            const sortType = sortMap[sort] || 2;
            const pageNo = page || 1;
            // 新版评论接口
            const data = await this._fetch(`/comment/new?type=0&id=${songId}&sortType=${sortType}&pageNo=${pageNo}&pageSize=30`);
            // 响应结构: { data: { comments: [...], totalCount, hasMore }, code: 200 }
            const body = data.data || data;
            const comments = body.comments || [];

            const list = comments.map(c => ({
                user: c.user ? c.user.nickname : '匿名',
                avatar: c.user ? c.user.avatarUrl : '',
                content: c.content || '',
                time: c.time ? new Date(c.time).toLocaleString('zh-CN') : '',
                likes: c.likedCount || 0,
                id: c.commentId || 0
            }));

            return {
                list: list,
                total: body.totalCount || body.total || 0,
                hasMore: body.hasMore === true || comments.length >= 30
            };

        }

        /** 获取楼层评论（二级评论） */
        async getFloorComments(parentCommentId, songId, page) {
            const pageSize = 10;
            const data = await this._fetch(`/comment/floor?parentCommentId=${parentCommentId}&id=${songId}&type=0&limit=${pageSize}`);
            const body = data.data || data;
            const comments = body.comments || [];
            const list = comments.map(c => ({
                user: c.user ? c.user.nickname : '匿名',
                avatar: c.user ? c.user.avatarUrl : '',
                content: c.content || '',
                time: c.time ? new Date(c.time).toLocaleString('zh-CN') : '',
                likes: c.likedCount || 0,
                id: c.commentId || 0
            }));
            return {
                list: list,
                total: body.totalCount || body.total || 0,
                hasMore: body.hasMore === true || comments.length >= pageSize
            };
        }
    }

    window.NeteaseProvider = NeteaseProvider;
})();
