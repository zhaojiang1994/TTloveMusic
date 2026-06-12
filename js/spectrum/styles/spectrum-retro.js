// ==================== 复古像素样式 spectrum-retro.js ====================
// 复古像素LED频谱 | 4种像素风格 | 稳定版
// ================================================================

(function() {
    // ==================== 皮肤配置 ====================
    const SKINS = {
        // ========== 老DVD/VCD灯光色彩 ==========
        dvdVfdBlue: { name: '📀 VFD蓝', color: '#66D9FF', background: '#0a0a0a' },
        dvdVfdGreen: { name: '📀 VFD绿', color: '#44FFAA', background: '#0a0a0a' },
        dvdStandby: { name: '📀 待机橙', color: '#FF9933', background: '#0a0a0a' },
        dvdPlayCyan: { name: '📀 播放青', color: '#33FFCC', background: '#0a0a0a' },
        dvdVfdWhite: { name: '📀 VFD白', color: '#D4F1F9', background: '#0a0a0a' },
        dvdVintageAmber: { name: '📀 复古琥珀', color: '#FFB347', background: '#0a0a0a' },

        // ========== 经典LED系列 ==========
        ledGreen: { name: 'LED绿', color: '#00FF7F', background: '#000000' },
        ledRed: { name: 'LED红', color: '#FF3355', background: '#000000' },
        ledBlue: { name: 'LED蓝', color: '#33AAFF', background: '#000000' },
        ledPurple: { name: 'LED紫', color: '#CC44FF', background: '#000000' },

        // ========== VFD荧光系列 ==========
        vfdCyan: { name: 'VFD青', color: '#00FFE0', background: '#000000' },
        vfdClassic: { name: 'VFD经典', color: '#E8F4F8', background: '#0A0E12' },
        vfdWarm: { name: 'VFD暖白', color: '#F5E6D3', background: '#0A0A08' },

        // ========== 复古暖光系列 ==========
        amber: { name: '琥珀色', color: '#FFB300', background: '#000000' },
        vacuumTube: { name: '电子管', color: '#F6E8C0', background: '#0a0a0a' },
        scopeGreen: { name: '示波器绿', color: '#55FF55', background: '#000a00' }
    };

    // ==================== 二级样式 ====================
    const SUB_STYLES = {
        classic: '📺 经典像素',
        bigPixel: '🔲 大像素块',
        arcade: '🕹️ 街机像素',
        grid: '⬛ 方格矩阵'
    };

    const SKIN_NAMES = Object.keys(SKINS);
    const SUB_STYLE_NAMES = Object.keys(SUB_STYLES);

    let currentSkinIndex = 0;
    let currentSkin = SKINS[SKIN_NAMES[0]];
    let currentSubStyle = 'classic';

    // ==================== 配置参数 ====================
    const CONFIG = {
        // ==================== 频谱条配置 ====================
        barCount: 28,           // 频谱条数量（显示多少根柱子）

        // ==================== 像素块高度配置 ====================
        blockHeight: 8,         // 经典/街机模式下的像素块高度（像素）
        bigBlockHeight: 12,     // 大像素块模式下的像素块高度（像素）

        // ==================== 透明度配置 ====================
        minAlpha: 0.22,         // 最小不透明度（底部像素块较暗）
        maxAlpha: 0.80,         // 最大不透明度（顶部像素块较亮）

        // ==================== 音频映射配置 ====================
        maxDataRatio: 0.87,     // 最大数据使用比例（只使用87%的频域数据，跳过超高频）
        useLogScale: true,      // 是否使用对数刻度映射（true=低频区间更详细，更贴合人耳感知）

        // ==================== 高度平滑配置 ====================
        attackSpeed: 0.35,      // 攻击速度（音量增大时，柱子上升的灵敏度）
        releaseSpeed: 0.005      // 释放速度（音量减小时，柱子下降的灵敏度）
    };

    let smoothedHeights = [];
    let _retroSourceHeights = [];
    let _retroDataArray = null;
    let lastTime = 0;

    function logMap(i, barCount, maxDataIndex) {
        if (maxDataIndex <= 0) return 0;
        const t = i / barCount;
        const logIndex = Math.pow(t, 1.5) * maxDataIndex;
        return Math.min(maxDataIndex - 1, Math.max(0, Math.floor(logIndex)));
    }

    function nextColor() {
        currentSkinIndex = (currentSkinIndex + 1) % SKIN_NAMES.length;
        currentSkin = SKINS[SKIN_NAMES[currentSkinIndex]];
        return currentSkin.name;
    }

    function nextSubStyle() {
        const idx = (SUB_STYLE_NAMES.indexOf(currentSubStyle) + 1) % SUB_STYLE_NAMES.length;
        currentSubStyle = SUB_STYLE_NAMES[idx];
        return SUB_STYLES[currentSubStyle];
    }

    function getCurrentSubStyleName() {
        return SUB_STYLES[currentSubStyle];
    }

    function getCurrentColorName() {
        return currentSkin.name;
    }

    function getStyleConfig() {
        const configs = {
            classic: { barGap: 2, blockHeight: CONFIG.blockHeight },
            bigPixel: { barGap: 2, blockHeight: CONFIG.bigBlockHeight },
            arcade: { barGap: 2, blockHeight: CONFIG.blockHeight },
            grid: { barGap: 1, blockHeight: 10 }
        };
        return configs[currentSubStyle] || configs.classic;
    }

    function draw(core, canvas, ctx, barWidth) {
        if (!core || !canvas || !ctx) return;

        const now = Date.now();
        if (now - lastTime < 16) return;
        lastTime = now;

        const w = canvas.width;
        const h = canvas.height;
        const barCount = CONFIG.barCount;
        const colWidth = w / barCount;

        const style = getStyleConfig();
        const blockH = style.blockHeight;
        const barGap = style.barGap;
        const barW = colWidth - barGap;
        const offset = barGap / 2;
        const maxBlocks = Math.floor(h / blockH);

        // 获取音频数据
        let sourceHeights = _retroSourceHeights;
        if (sourceHeights.length !== barCount) sourceHeights = _retroSourceHeights = new Array(barCount).fill(0);
        let hasAudio = false;

        if (core.isReady && core.analyser) {
            if (!_retroDataArray || _retroDataArray.length !== core.analyser.frequencyBinCount) {
                _retroDataArray = new Uint8Array(core.analyser.frequencyBinCount);
            }
            core.analyser.getByteFrequencyData(_retroDataArray);
            const maxDataIndex = Math.floor(_retroDataArray.length * CONFIG.maxDataRatio);

            let maxVal = 0;
            for (let i = 0; i < maxDataIndex; i++) if (_retroDataArray[i] > maxVal) maxVal = _retroDataArray[i];
            hasAudio = maxVal > 5;

            if (hasAudio) {
                for (let i = 0; i < barCount; i++) {
                    const idx = CONFIG.useLogScale ? logMap(i, barCount, maxDataIndex) : Math.floor(i / barCount * maxDataIndex);
                    sourceHeights[i] = (_retroDataArray[idx] / 255) * h;
                }
            }
        } else {
            for (let i = 0; i < barCount; i++) {
                sourceHeights[i] = Math.sin(Date.now() * 0.005 + i * 0.1) * 30 + 40;
            }
            hasAudio = true;
        }

        // 平滑高度
        if (smoothedHeights.length !== barCount) smoothedHeights = [...sourceHeights];
        for (let i = 0; i < barCount; i++) {
            const t = sourceHeights[i];
            const c = smoothedHeights[i];
            if (t > c) {
                smoothedHeights[i] = c * CONFIG.attackSpeed + t * (1 - CONFIG.attackSpeed);
            } else {
                smoothedHeights[i] = c * CONFIG.releaseSpeed + t * (1 - CONFIG.releaseSpeed);
            }
        }

        const heights = smoothedHeights.map(hh => {
            if (!hasAudio) return 0;
            if (hh > 0 && hh < blockH) return blockH;
            return Math.min(hh, h);
        });

        // 绘制背景
        ctx.fillStyle = currentSkin.background;
        ctx.fillRect(0, 0, w, h);

        // ========== 经典像素 ==========
        if (currentSubStyle === 'classic') {
            ctx.shadowBlur = 2;
            ctx.shadowColor = currentSkin.color;

            for (let i = 0; i < barCount; i++) {
                const height = heights[i];
                if (height < 1) continue;
                const x = i * colWidth + offset;
                const blocks = Math.floor(height / blockH);
                for (let b = 0; b < blocks; b++) {
                    const y = h - (b + 1) * blockH;
                    const t = b / maxBlocks;
                    const alpha = CONFIG.minAlpha + t * (CONFIG.maxAlpha - CONFIG.minAlpha);
                    ctx.globalAlpha = Math.min(0.9, alpha);
                    ctx.fillStyle = currentSkin.color;
                    ctx.fillRect(x, y, barW, blockH - 1);
                }
            }
        }

        // ========== 大像素块 ==========
        else if (currentSubStyle === 'bigPixel') {
            ctx.shadowBlur = 2;
            ctx.shadowColor = currentSkin.color;

            for (let i = 0; i < barCount; i++) {
                const height = heights[i];
                if (height < 1) continue;
                const x = i * colWidth + offset;
                const blocks = Math.floor(height / blockH);
                for (let b = 0; b < blocks; b++) {
                    const y = h - (b + 1) * blockH;
                    const t = b / maxBlocks;
                    const alpha = CONFIG.minAlpha + t * (CONFIG.maxAlpha - CONFIG.minAlpha);
                    ctx.globalAlpha = Math.min(0.9, alpha);
                    ctx.fillStyle = currentSkin.color;
                    ctx.fillRect(x, y, barW, blockH - 1);
                }
            }
        }

        // ========== 街机像素 ==========
        else if (currentSubStyle === 'arcade') {
            ctx.shadowBlur = 3;

            for (let i = 0; i < barCount; i++) {
                const height = heights[i];
                if (height < 1) continue;
                const x = i * colWidth + offset;
                const blocks = Math.floor(height / blockH);
                for (let b = 0; b < blocks; b++) {
                    const y = h - (b + 1) * blockH;
                    const t = b / maxBlocks;
                    const alpha = 0.5 + t * 0.5;
                    ctx.globalAlpha = alpha;

                    // 街机风格：绿→黄→橙→红 渐变
                    if (t < 0.33) ctx.fillStyle = '#00FF66';
                    else if (t < 0.66) ctx.fillStyle = '#FFCC00';
                    else ctx.fillStyle = '#FF3366';

                    ctx.shadowColor = ctx.fillStyle;
                    ctx.fillRect(x, y, barW, blockH - 1);
                }
            }
        }

            // ========== 方格矩阵（全新） ==========
        // 整个频谱区域变成正方形网格，每个格子独立亮起
        else if (currentSubStyle === 'grid') {
            // 网格尺寸：每行8个格子，列数自动计算
            const gridSize = 12;           // 每个方格边长12px
            const cols = Math.floor(w / gridSize);     // 横向方格数量
            const rows = Math.floor(h / gridSize);     // 纵向方格数量

            // 根据音频强度决定每列亮多少个格子
            for (let col = 0; col < cols; col++) {
                // 将柱子数量映射到网格列
                const barIndex = Math.floor(col * barCount / cols);
                const height = heights[barIndex];
                const litRows = Math.floor(height / gridSize);

                for (let row = 0; row < rows; row++) {
                    const x = col * gridSize;
                    const y = h - (row + 1) * gridSize;
                    const isLit = row < litRows;

                    if (isLit) {
                        // 亮起的方格：带渐变和光晕
                        const t = row / rows;
                        const alpha = CONFIG.minAlpha + t * (CONFIG.maxAlpha - CONFIG.minAlpha);
                        ctx.globalAlpha = Math.min(0.9, alpha);
                        ctx.fillStyle = currentSkin.color;
                        ctx.fillRect(x, y, gridSize - 1, gridSize - 1);

                        // 方格高光
                        ctx.fillStyle = `rgba(255,255,255,0.2)`;
                        ctx.fillRect(x + 1, y + 1, gridSize - 3, 2);
                    } else {
                        // 暗去的方格：深色边框
                        ctx.globalAlpha = 0.15;
                        ctx.fillStyle = '#333333';
                        ctx.fillRect(x, y, gridSize - 1, gridSize - 1);
                    }
                }
            }

            // 绘制网格线（亮色细线）
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = currentSkin.color;
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= cols; i++) {
                ctx.beginPath();
                ctx.moveTo(i * gridSize, 0);
                ctx.lineTo(i * gridSize, h);
                ctx.stroke();
            }
            for (let i = 0; i <= rows; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * gridSize);
                ctx.lineTo(w, i * gridSize);
                ctx.stroke();
            }
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    // ==================== 控制面板 ====================
    let panel = null;
    let btnColor = null;
    let btnStyle = null;

    function createButtons(container) {
        if (panel || !container) return;

        panel = document.createElement('div');
        panel.style.cssText = 'position:absolute;top:8px;right:80px;z-index:10000;display:flex;gap:8px;pointer-events:auto;';

        btnColor = document.createElement('button');
        btnColor.style.cssText = 'background:#222;border:1px solid #ffaa33;color:#ffaa33;border-radius:16px;padding:4px 12px;font-size:12px;font-weight:bold;cursor:pointer;font-family:monospace;';
        btnColor.innerText = '🎨 ' + currentSkin.name;
        btnColor.onclick = function() {
            nextColor();
            btnColor.innerText = '🎨 ' + currentSkin.name;
        };

        btnStyle = document.createElement('button');
        btnStyle.style.cssText = 'background:#222;border:1px solid #88ccff;color:#88ccff;border-radius:16px;padding:4px 12px;font-size:12px;font-weight:bold;cursor:pointer;font-family:monospace;';
        btnStyle.innerText = '🎬 ' + SUB_STYLES[currentSubStyle];
        btnStyle.onclick = function() {
            nextSubStyle();
            btnStyle.innerText = '🎬 ' + SUB_STYLES[currentSubStyle];
        };

        panel.appendChild(btnColor);
        panel.appendChild(btnStyle);
        container.appendChild(panel);
        panel.style.display = 'none';
    }

    function showButtons() {
        if (panel) panel.style.display = 'flex';
    }

    function hideButtons() {
        if (panel) panel.style.display = 'none';
    }

    window.SpectrumRetro = {
        displayName: '📟 复古像素',
        draw: draw,
        createButtons: createButtons,
        showButtons: showButtons,
        hideButtons: hideButtons,
        nextColor: nextColor,
        nextSubStyle: nextSubStyle,
        getCurrentColorName: getCurrentColorName,
        getCurrentSubStyleName: getCurrentSubStyleName
    };
})();