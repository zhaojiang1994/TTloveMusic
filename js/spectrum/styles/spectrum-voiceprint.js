// ==================== 声纹样式 spectrum-voiceprint.js ====================
// 声纹频谱 | 波形+填充 | 峰值横线
// ================================================================

(function() {
    // ==================== 皮肤配置 ====================
    const COLORS = [
        { name: '📺 VFD青绿', color: '#44ddbb', background: '#0a0a0a' },
        { name: '💚 翠绿', color: '#44cc55', background: '#0a0a0a' },
        { name: '🔵 冰蓝', color: '#4499dd', background: '#0a0a0a' },
        { name: '🎛️ 橙红', color: '#ff8844', background: '#0a0a0a' },
        { name: '🟣 紫罗兰', color: '#cc66ff', background: '#0a0a0a' },
        { name: '⚪ 荧光白', color: '#e8f4f8', background: '#0a0a0a' },
        { name: '🟠 琥珀', color: '#ffaa33', background: '#0a0a0a' }
    ];

    // ==================== 二级样式 ====================
    const SUB_STYLES = {
        waveform: '〰️ 声纹波形',
        peaks: '📈 峰值横线'
    };

    // ==================== 配置 ====================
    const CONFIG = {
        maxDataRatio: 0.87,     // 只采集前87%的频谱数据
        useLogScale: true,      // 使用对数刻度
        attackSpeed: 0.75,      // 上升速度（越慢上升越缓）
        releaseSpeed: 0.01,     // 回落速度（越接近1回落越慢）
        peakAttack: 0.45,       // 峰值上升速度（更慢，跟随更缓）
        peakRelease: 0.28       // 峰值回落速度（接近1，消失非常慢）
    };

    let currentColorIndex = 0;
    let currentSubStyle = 'waveform';
    let currentColor = COLORS[0];

    // ==================== 状态变量 ====================
    let lastDrawTime = 0;
    let _voiceprintDataArray = null;
    let _vpSourceHeights = [];
    let smoothedHeights = [];
    let peakLines = [];

    // 对数映射函数
    function logMap(i, barCount, maxDataIndex) {
        if (maxDataIndex <= 0) return 0;
        const t = i / barCount;
        const logIndex = Math.pow(t, 1.5) * maxDataIndex;
        return Math.min(maxDataIndex - 1, Math.max(0, Math.floor(logIndex)));
    }

    // ==================== 接口函数 ====================
    function nextColor() {
        currentColorIndex = (currentColorIndex + 1) % COLORS.length;
        currentColor = COLORS[currentColorIndex];
        return currentColor.name;
    }

    function nextSubStyle() {
        const keys = Object.keys(SUB_STYLES);
        currentSubStyle = keys[(keys.indexOf(currentSubStyle) + 1) % keys.length];
        return SUB_STYLES[currentSubStyle];
    }

    function getCurrentColorName() {
        return currentColor.name;
    }

    function getCurrentSubStyleName() {
        return SUB_STYLES[currentSubStyle];
    }

    // ==================== 主绘制函数 ====================
    function draw(core, canvas, ctx, barWidth) {
        if (!core || !canvas || !ctx) return;

        const now = Date.now();
        if (now - lastDrawTime < 20) return;
        lastDrawTime = now;

        const w = canvas.width;
        const h = canvas.height;
        const bc = core.params.barCount;
        const bw = barWidth;
        const color = currentColor.color;

        // ========== 1. 采集频谱数据（限制87%） ==========
        if (_vpSourceHeights.length !== bc) _vpSourceHeights = new Array(bc).fill(0);
        let sourceHeights = _vpSourceHeights;
        let hasAudio = false;

        if (core.isReady && core.analyser) {
            if (!_voiceprintDataArray || _voiceprintDataArray.length !== core.analyser.frequencyBinCount) {
                _voiceprintDataArray = new Uint8Array(core.analyser.frequencyBinCount);
            }
            core.analyser.getByteFrequencyData(_voiceprintDataArray);
            const maxDataIndex = Math.floor(_voiceprintDataArray.length * CONFIG.maxDataRatio);

            let maxVal = 0;
            for (let i = 0; i < maxDataIndex; i++) if (_voiceprintDataArray[i] > maxVal) maxVal = _voiceprintDataArray[i];
            hasAudio = maxVal > 5;

            if (hasAudio) {
                for (let i = 0; i < bc; i++) {
                    const idx = CONFIG.useLogScale ? logMap(i, bc, maxDataIndex) : Math.floor(i / bc * maxDataIndex);
                    sourceHeights[i] = (_voiceprintDataArray[idx] / 255) * h;
                }
            }
        } else {
            for (let i = 0; i < bc; i++) {
                sourceHeights[i] = Math.sin(Date.now() * 0.005 + i * 0.1) * 30 + 40;
            }
            hasAudio = true;
        }

        // ========== 2. 平滑高度（柱子动画） ==========
        if (smoothedHeights.length !== bc) smoothedHeights = [...sourceHeights];
        for (let i = 0; i < bc; i++) {
            const t = sourceHeights[i];
            const c = smoothedHeights[i];
            if (t > c) {
                smoothedHeights[i] = c * CONFIG.attackSpeed + t * (1 - CONFIG.attackSpeed);
            } else {
                smoothedHeights[i] = c * CONFIG.releaseSpeed + t * (1 - CONFIG.releaseSpeed);
            }
            if (smoothedHeights[i] < 2) smoothedHeights[i] = 0;
        }

        // ========== 3. 更新峰值线（上升慢、回落非常慢） ==========
        if (peakLines.length !== bc) peakLines = new Array(bc).fill(0);
        for (let i = 0; i < bc; i++) {
            if (smoothedHeights[i] > peakLines[i]) {
                // 峰值上升：慢速跟随（不立刻跳到最高，而是缓慢上升）
                peakLines[i] = peakLines[i] * CONFIG.peakAttack + smoothedHeights[i] * (1 - CONFIG.peakAttack);
            } else {
                // 峰值回落：非常慢，几乎不消失
                peakLines[i] = peakLines[i] * CONFIG.peakRelease;
                if (peakLines[i] < smoothedHeights[i]) peakLines[i] = smoothedHeights[i];
            }
        }

        // ========== 4. 更新 waveY 波形位置 ==========
        for (let i = 0; i < bc; i++) {
            const targetY = h - smoothedHeights[i];
            core.waveY[i] = core.waveY[i] * 0.8 + targetY * 0.2;
        }

        // ========== 5. 绘制 ==========
        // 清空画布
        ctx.fillStyle = currentColor.background;
        ctx.fillRect(0, 0, w, h);

        // ========== 声纹波形模式 ==========
        if (currentSubStyle === 'waveform') {
            // 1. 绘制波形折线
            ctx.beginPath();
            for (let i = 0; i < bc; i++) {
                const x = i * bw + bw / 2;
                const y = core.waveY[i];
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            // 2. 绘制波形下方填充区域
            ctx.beginPath();
            for (let i = 0; i < bc; i++) {
                const x = i * bw + bw / 2;
                const y = core.waveY[i];
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = `${color}33`;
            ctx.fill();

            // 3. 发光效果
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
            ctx.beginPath();
            for (let i = 0; i < bc; i++) {
                const x = i * bw + bw / 2;
                const y = core.waveY[i];
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // ========== 峰值横线模式（优化版） ==========
        else if (currentSubStyle === 'peaks') {
            ctx.lineWidth = 1.5;
            for (let i = 0; i < bc; i++) {
                const ph = peakLines[i];
                // 只要峰值大于5像素就显示横线（不要求比当前高度高）
                if (ph > 5) {
                    const x = i * bw;
                    const py = h - ph;
                    ctx.beginPath();
                    ctx.moveTo(x, py);
                    ctx.lineTo(x + bw - 1, py);
                    ctx.strokeStyle = color;
                    ctx.stroke();
                }
            }
        }
    }

    // ==================== 导出插件接口 ====================
    window.SpectrumVoiceprint = {
        displayName: '🎙️ 声纹',
        draw: draw,
        nextColor: nextColor,
        nextSubStyle: nextSubStyle,
        getCurrentColorName: getCurrentColorName,
        getCurrentSubStyleName: getCurrentSubStyleName
    };
})();