/**
 * 歌词背景特效系统核心引擎
 */
(function() {
    var c = null, ctx = null, aid = null, cur = 'plainWhite', _fxActive = false, _fxGen = 0;
    var FX = {};
    var _fxCleanup = null;  // 当前特效的清理函数
    window.EffectRegister = function(n, fn) { FX[n] = { init: fn }; };

    function start(n) {
        if (!ctx || !c || !_fxActive) return;
        var w = c.width, h = c.height;
        if (w < 1 || h < 1) { setTimeout(function() { start(n); }, 150); return; }
        // 先清理前一个特效注册的全局监听器（如 resize）
        if (_fxCleanup) { _fxCleanup(); _fxCleanup = null; }
        var gen = ++_fxGen;
        if (FX[n]) {
            var cleanup = FX[n].init(w, h, ctx, c, function() { return cur === n && _fxActive && gen === _fxGen; });
            if (typeof cleanup === 'function') _fxCleanup = cleanup;
        }
    }

    function stopFx() {
        _fxGen++;
        if (_fxCleanup) { _fxCleanup(); _fxCleanup = null; }
        if (aid) { cancelAnimationFrame(aid); aid = null; }
        if (ctx) ctx.clearRect(0, 0, c.width, c.height);
    }

    window.addEventListener('DOMContentLoaded', function() {
        // 加载所有特效文件
        if (window.EFFECT_MANIFEST) {
            EFFECT_MANIFEST.forEach(function(item) {
                var s = document.createElement('script');
                s.src = './js/effects/' + item.file;
                document.body.appendChild(s);
            });
        }

        var b = document.getElementById('lyricsBgEffect') || document.body;
        var sel = document.getElementById('effectSelect');

        // 填充下拉菜单
        if (sel && window.EFFECT_MANIFEST) {
            sel.innerHTML = EFFECT_MANIFEST.map(function(m) {
                return '<option value="' + m.id + '">' + m.label + '</option>';
            }).join('');
        }

        c = document.createElement('canvas');
        c.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:0;';
        b.appendChild(c);
        ctx = c.getContext('2d', { alpha: false });

        function sizeCanvas() {
            var rect = b.getBoundingClientRect();
            var w = rect.width || window.innerWidth;
            var h = rect.height || window.innerHeight;
            if (w < 1 || h < 1) return false;

            // 检测全屏：浏览器 Fullscreen API 或 CSS 全屏类（_fsMode / is-fullscreen）
            var isFS = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                document.querySelector('._fsMode') || document.querySelector('.is-fullscreen'));

            var targetW = isFS ? 700 : 800;
            var targetH = isFS ? 1144 : 720;

            // 尺寸没变就不重置画布（避免无效的 clearRect + GPU 重分配）
            if (c.width === targetW && c.height === targetH) return false;

            // 清理旧画布内容，释放 GPU 内存
            if (c && ctx) { ctx.clearRect(0, 0, c.width, c.height); }
            c.width = targetW;
            c.height = targetH;

            if (isFS) {
                c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
                    'object-fit:cover;pointer-events:none;z-index:0;';
            } else {
                // 普通模式：100% 填满容器（不保持比例，防止容器的空白区域透出）
                c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
                    'pointer-events:none;z-index:0;';
            }
            return true;
        }
        var _rsTimer = null;
        var _lastCanvasW = 0, _lastCanvasH = 0;
        function rs() {
            if (!c) return;
            if (_rsTimer) cancelAnimationFrame(_rsTimer);
            _rsTimer = requestAnimationFrame(function() {
                var changed = sizeCanvas();
                // 尺寸没变就不重启特效（避免无效的 stop/start 循环）
                if (!changed) return;
                _lastCanvasW = c.width;
                _lastCanvasH = c.height;
                stopFx();
                if (cur !== 'none' && c.width > 0 && c.height > 0) start(cur);
            });
        }
        sizeCanvas();
        // 监听 resize 和 fullscreenchange，确保全屏切换时画布尺寸正确
        window.addEventListener('resize', rs);
        document.addEventListener('fullscreenchange', rs);
        document.addEventListener('webkitfullscreenchange', rs);

        if (sel) {
            var savedFx = localStorage.getItem('ttplayer-lyric-fx');
            if (savedFx && FX[savedFx]) { cur = savedFx; sel.value = savedFx; }
            else { cur = sel.value; }
            sel.addEventListener('change', function(e) {
                cur = e.target.value;
                localStorage.setItem('ttplayer-lyric-fx', cur);
                if (aid) cancelAnimationFrame(aid);
                ctx.clearRect(0, 0, c.width, c.height);
                if (_fxActive) setTimeout(function() { start(cur); }, 30);
            });
        }

        // 监听音频播放/暂停
        var audio = document.getElementById('audioPlayer');
        if (audio) {
            audio.addEventListener('play', function() {
                _fxActive = true;
                if (cur !== 'none' && c && c.width > 0 && c.height > 0) start(cur);
            });
            audio.addEventListener('pause', function() {
                _fxActive = false;
                stopFx();
            });
        }
    });

    // 暴露暂停/恢复接口给外部（拖拽分割线时暂停特效）
    window._stopFx = stopFx;
    window._resumeFx = function() {
        if (_fxActive && cur !== 'none' && c && c.width > 0 && c.height > 0) {
            start(cur);
        }
    };

    // 导出工具函数给特效文件使用
    window._P = Math.PI; window._R = Math.random; window._F = Math.floor;
    window._S = Math.sin; window._C = Math.cos; window._M = Math.max;
    window._fillBg = function(ctx, w, h, c1, c2) {
        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, c1); g.addColorStop(1, c2);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    };
    window._hexToRgb = function(hex) {
        var r = parseInt(hex.slice(1,3), 16);
        var g = parseInt(hex.slice(3,5), 16);
        var b = parseInt(hex.slice(5,7), 16);
        return r + ',' + g + ',' + b;
    };
})();

