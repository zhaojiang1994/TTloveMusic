// ==================== 柱状图样式 spectrum-bars.js ====================
// 皮肤系统 | 一键切换不同视觉效果
// 就像换游戏皮肤一样简单 | 40+种色彩皮肤
// ================================================================

(function() {
    // ==================== 皮肤配置 ====================
    const SKINS = {
        // ========== 复古系列 ==========
        vintageLed: {
            name: '📼 复古LED',
            getColor: (height, maxH) => {
                const t = height / maxH;
                if (t < 0.3) return `hsl(120, 100%, 50%)`;
                if (t < 0.6) return `hsl(80, 100%, 55%)`;
                if (t < 0.8) return `hsl(50, 100%, 55%)`;
                return `hsl(0, 100%, 55%)`;
            },
            drawExtra: (ctx, x, y, w, h, maxH, canvas) => {
                ctx.shadowBlur = 0;
                ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
                const ledHeight = 6;
                const ledCount = Math.floor(h / ledHeight);
                for (let l = 1; l < ledCount; l++) {
                    const lineY = y + h - l * ledHeight;
                    ctx.fillRect(x, lineY - 1, w, 1);
                }
            },
            glowColor: 'rgba(0, 255, 0, 0.15)',
            background: '#0a0a0a'
        },
        vuMeter: {
            name: '📊 VU表',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(60, 30%, ${50 + t * 30}%)`;
            },
            drawExtra: (ctx, x, y, w, h, maxH, canvas) => {
                ctx.shadowBlur = 6;
                ctx.shadowColor = `rgba(255, 255, 200, 0.5)`;
                ctx.strokeStyle = `rgba(255, 255, 200, 0.2)`;
                ctx.lineWidth = 0.5;
                for (let i = 1; i <= 5; i++) {
                    const lineY = y + h * (i / 5);
                    ctx.beginPath();
                    ctx.moveTo(x, lineY);
                    ctx.lineTo(x + w, lineY);
                    ctx.stroke();
                }
            },
            glowColor: 'rgba(255, 255, 200, 0.2)',
            background: '#0a0a0a'
        },
        monoGreen: {
            name: '📟 荧光绿',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(120, 100%, ${30 + t * 35}%)`;
            },
            drawExtra: (ctx, x, y, w, h, maxH, canvas) => {
                ctx.shadowBlur = 4;
                ctx.shadowColor = `rgba(0, 255, 0, 0.5)`;
            },
            glowColor: 'rgba(0, 255, 0, 0.2)',
            background: '#050a05'
        },
        amberGlow: {
            name: '🟠 琥珀光',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(30, 100%, ${40 + t * 35}%)`;
            },
            drawExtra: (ctx, x, y, w, h, maxH, canvas) => {
                ctx.shadowBlur = 6;
                ctx.shadowColor = `rgba(255, 100, 0, 0.4)`;
            },
            glowColor: 'rgba(255, 100, 0, 0.2)',
            background: '#0a0505'
        },

        // ========== 自然系列 ==========
        fire: {
            name: '🔥 烈焰',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${20 + t * 30}, 95%, ${45 + t * 35}%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(255, 80, 0, 0.3)',
            background: '#1a0a00'
        },
        water: {
            name: '💧 海洋',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${200 + t * 20}, 85%, ${40 + t * 35}%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(0, 150, 255, 0.2)',
            background: '#001020'
        },
        ice: {
            name: '🧊 极冰',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${190 - t * 20}, 85%, ${55 + t * 25}%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(100, 200, 255, 0.2)',
            background: '#0a1525'
        },
        forest: {
            name: '🌲 森林',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${100 + t * 30}, 85%, ${30 + t * 35}%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(50, 200, 50, 0.2)',
            background: '#0a1a0a'
        },

        // ========== 科幻系列 ==========
        neon: {
            name: '⚡ 霓虹',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${280 + t * 60}, 95%, ${55 + t * 25}%)`;
            },
            drawExtra: (ctx, x, y, w, h, maxH, canvas) => {
                ctx.shadowBlur = 8;
                ctx.shadowColor = `hsl(${280}, 90%, 65%)`;
                ctx.strokeStyle = `hsl(${280}, 90%, 70%)`;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, w, h);
                ctx.shadowBlur = 0;
            },
            glowColor: 'rgba(200, 0, 255, 0.3)',
            background: '#0a0a1a'
        },
        galaxy: {
            name: '🌌 银河',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${260 + t * 80}, 90%, ${45 + t * 25}%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(180, 100, 255, 0.3)',
            background: '#0a0a2a'
        },

        // ========== 宝石系列 ==========
        ruby: {
            name: '🔴 红宝石',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${350 - t * 10}, 95%, ${45 + t * 35}%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(255, 0, 50, 0.3)',
            background: '#1a0508'
        },
        sapphire: {
            name: '🔵 蓝宝石',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${220 + t * 10}, 90%, ${40 + t * 35}%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(50, 80, 255, 0.3)',
            background: '#050a1a'
        },
        crystal: {
            name: '💎 水晶',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${180 + t * 60}, 80%, ${50 + t * 25}%)`;
            },
            drawExtra: (ctx, x, y, w, h, maxH, canvas) => {
                ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
                ctx.fillRect(x + 2, y + 2, 3, h * 0.3);
            },
            glowColor: 'rgba(100, 200, 200, 0.25)',
            background: '#0a1518'
        },

        // ========== 渐变系列 ==========
        sunset: {
            name: '🌅 日落',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${30 + t * 20}, 90%, ${45 + t * 35}%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(255, 120, 50, 0.2)',
            background: '#1a0a05'
        },
        midnight: {
            name: '🌙 午夜',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${240 + t * 20}, 85%, ${30 + t * 25}%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(80, 80, 200, 0.2)',
            background: '#050510'
        },
        candy: {
            name: '🍬 糖果',
            getColor: (height, maxH) => {
                const t = height / maxH;
                return `hsl(${300 + t * 60}, 90%, ${60 + t * 20}%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(255, 100, 200, 0.2)',
            background: '#1a0a15'
        },

        // ========== 彩色系列 ==========
        rainbow: {
            name: '🌈 彩虹',
            getColor: (height, maxH, i) => {
                const t = (i * 0.1 + height / maxH * 0.5) % 1;
                return `hsl(${t * 360}, 90%, 55%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(255, 255, 255, 0.1)',
            background: '#0a0a1a'
        },
        pastel: {
            name: '🎨 马卡龙',
            getColor: (height, maxH, i) => {
                const t = (i * 0.08 + height / maxH * 0.3) % 1;
                return `hsl(${t * 360}, 70%, 65%)`;
            },
            drawExtra: null,
            glowColor: 'rgba(255, 255, 255, 0.1)',
            background: '#1a1a2a'
        }
    };

    const SKIN_NAMES = Object.keys(SKINS);
    let currentSkinIndex = 0;
    let currentSkin = SKINS[SKIN_NAMES[0]];

    // ==================== 其他配置 ====================
// 柱状图（条形）整体配置
    const BARS_CONFIG = {
        count: 49,               // 柱子的数量（频率段数量）
        minHeight: 1,           // 柱子的最小高度（像素），防止完全消失看不见
        barSpacing: 2,          // 柱子之间的间距（像素）
        useGradient: true,      // 是否使用渐变色填充柱子（true=渐变，false=纯色）
        useLogScale: true,      // 是否使用对数刻度处理音频数据（视觉上更平滑，突出中低频）
        maxDataRatio: 0.87      // 音频数据映射到柱子高度的最大比例（0~1，限制最高柱子的占比）
    };

// 峰值（波峰保留效果）配置
    const PEAK_CONFIG = {
        retain: 0.992,        // 峰值下降速度（衰减因子，值越接近1，峰值的痕迹停留越久）
        gap: 4,                 // 峰值标记线与柱状图顶部的间隔距离（像素）
        lineWidth: 1.3,         // 峰值标记线的粗细（像素）
        minHeight: 2            // 峰值标记的最小高度（像素），避免太短不显眼
    };

// 波形线（实时平滑曲线）配置
    const WAVE_CONFIG = {
        lineWidth: 2,           // 波形线条的粗细（像素）
        smoothness: 0.65,       // 波形线的平滑度/阻尼系数：0.85响应快较跟手，0.65更平滑但拖影稍明显
        aboveBarOffset: 8       // 波形线相对于柱子顶部的垂直偏移（像素），正值表示高于柱子绘制
    };

    const SUB_STYLES = {
        bars: '📊 柱状条',
        waveform: '〰️ 波形线',
        peaks: '📈 峰值线'
    };

    let currentSubStyle = 'bars';
    let myPeakLines = [];
    let _barsDataArray = null;
    let _gradientCache = [];
    let _gradientKeys = [];
    let time = 0;

    function logMap(i, bc, maxIndex) {
        if (maxIndex <= 0) return 0;
        const t = i / bc;
        const logIndex = Math.pow(t, 1.5) * maxIndex;
        return Math.min(maxIndex - 1, Math.max(0, Math.floor(logIndex)));
    }

    function getCurrentColorName() {
        return currentSkin.name;
    }

    function nextColor() {
        currentSkinIndex = (currentSkinIndex + 1) % SKIN_NAMES.length;
        currentSkin = SKINS[SKIN_NAMES[currentSkinIndex]];
        return currentSkin.name;
    }

    function nextSubStyle() {
        const keys = Object.keys(SUB_STYLES);
        currentSubStyle = keys[(keys.indexOf(currentSubStyle) + 1) % keys.length];
        return SUB_STYLES[currentSubStyle];
    }

    function getCurrentSubStyleName() {
        return SUB_STYLES[currentSubStyle];
    }

    function setPeakRetain(value) {
        PEAK_CONFIG.retain = Math.min(0.99, Math.max(0.80, value));
    }

    function setBarCount(core, count) {
        if (core && core.params) {
            core.params.barCount = Math.min(128, Math.max(16, count));
            core.initArrays();
        }
    }

    function draw(core, canvas, ctx, bw) {
        const bc = core.params.barCount;
        const bh = canvas.height;
        time++;

        if (myPeakLines.length !== bc) {
            myPeakLines = new Array(bc).fill(0);
            _gradientCache = new Array(bc);
            _gradientKeys = new Array(bc);
        }

        // 采集频谱数据（一次性）
        if (core.isReady && core.analyser) {
            if (!_barsDataArray || _barsDataArray.length !== core.analyser.frequencyBinCount) {
                _barsDataArray = new Uint8Array(core.analyser.frequencyBinCount);
            }
            core.analyser.getByteFrequencyData(_barsDataArray);
            const maxDataIndex = Math.floor(_barsDataArray.length * BARS_CONFIG.maxDataRatio);
            const t = time * 0.005; // 一次计算，供 fallback 使用
            for (let i = 0; i < bc; i++) {
                const dataIndex = BARS_CONFIG.useLogScale ? logMap(i, bc, maxDataIndex) : Math.floor(i * maxDataIndex / bc);
                const value = _barsDataArray[dataIndex] / 255;
                core.targetHeights[i] = Math.max(BARS_CONFIG.minHeight, value * bh);
            }
        } else {
            const t = time * 0.005;
            for (let i = 0; i < bc; i++) {
                core.targetHeights[i] = Math.sin(t + i * 0.1) * 20 + 30;
            }
        }

        // 平滑高度（合并为一个循环）
        for (let i = 0; i < bc; i++) {
            const ch = core.currentHeights[i];
            const th = core.targetHeights[i];
            core.currentHeights[i] = ch * core.params.smoothing + th * (1 - core.params.smoothing);

            // 同时更新波形线和峰值线
            const targetY = bh - core.currentHeights[i] - WAVE_CONFIG.aboveBarOffset;
            core.waveY[i] = core.waveY[i] * WAVE_CONFIG.smoothness + targetY * (1 - WAVE_CONFIG.smoothness);
            if (core.waveY[i] < 2) core.waveY[i] = 2;
            if (core.waveY[i] > bh - 2) core.waveY[i] = bh - 2;

            // 峰值线
            if (core.currentHeights[i] > myPeakLines[i]) {
                myPeakLines[i] = core.currentHeights[i];
            } else {
                myPeakLines[i] = myPeakLines[i] * PEAK_CONFIG.retain;
                if (myPeakLines[i] < core.currentHeights[i]) myPeakLines[i] = core.currentHeights[i];
            }
        }

        const barWidth = bw - BARS_CONFIG.barSpacing;
        const offset = BARS_CONFIG.barSpacing / 2;

        // 应用皮肤背景
        ctx.fillStyle = currentSkin.background;
        ctx.fillRect(0, 0, canvas.width, bh);

        // 光晕效果 — 只设一次
        ctx.shadowBlur = 5;
        ctx.shadowColor = currentSkin.glowColor;

        // 绘制柱子
        for (let i = 0; i < bc; i++) {
            const h = core.currentHeights[i];
            if (h < BARS_CONFIG.minHeight) continue;

            const x = i * bw + offset;
            const y = bh - h;
            const maxH = bh;

            // 获取皮肤颜色（参数个数判断一次即可）
            let barColor, darkColor;
            if (currentSkin.getColor.length === 3) {
                barColor = currentSkin.getColor(h, maxH, i);
                darkColor = BARS_CONFIG.useGradient ? currentSkin.getColor(h * 0.3, maxH, i) : null;
            } else {
                barColor = currentSkin.getColor(h, maxH);
                darkColor = BARS_CONFIG.useGradient ? currentSkin.getColor(h * 0.3, maxH) : null;
            }

            // 渐变处理 — 按位置缓存，避免每帧新建
            if (BARS_CONFIG.useGradient) {
                if (!_gradientCache[i] || _gradientKeys[i] !== barColor) {
                    var g = ctx.createLinearGradient(0, 0, 0, bh);
                    g.addColorStop(0, barColor);
                    g.addColorStop(1, darkColor || barColor);
                    _gradientCache[i] = g;
                    _gradientKeys[i] = barColor;
                }
                ctx.fillStyle = _gradientCache[i];
            } else {
                ctx.fillStyle = barColor;
            }

            ctx.fillRect(x, y, barWidth, h);

            // 顶部高光
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(x, y, barWidth, 2);

            // 皮肤特效（若存在）
            if (currentSkin.drawExtra) {
                currentSkin.drawExtra(ctx, x, y, barWidth, h, maxH, canvas);
            }
        }

        ctx.shadowBlur = 0;

        // 波形线模式
        if (currentSubStyle === 'waveform') {
            ctx.beginPath();
            ctx.lineWidth = WAVE_CONFIG.lineWidth;
            ctx.strokeStyle = 'rgba(255,255,200,0.8)';
            for (let i = 0; i < bc; i++) {
                const x = i * bw + bw / 2;
                const y = core.waveY[i];
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // 峰值线模式
        if (currentSubStyle === 'peaks') {
            ctx.lineWidth = PEAK_CONFIG.lineWidth;
            for (let i = 0; i < bc; i++) {
                const ph = myPeakLines[i];
                if (ph < PEAK_CONFIG.minHeight) continue;
                const x = i * bw + offset;
                const ly = bh - ph - PEAK_CONFIG.gap;
                ctx.strokeStyle = 'white';
                // ctx.strokeStyle = 'rgba(255,200,100,0.9)';
                ctx.beginPath();
                ctx.moveTo(x, ly);
                ctx.lineTo(x + barWidth, ly);
                ctx.stroke();
            }
        }
    }

    window.SpectrumBars = {
        displayName: '🎨 频谱皮肤',
        draw: draw,
        nextColor: nextColor,
        getCurrentColorName: getCurrentColorName,
        nextSubStyle: nextSubStyle,
        getCurrentSubStyleName: getCurrentSubStyleName,
        setPeakRetain: setPeakRetain,
        setBarCount: setBarCount
    };
})();