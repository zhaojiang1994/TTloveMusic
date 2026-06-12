/**
 * provider-manager.js — 歌词服务提供者管理器
 * 
 * 管理多个平台插件（网易云/酷狗/QQ/汽水），统一调用接口
 * 存储配置到 localStorage
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'LYRICS_PROVIDER_CONFIG';

    /** 内置平台列表 */
    const BUILTIN_PROVIDERS = {
        netease: {
            label: '网易云音乐',
            file: 'netease.js',
            className: 'NeteaseProvider',
            defaultUrl: 'http://fn.xiaom.asia:3066'
        },
        kugou: {
            label: '酷狗音乐',
            file: 'kugou.js',
            className: 'KugouProvider',
            defaultUrl: ''
        },
        qqmusic: {
            label: 'QQ音乐',
            file: 'qqmusic.js',
            className: 'QqmusicProvider',
            defaultUrl: ''
        },
        qishui: {
            label: '汽水音乐',
            file: 'qishui.js',
            className: 'QishuiProvider',
            defaultUrl: ''
        }
    };

    /** 加载已保存的配置 */
    function loadConfig() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : { active: 'netease', urls: {} };
        } catch (e) {
            return { active: 'netease', urls: {} };
        }
    }

    /** 保存配置 */
    function saveConfig(config) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    /** 管理器实例 */
    class ProviderManager {
        constructor() {
            this.providers = {};       // name → instance
            this.config = loadConfig();
            this._current = null;
        }

        /** 获取内置平台列表 */
        static getBuiltins() {
            return BUILTIN_PROVIDERS;
        }

        /** 当前选中的平台名 */
        get activeName() {
            return this.config.active || 'netease';
        }

        /** 设置当前平台 */
        setActive(name) {
            if (!BUILTIN_PROVIDERS[name]) return false;
            this.config.active = name;
            saveConfig(this.config);
            this._current = null; // 下次 get 时重建
            return true;
        }

        /** 获取某平台的 API 地址 */
        getUrl(name) {
            const info = BUILTIN_PROVIDERS[name];
            return this.config.urls[name] || (info ? info.defaultUrl : '');
        }

        /** 设置某平台的 API 地址 */
        setUrl(name, url) {
            this.config.urls[name] = url.replace(/\/+$/, '');
            saveConfig(this.config);
            if (this.providers[name]) {
                this.providers[name].setBaseUrl(url);
            }
            this._current = null;
        }

        /** 获取当前活动的 provider 实例 */
        async getCurrent() {
            if (this._current) return this._current;

            const name = this.activeName;
            const info = BUILTIN_PROVIDERS[name];
            if (!info) return null;

            // 如果 provider 还没加载，动态加载脚本
            if (!this.providers[name]) {
                await this._loadScript(info.file, info.className);
            }

            const inst = this.providers[name];
            if (inst) {
                inst.setBaseUrl(this.getUrl(name));
                this._current = inst;
            }
            return inst;
        }

        /** 获取当前 provider（同步版本，可能为 null） */
        getCurrentSync() {
            return this._current;
        }

        /** 检查当前是否有可用配置 */
        isReady() {
            const url = this.getUrl(this.activeName);
            return !!url;
        }

        /** 动态加载 provider 脚本 */
        _loadScript(file, className) {
            const name = file.replace('.js', '');
            if (this.providers[name]) return Promise.resolve();

            return new Promise((resolve, reject) => {
                // 检查是否已加载
                if (window[className]) {
                    const inst = new window[className](this.getUrl(name));
                    this.providers[name] = inst;
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = `./js/lyrics-providers/${file}`;
                script.onload = () => {
                    if (window[className]) {
                        const inst = new window[className](this.getUrl(name));
                        this.providers[name] = inst;
                        resolve();
                    } else {
                        reject(new Error(`加载 ${file} 失败：未找到 ${className}`));
                    }
                };
                script.onerror = () => reject(new Error(`加载 ${file} 失败`));
                document.head.appendChild(script);
            });
        }
    }

    // 暴露类本身供外部使用（如配置弹窗获取平台列表）
    window.ProviderManager = ProviderManager;

    // 全局单例
    const providerManager = new ProviderManager();
    window.providerManager = providerManager;

    // 加载当前 provider 的脚本
    providerManager.getCurrent().catch(function() {
        // 静默失败，没配置就不使用
    });
})();
