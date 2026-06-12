/**
 * request.js — 歌词提供者通用网络请求工具
 * 
 * 所有 provider 共享此工具，避免重复实现 fetch + 错误处理
 * 支持超时、JSON 解析、错误码统一处理
 */

(function() {
    'use strict';

    /** 通用请求函数 */
    async function apiRequest(baseUrl, path, options) {
        if (!baseUrl) throw new Error('API 地址未配置');
        const url = baseUrl.replace(/\/+$/, '') + path;
        const timeout = (options && options.timeout) || 8000;
        
        const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        
        const data = await res.json();
        // 网易云 API 的通用错误码
        if (data.code && data.code !== 200) {
            throw new Error('API 错误: ' + data.code + (data.msg ? ' ' + data.msg : ''));
        }
        return data;
    }

    /** HTML 转义（供 provider 渲染评论时使用） */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m;
        });
    }

    window.apiRequest = apiRequest;
    window.escapeHtml = escapeHtml;
})();
