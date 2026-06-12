/**
 * provider-base.js — 歌词服务提供者抽象接口
 * 
 * 所有平台插件必须实现以下三个方法：
 *   search(keywords)        → Promise<[{ id, name, artist }]>
 *   getLyric(songId)         → Promise<{ lrc: string, tlyric: string }>
 *   getComments(songId, sort)→ Promise<[{ user, content, time, likes }]>
 * 
 * sort: 'hot' | 'new'
 * 
 * 管理器通过 providerManager.load('netease', baseUrl) 加载具体实现
 */

(function() {
    'use strict';

    /** 基础提供者（相当于抽象类） */
    class LyricProviderBase {
        constructor(name, baseUrl) {
            this.name = name;           // 'netease' | 'kugou' | 'qqmusic' | 'qishui'
            this.displayName = name;
            this.baseUrl = baseUrl || '';
            this._ready = false;
        }

        /** 子类重写：搜索歌曲 */
        async search(keywords) {
            throw new Error(`${this.name} 未实现 search()`);
        }

        /** 子类重写：获取歌词 */
        async getLyric(songId) {
            throw new Error(`${this.name} 未实现 getLyric()`);
        }

        /** 子类重写：获取评论 */
        async getComments(songId, sort) {
            throw new Error(`${this.name} 未实现 getComments()`);
        }

        /** 检查配置是否可用 */
        isReady() {
            return this._ready && !!this.baseUrl;
        }

        /** 更新地址 */
        setBaseUrl(url) {
            this.baseUrl = url;
            this._ready = !!url;
        }
    }

    window.LyricProviderBase = LyricProviderBase;
})();
