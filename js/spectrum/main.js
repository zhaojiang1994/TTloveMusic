// ==================== 频谱主入口 ====================
(function() {
    const audio = document.getElementById('audioPlayer');
    let currentStyle = null;
    let styles = {};
    let styleNames = {};
    let styleOrder = [];

    // 从清单加载所有样式
    function loadStylesFromManifest() {
        return new Promise((resolve) => {
            const manifest = window.STYLES_MANIFEST;
            if (!manifest || manifest.length === 0) {
                console.error('未找到样式清单');
                resolve();
                return;
            }

            let loaded = 0;
            manifest.forEach(item => {
                const globalName = `Spectrum${item.name.charAt(0).toUpperCase()}${item.name.slice(1)}`;
                console.log(`加载样式: ${item.file} -> ${globalName}`);

                const script = document.createElement('script');
                script.src = `./js/spectrum/styles/${item.file}`;
                script.onload = () => {
                    const styleObj = window[globalName];
                    if (styleObj) {
                        const key = item.name;
                        styles[key] = styleObj;
                        styleNames[key] = styleObj.displayName || item.defaultName || key;
                        styleOrder.push(key);
                        console.log(`✅ 样式加载成功: ${key} -> ${styleNames[key]}`);
                    } else {
                        console.warn(`样式 ${item.file} 未正确导出 ${globalName}`);
                    }
                    loaded++;
                    if (loaded === manifest.length) resolve();
                };
                script.onerror = () => {
                    console.warn(`加载样式失败: ${item.file}`);
                    loaded++;
                    if (loaded === manifest.length) resolve();
                };
                document.head.appendChild(script);
            });
        });
    }

    // 辅助：提取前2个有意义字符（优先中文，去掉图标）
    function shortLabel(str) {
        if (!str) return '';
        // 优先取前2个中文字
        var cn = str.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g);
        if (cn && cn.length >= 1) return cn.slice(0, 2).join('');
        // 无中文则取字母数字
        var alnum = str.match(/[a-zA-Z0-9]/g);
        return alnum ? alnum.slice(0, 2).join('') : str.slice(0, 2);
    }

    // 更新三个按钮的文字（简化为2个字）
    function updateButtons(styleBtn, colorBtn, subBtn) {
        const currentStyleObj = styles[currentStyle];
        if (!currentStyleObj) return;

        styleBtn.innerHTML = shortLabel(currentStyleObj.displayName || styleNames[currentStyle]);
        if (colorBtn && currentStyleObj.getCurrentColorName) {
            colorBtn.innerHTML = shortLabel(currentStyleObj.getCurrentColorName());
        }
        if (subBtn && currentStyleObj.getCurrentSubStyleName) {
            subBtn.innerHTML = shortLabel(currentStyleObj.getCurrentSubStyleName());
        }
    }

    function initUI() {
        if (styleOrder.length === 0) {
            console.error('没有找到任何样式插件');
            return;
        }

        currentStyle = styleOrder[0];

        const canvas = document.getElementById('spectrumCanvas');
        if (!canvas) return;

        const core = window.SpectrumCore;
        core.setCanvas(canvas);

        const container = document.querySelector('.spectrum-container');
        if (!container) return;

        container.style.position = 'relative';

        // 清除旧按钮
        const oldPanel = container.querySelector('.spectrum-buttons-panel');
        if (oldPanel) oldPanel.remove();

        // 创建按钮面板
        const btnPanel = document.createElement('div');
        btnPanel.className = 'spectrum-buttons-panel';
        btnPanel.style.cssText = `position:absolute;top:8px;right:8px;z-index:20;display:flex;gap:8px;`;

        // 按钮1：切换样式（插件）
        const styleBtn = document.createElement('button');
        styleBtn.style.cssText = `background:rgba(0,0,0,0.7);border:1px solid #88ccff;color:#88ccff;border-radius:16px;padding:2px 8px;font-size:7px;cursor:pointer;backdrop-filter:blur(4px);font-weight:bold;`;
        styleBtn.onclick = () => {
            let idx = styleOrder.indexOf(currentStyle);
            idx = (idx + 1) % styleOrder.length;
            currentStyle = styleOrder[idx];
            updateButtons(styleBtn, colorBtn, subBtn);
        };

        // 按钮2：切换颜色
        const colorBtn = document.createElement('button');
        colorBtn.style.cssText = `background:rgba(0,0,0,0.7);border:1px solid #ffaa33;color:#ffaa33;border-radius:16px;padding:2px 8px;font-size:7px;cursor:pointer;backdrop-filter:blur(4px);`;
        colorBtn.onclick = () => {
            const style = styles[currentStyle];
            if (style && style.nextColor) {
                style.nextColor();
                updateButtons(styleBtn, colorBtn, subBtn);
            }
        };

        // 按钮3：切换子样式
        const subBtn = document.createElement('button');
        subBtn.style.cssText = `background:rgba(0,0,0,0.7);border:1px solid #ff88aa;color:#ff88aa;border-radius:16px;padding:2px 8px;font-size:7px;cursor:pointer;backdrop-filter:blur(4px);`;
        subBtn.onclick = () => {
            const style = styles[currentStyle];
            if (style && style.nextSubStyle) {
                style.nextSubStyle();
                updateButtons(styleBtn, colorBtn, subBtn);
            }
        };

        btnPanel.appendChild(styleBtn);
        btnPanel.appendChild(colorBtn);
        btnPanel.appendChild(subBtn);
        container.appendChild(btnPanel);

        // 尝试恢复上次的频谱选择
        try {
            var savedSpec = JSON.parse(localStorage.getItem('SPECTRUM_STATE') || '{}');
            if (savedSpec.style && styleOrder.indexOf(savedSpec.style) >= 0) {
                currentStyle = savedSpec.style;
            }
            // 恢复颜色和子样式（通过循环匹配名称）
            var currentStyleObj = styles[currentStyle];
            if (savedSpec.colorName && currentStyleObj && currentStyleObj.getCurrentColorName) {
                var maxLoop = 50;
                while (currentStyleObj.getCurrentColorName() !== savedSpec.colorName && maxLoop > 0) {
                    if (currentStyleObj.nextColor) currentStyleObj.nextColor();
                    maxLoop--;
                }
            }
            if (savedSpec.subStyleName && currentStyleObj && currentStyleObj.getCurrentSubStyleName) {
                var maxLoop2 = 20;
                while (currentStyleObj.getCurrentSubStyleName() !== savedSpec.subStyleName && maxLoop2 > 0) {
                    if (currentStyleObj.nextSubStyle) currentStyleObj.nextSubStyle();
                    maxLoop2--;
                }
            }
        } catch(e) {}

        // 每次切换时保存选择
        function saveSpectrumState() {
            try {
                var styleObj = styles[currentStyle];
                var state = { style: currentStyle };
                if (styleObj && styleObj.getCurrentColorName) state.colorName = styleObj.getCurrentColorName();
                if (styleObj && styleObj.getCurrentSubStyleName) state.subStyleName = styleObj.getCurrentSubStyleName();
                localStorage.setItem('SPECTRUM_STATE', JSON.stringify(state));
            } catch(e) {}
        }

        // 在切换按钮中加入保存
        var origStyleClick = styleBtn.onclick;
        styleBtn.onclick = function() {
            if (origStyleClick) origStyleClick.call(this);
            saveSpectrumState();
        };
        var origColorClick = colorBtn.onclick;
        colorBtn.onclick = function() {
            if (origColorClick) origColorClick.call(this);
            saveSpectrumState();
        };
        var origSubClick = subBtn.onclick;
        subBtn.onclick = function() {
            if (origSubClick) origSubClick.call(this);
            saveSpectrumState();
        };

        // 初始化按钮文字
        updateButtons(styleBtn, colorBtn, subBtn);

        // 画布自适应
        // 防抖resize，避免卡顿
        var resizeTimer = null;
        var _specInitRatio = 1800 / 1160; // 从 HTML 初始属性获取的默认比例
        const resize = () => {
            if (resizeTimer) cancelAnimationFrame(resizeTimer);
            resizeTimer = requestAnimationFrame(function() {
                const container = document.querySelector('.spectrum-container');
                const canvas = core.spectrumCanvas;
                if (!container || !canvas) return;

                var cw = container.clientWidth;
                var ch = container.clientHeight;

                // 首次获取有效尺寸时更新比例基准
                if (cw > 10 && ch > 10) {
                    _specInitRatio = cw / ch;
                }

                var isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);

                // 尺寸没变就不重置 canvas（避免无效的 GPU 重分配）
                var _newW = isFS ? Math.ceil(ch * _specInitRatio) : cw;
                var _newH = ch;
                if (canvas.width === _newW && canvas.height === _newH) return;

                if (isFS) {
                    // 全屏模式：保持画布比例不变，上下填满，左右溢出（overflow:hidden 裁剪）
                    canvas.width = _newW;
                    canvas.height = _newH;
                    // 居中显示（overflow:hidden 裁剪左右溢出）
                    canvas.style.marginLeft = Math.round((cw - _newW) / 2) + 'px';
                    canvas.style.width = _newW + 'px';
                    canvas.style.height = _newH + 'px';
                } else {
                    canvas.width = cw;
                    canvas.height = ch;
                    canvas.style.marginLeft = '';
                    canvas.style.width = '';
                    canvas.style.height = '';
                }
            });
        };
        resize();
        window.addEventListener('resize', resize);

        // 音频播放时启动频谱，暂停时停止（含世代检查避免双循环）
        var _specGen = 0;
        function startSpectrumLoop() {
            if (core.animationId) return;
            var gen = ++_specGen;
            function loop() {
                if (!core.spectrumCtx || gen !== _specGen) return;
                core.getTargetHeights(audio);
                core.smoothHeights();
                core.updateWaveY();
                var bw = core.spectrumCanvas.width / core.params.barCount;
                var style = styles[currentStyle];
                if (style && style.draw) {
                    style.draw(core, core.spectrumCanvas, core.spectrumCtx, bw);
                } else {
                    core.spectrumCtx.clearRect(0, 0, core.spectrumCanvas.width, core.spectrumCanvas.height);
                }
                core.animationId = requestAnimationFrame(loop);
            }
            loop();
        }
        function stopSpectrumLoop() {
            _specGen++;
            if (core.animationId) {
                cancelAnimationFrame(core.animationId);
                core.animationId = null;
            }
        }
        if (audio) {
            audio.addEventListener('play', () => {
                if (!core.isReady) core.initAudio(audio);
                if (core.audioContext?.state === 'suspended') {
                    core.audioContext.resume();
                }
                startSpectrumLoop();
            });
            audio.addEventListener('pause', stopSpectrumLoop);
        }
        console.log('✅ 频谱已启动（播放时启动）');
    }

    // 启动
    function loadManifestAndStart() {
        const manifestScript = document.createElement('script');
        manifestScript.src = './js/spectrum/styles/manifest.js';
        manifestScript.onload = () => {
            loadStylesFromManifest().then(initUI);
        };
        manifestScript.onerror = () => {
            console.error('无法加载样式清单');
        };
        document.head.appendChild(manifestScript);
    }

    loadManifestAndStart();
})();