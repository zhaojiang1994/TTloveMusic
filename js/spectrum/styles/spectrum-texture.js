(function() {
    const COLORS = [
        { name: '🌈 彩虹', hueStart: 0, hueEnd: 360 },
        { name: '🎛️ 琥珀', hueStart: 30, hueEnd: 50 },
        { name: '💚 翠绿', hueStart: 110, hueEnd: 150 },
        { name: '🔵 冰蓝', hueStart: 190, hueEnd: 230 },
        { name: '🌧️ 午夜灰蓝', hueStart: 210, hueEnd: 220 },
        { name: '🌩️ 雷暴紫', hueStart: 265, hueEnd: 285 },
        { name: '🌫️ 铅灰', hueStart: 200, hueEnd: 210 },
        { name: '🌊 深海蓝', hueStart: 225, hueEnd: 245 },
        { name: '🔮 电光紫', hueStart: 280, hueEnd: 300 },
        { name: '🌿 雨林绿', hueStart: 140, hueEnd: 170 }
    ];

    const SUB_STYLES = {
        neon: '⚡ 霓虹流光',
        glitch: '📺 故障艺术',
        plasma: '🔥 等离子余晖',
        waveform: '〰️ 原生波形',
        raindrop: '💧 音乐雨滴'
    };

    let colorIdx = 0, subStyle = 'neon';
    let _textureDataArray = null;
    let _textureHeights = [];
    let time = 0;

    // ------ 雨滴粒子系统 ------
    let raindrops = [];
    let splashPool = [];
    let windTimer = 0;
    let currentWindDirection = 0;
    let targetWindDirection = 0;

    // ------ 涟漪（椭圆扩散） ------
    let ripplePool = [];

    // ------ 闪电系统 ------
    let lightningActive = false;
    let lightningPaths = [];
    let lightningFlashIntensity = 0;
    let lightningFlashTimer = 0;
    let lightningForkTimer = 0;
    let lightningRemaining = 0;
    let lightningCooldown = 0;
    let lightningResidualGlow = 0;

    // ------ 神秘飞行物状态 ------
    let activeMysteryObject = null;

    // ------ 音量平滑 ------
    let smoothAvgVolume = 0;

    // ====================================================================
    //  可配置参数（全部带中文注释）
    // ====================================================================
    const RAIN_CONFIG = {
        // ==================== 基础雨滴配置 ====================
        maxDrops: 90,              // 最大雨滴数量（同时显示的雨滴总数）
        baseSpeed: 1,            // 雨滴基础下落速度（像素/帧）
        speedFactor: 1.8,          // 速度因子（用于根据音频强度加速雨滴）
        minSpeedFactor: 0.15,      // 最小速度因子（音频最弱时速度乘以此值）
        attackSpeed: 0.11,         // 攻击速度（音频增强时速度上升的灵敏度）
        releaseSpeed: 0.95,        // 释放速度（音频减弱时速度下降的灵敏度）
        minSize: 0.7,              // 雨滴最小粗细（像素）
        maxSize: 1.4,              // 雨滴最大粗细（像素）
        minLength: 5,              // 雨滴最短长度（像素）
        maxLength: 13,             // 雨滴最长长度（像素）
        opacity: 0.4,              // 雨滴整体不透明度（0-1之间）

        // ==================== 水波纹配置 ====================
        rippleTriggerProb: 0.15,    // 水波纹触发概率（雨滴击中底部时，0-1之间）
        rippleMaxCount: 13,        // 最大水波纹数量（同时显示的水波纹总数）
        rippleExpandSpeed: 0.7,    // 波纹扩散速度（像素/帧）
        rippleFadeSpeed: 0.015,    // 波纹淡出速度（每帧不透明度减少量）
        rippleMaxRadius: 28,       // 波纹最大半径（像素，超过后自动消失）

        // ==================== 水花飞溅配置 ====================
        splashTriggerProb: 0.06,   // 水花飞溅触发概率（雨滴击中底部时，0-1之间）
        splashMaxCount: 7,        // 最大水花数量（同时显示的水花粒子总数）
        splashGravity: 0.35,        // 水花重力（影响水花下落速度）
        splashFadeSpeed: 0.045,    // 水花淡出速度（每帧不透明度减少量）

        // ==================== 风吹效果配置 ====================
        windChangeIntervalMin: 7,   // 风向变化最小间隔（秒）
        windChangeIntervalMax: 12,  // 风向变化最大间隔（秒）
        windSmooth: 0.026,         // 风向平滑度（数值越小方向变化越平滑）
        windMaxSlope: 2.1,         // 最大风力斜率（控制风的最大偏移强度）

        // ==================== 闪电配置 ====================
        lightningThreshold: 0.85,   // 闪电触发阈值（音频强度超过85%时可触发）
        lightningIntervalMin: 7,    // 闪电最小间隔（秒）
        lightningIntervalMax: 13,   // 闪电最大间隔（秒）
        doubleStrikeProb: 0.5,      // 双重闪电概率（连续两次闪电，0-1之间）
        tripleStrikeProb: 0.4,      // 三重闪电概率（连续三次闪电，0-1之间）
        lightningBranchMin: 3,      // 闪电分支最小数量
        lightningBranchMax: 15,      // 闪电分支最大数量
        lightningMainWidth: 0.8,    // 闪电主干的宽度（像素）
        lightningCoreWidth: 0.6,    // 闪电核心的宽度（像素，更亮的内核）
    };
    // ====================================================================
    //  🚀 神秘飞行物配置 (新增)
    // ====================================================================
    const MYSTERY_OBJECT_CONFIG = {
        globalProb: 0.6,            // 每次闪电触发时，出现飞行物的总概率 (0~1)
        baseOpacity: 0.75,           // 飞行物最大透明度（模拟剪影，1为全黑不透明）
        minScale: 0.16,               // 飞行物最小缩放比例（显得远）
        maxScale: 0.6,               // 飞行物最大缩放比例（显得近）

        // 飞行物类型及其出现权重（权重越高，该物体越容易出现）
        types: [
            { id: 'ufo', weight: 20, name: '经典飞碟' },
            { id: 'airplane', weight: 30, name: '民航客机' },
            { id: 'spaceship', weight: 12, name: '科幻飞船' }
        ]
    };

    function initRaindrops(w, h) {
        raindrops = [];
        for (let i = 0; i < RAIN_CONFIG.maxDrops; i++) {
            const layer = Math.floor(Math.random() * 5);
            const layerFactor = (layer + 1) / 5;
            raindrops.push({
                x: Math.random() * w,
                y: Math.random() * h,
                speed: RAIN_CONFIG.baseSpeed + Math.random() * 3 + layerFactor * 2.5,
                size: RAIN_CONFIG.minSize + Math.random() * (RAIN_CONFIG.maxSize - RAIN_CONFIG.minSize) * layerFactor,
                length: RAIN_CONFIG.minLength + Math.random() * (RAIN_CONFIG.maxLength - RAIN_CONFIG.minLength) * layerFactor,
                layer: layer
            });
        }
        ripplePool = [];
    }

    function generateLightningPaths(w, h) {
        // [原版闪电路径生成代码保持完全不变]
        const paths = [];
        const startX = w * (0.15 + Math.random() * 0.7);
        const startY = -5;
        const endY = h * 0.25 + Math.random() * h * 0.3;

        const mainPath = [{ x: startX, y: startY }];
        let currentX = startX;
        let currentY = startY;
        let lastAngle = 0;

        while (currentY < endY) {
            const stepY = 10 + Math.random() * 22;
            const angleChange = (Math.random() - 0.5) * Math.PI * 0.65;
            const newAngle = lastAngle + angleChange;
            currentY += stepY;
            currentX += Math.sin(newAngle) * stepY * 0.8;
            currentX = Math.min(w - 30, Math.max(30, currentX));
            lastAngle = newAngle * 0.6 + lastAngle * 0.4;
            mainPath.push({ x: currentX, y: currentY });
        }
        paths.push(mainPath);

        const branchCount = RAIN_CONFIG.lightningBranchMin +
            Math.floor(Math.random() * (RAIN_CONFIG.lightningBranchMax - RAIN_CONFIG.lightningBranchMin));

        for (let b = 0; b < branchCount; b++) {
            const branchIdx = 2 + Math.floor(Math.random() * (mainPath.length - 3));
            const branchPt = mainPath[branchIdx];
            const branch = [{ x: branchPt.x, y: branchPt.y }];
            let bX = branchPt.x, bY = branchPt.y;
            const bLen = 25 + Math.random() * 70;
            const bDir = Math.random() > 0.5 ? 1 : -1;
            let bAngle = bDir * (0.3 + Math.random() * 0.9);

            while (bY - branchPt.y < bLen) {
                const stepY = 5 + Math.random() * 12;
                bY += stepY;
                bX += Math.sin(bAngle) * stepY * 0.6 + (Math.random() - 0.5) * 10;
                bX = Math.min(w - 10, Math.max(10, bX));
                branch.push({ x: bX, y: bY });
                bAngle += (Math.random() - 0.5) * 0.5;
            }
            paths.push(branch);

            if (branch.length > 3 && Math.random() > 0.5) {
                const subIdx = 1 + Math.floor(Math.random() * (branch.length - 2));
                const subPt = branch[subIdx];
                const sub = [{ x: subPt.x, y: subPt.y }];
                let sX = subPt.x, sY = subPt.y;
                const sLen = 10 + Math.random() * 30;
                const sDir = Math.random() > 0.5 ? 1 : -1;

                for (let s = 0; s < 4; s++) {
                    sY += 4 + Math.random() * 8;
                    sX += sDir * (2 + Math.random() * 8) + (Math.random() - 0.5) * 5;
                    sX = Math.min(w - 5, Math.max(5, sX));
                    sub.push({ x: sX, y: sY });
                    if (sY - subPt.y > sLen) break;
                }
                if (sub.length > 1) paths.push(sub);
            }
        }

        const twigCount = 6 + Math.floor(Math.random() * 10);
        for (let t = 0; t < twigCount; t++) {
            const idx = 2 + Math.floor(Math.random() * (mainPath.length - 3));
            const pt = mainPath[idx];
            const twig = [{ x: pt.x, y: pt.y }];
            let tX = pt.x, tY = pt.y;
            const tLen = 10 + Math.random() * 35;
            const tDir = Math.random() > 0.5 ? 1 : -1;

            while (tY - pt.y < tLen) {
                tY += 3 + Math.random() * 8;
                tX += tDir * (2 + Math.random() * 10) + (Math.random() - 0.5) * 6;
                tX = Math.min(w - 5, Math.max(5, tX));
                twig.push({ x: tX, y: tY });
            }
            paths.push(twig);
        }

        return paths;
    }

    function logMap(i, barCount, maxIndex) {
        if (maxIndex <= 0) return 0;
        const t = i / barCount;
        const logIndex = Math.pow(t, 1.5) * maxIndex;
        return Math.min(maxIndex - 1, Math.max(0, Math.floor(logIndex)));
    }

    function draw(core, canvas, ctx, barWidth) {
        if (!core || !canvas || !ctx) return;
        const w = canvas.width, h = canvas.height;
        const color = COLORS[colorIdx];

        if (raindrops.length === 0) initRaindrops(w, h);

        const bc = core.params.barCount;
        if (_textureHeights.length !== bc) _textureHeights = new Array(bc).fill(0);
        const heights = _textureHeights;
        let rawPeak = 0;

        if (core.isReady && core.analyser) {
            if (!_textureDataArray || _textureDataArray.length !== core.analyser.frequencyBinCount) {
                _textureDataArray = new Uint8Array(core.analyser.frequencyBinCount);
            }
            core.analyser.getByteFrequencyData(_textureDataArray);
            const maxIndex = Math.floor(_textureDataArray.length * 0.87);

            for (let i = 0; i < _textureDataArray.length; i++) {
                const val = _textureDataArray[i] / 255;
                if (val > rawPeak) rawPeak = val;
            }

            for (let i = 0; i < bc; i++) {
                const idx = logMap(i, bc, maxIndex);
                heights[i] = (_textureDataArray[idx] / 255) * h * 0.8;
            }
        } else {
            for (let i = 0; i < bc; i++) {
                heights[i] = Math.sin(Date.now() * 0.005 + i * 0.1) * 30 + 40;
            }
        }

        for (let i = 0; i < bc; i++) core.currentHeights[i] = heights[i];
        for (let i = 0; i < bc; i++) {
            core.waveY[i] = core.waveY[i] * 0.8 + (h - heights[i]) * 0.2;
        }

        let avgVolume = 0;
        for (let i = 0; i < heights.length; i++) avgVolume += heights[i];
        avgVolume = avgVolume / heights.length / (h * 0.8);

        const hasAudio = core.isReady && core.analyser && rawPeak > 0.05;
        if (!hasAudio) { avgVolume = 0; rawPeak = 0; }

        ctx.fillStyle = 'rgba(0, 3, 8, 0.25)';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        time += 0.03;

        if (subStyle === 'neon') drawNeon(ctx, w, h, color, core);
        else if (subStyle === 'glitch') drawGlitch(ctx, w, h, color, core);
        else if (subStyle === 'plasma') drawPlasma(ctx, w, h, color, core);
        else if (subStyle === 'waveform') drawWaveform(ctx, w, h, color, core);
        else if (subStyle === 'raindrop') drawRaindrop(ctx, w, h, color, core, avgVolume, rawPeak);

        ctx.restore();
    }

    // ====================================================================
    //  💧 音乐雨滴特效
    // ====================================================================
    function drawRaindrop(ctx, w, h, color, core, avgVolume, peakVolume) {
        const groundY = h * 0.92;

        const targetVol = avgVolume < 0.01 ? 0 : avgVolume;
        const smoothFactor = targetVol > smoothAvgVolume ? RAIN_CONFIG.attackSpeed : RAIN_CONFIG.releaseSpeed;
        smoothAvgVolume += (targetVol - smoothAvgVolume) * smoothFactor;
        const rhythmFactor = RAIN_CONFIG.minSpeedFactor + smoothAvgVolume * RAIN_CONFIG.speedFactor;

        // ============================================================
        //  1. 闪电系统与神秘飞行物触发
        // ============================================================
        const now = Date.now();
        if (lightningCooldown > 0 && now >= lightningCooldown) lightningCooldown = 0;

        if (lightningResidualGlow > 0) {
            lightningResidualGlow *= 0.94;
            if (lightningResidualGlow < 0.01) lightningResidualGlow = 0;
        }

        // 触发闪电
        if (peakVolume > RAIN_CONFIG.lightningThreshold && lightningCooldown === 0 && !lightningActive) {
            lightningActive = true;
            lightningRemaining = Math.random() < RAIN_CONFIG.doubleStrikeProb ? (Math.random() < RAIN_CONFIG.tripleStrikeProb ? 3 : 2) : 1;
            lightningFlashIntensity = 0;
            lightningForkTimer = 0;
            lightningFlashTimer = 0;
            lightningPaths = generateLightningPaths(w, h);
            lightningResidualGlow = 0.3;
            const interval = (RAIN_CONFIG.lightningIntervalMin + Math.random() * (RAIN_CONFIG.lightningIntervalMax - RAIN_CONFIG.lightningIntervalMin)) * 1000;
            lightningCooldown = now + interval;

            // 🚀 核心：闪电触发时，决定是否出现神秘飞行物
            if (Math.random() < MYSTERY_OBJECT_CONFIG.globalProb) {
                // 根据权重随机抽取类型
                const totalWeight = MYSTERY_OBJECT_CONFIG.types.reduce((sum, t) => sum + t.weight, 0);
                let r = Math.random() * totalWeight;
                let selectedId = MYSTERY_OBJECT_CONFIG.types[0].id;
                for (let t of MYSTERY_OBJECT_CONFIG.types) {
                    if (r < t.weight) { selectedId = t.id; break; }
                    r -= t.weight;
                }

                // 随机生成位置、朝向和大小
                activeMysteryObject = {
                    type: selectedId,
                    x: w * 0.15 + Math.random() * (w * 0.7), // 避开屏幕最边缘
                    y: h * 0.05 + Math.random() * (h * 0.4), // 出现在天空中上部
                    scale: MYSTERY_OBJECT_CONFIG.minScale + Math.random() * (MYSTERY_OBJECT_CONFIG.maxScale - MYSTERY_OBJECT_CONFIG.minScale),
                    flip: Math.random() > 0.5 ? 1 : -1
                };
            } else {
                activeMysteryObject = null; // 没触发
            }
        }

        // 闪电活动帧
        if (lightningActive) {
            lightningFlashTimer++;
            lightningForkTimer++;

            if (lightningFlashTimer < 2)          lightningFlashIntensity = 1.0;
            else if (lightningFlashTimer < 5)     lightningFlashIntensity = 0.8;
            else if (lightningFlashTimer < 10)    lightningFlashIntensity = 0.5;
            else if (lightningFlashTimer < 18)    lightningFlashIntensity = 0.25;
            else                                  lightningFlashIntensity = 0;

            if (lightningForkTimer > 20) {
                lightningRemaining--;
                lightningForkTimer = 0;
                if (lightningRemaining <= 0) {
                    lightningActive = false;
                    lightningFlashIntensity = 0;
                    lightningResidualGlow = 0.5;
                } else {
                    lightningFlashTimer = 0;
                    lightningPaths = generateLightningPaths(w, h);
                    lightningResidualGlow = 0.5;
                }
            }

            // ---- 绘制闪电与飞行物 ----
            if (lightningPaths && lightningPaths.length > 0 && lightningFlashIntensity > 0) {
                drawLightning(ctx, w, h, lightningPaths, lightningFlashIntensity);
            }
        }

        // 绘制闪电残光（闪完后的天际余光）
        if (lightningResidualGlow > 0 && !lightningActive) {
            ctx.save();
            const rg = ctx.createRadialGradient(w / 2, h * 0.12, 0, w / 2, h * 0.12, w * 0.55);
            rg.addColorStop(0, `rgba(200, 220, 255, ${lightningResidualGlow * 0.15})`);
            rg.addColorStop(1, 'rgba(200, 220, 255, 0)');
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, w, h * 0.4);
            ctx.restore();
        }

        // ============================================================
        //  2. 风向系统
        // ============================================================
        windTimer++;
        const windInterval = (RAIN_CONFIG.windChangeIntervalMin + Math.random() * (RAIN_CONFIG.windChangeIntervalMax - RAIN_CONFIG.windChangeIntervalMin)) * 60;
        if (windTimer > windInterval) {
            targetWindDirection = (Math.random() - 0.5) * RAIN_CONFIG.windMaxSlope;
            windTimer = 0;
        }
        currentWindDirection += (targetWindDirection - currentWindDirection) * RAIN_CONFIG.windSmooth;

        // ============================================================
        //  3. 更新雨滴
        // ============================================================
        for (let i = 0; i < raindrops.length; i++) {
            const drop = raindrops[i];
            const layerFactor = 0.6 + (drop.layer / 4) * 0.8;
            drop.x += (Math.random() - 0.5) * 0.3;
            drop.y += drop.speed * rhythmFactor * layerFactor;
            drop.x += currentWindDirection * (1.0 + drop.layer * 0.4) * rhythmFactor * layerFactor;

            if (drop.x > w) drop.x = 0;
            else if (drop.x < 0) drop.x = w;

            if (drop.y > groundY) {
                if (Math.random() < RAIN_CONFIG.rippleTriggerProb && ripplePool.length < RAIN_CONFIG.rippleMaxCount) {
                    ripplePool.push({
                        x: drop.x, r: 1.5 + Math.random() * 2, alpha: 0.6 + Math.random() * 0.3, layer: Math.floor(Math.random() * 3)
                    });
                }
                if (Math.random() < RAIN_CONFIG.splashTriggerProb && splashPool.length < RAIN_CONFIG.splashMaxCount) {
                    for (let s = 0; s < 3; s++) {
                        splashPool.push({
                            x: drop.x + (Math.random() - 0.5) * 5, y: groundY - 1, vx: (Math.random() - 0.5) * 3, vy: -1.5 - Math.random() * 2, life: 1.0, size: 0.8 + Math.random() * 1.5
                        });
                    }
                }
                drop.y = -10 - Math.random() * 180;
                drop.x = Math.random() * w;
            }
        }

        // ============================================================
        //  4. 绘制雨滴
        // ============================================================
        ctx.save();
        const layers = [[], [], [], [], []];
        raindrops.forEach(d => layers[d.layer].push(d));

        for (let l = 0; l < 5; l++) {
            const layerAlpha = 0.15 + (l / 4) * 0.55;
            const hueShift = l * 2;
            for (const drop of layers[l]) {
                if (drop.y > groundY) continue;
                const endY = drop.y + drop.length;
                const drawEndY = Math.min(endY, groundY);
                const ratio = (drawEndY - drop.y) / drop.length;
                const windOff = currentWindDirection * (1.0 + l * 0.5) * ratio;
                const ex = drop.x + windOff;
                const alpha = layerAlpha * RAIN_CONFIG.opacity;
                const baseWidth = drop.size;

                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(ex, drawEndY);
                ctx.strokeStyle = `hsla(${color.hueStart + hueShift}, 80%, 65%, ${alpha})`;
                ctx.lineWidth = baseWidth;
                ctx.lineCap = 'round';
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(ex, drawEndY);
                ctx.strokeStyle = `hsla(${color.hueStart + hueShift}, 90%, 88%, ${alpha * 0.35})`;
                ctx.lineWidth = baseWidth * 0.3;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        }
        ctx.restore();

        // ============================================================
        //  5 & 6. 绘制涟漪与水花
        // ============================================================
        ctx.save();
        for (let i = ripplePool.length - 1; i >= 0; i--) {
            const p = ripplePool[i];
            p.r += RAIN_CONFIG.rippleExpandSpeed;
            p.alpha -= RAIN_CONFIG.rippleFadeSpeed;
            if (p.alpha <= 0 || p.r > RAIN_CONFIG.rippleMaxRadius) {
                ripplePool.splice(i, 1);
            } else {
                ctx.beginPath();
                ctx.ellipse(p.x, groundY, p.r, p.r * 0.1, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${color.hueStart}, 75%, 68%, ${p.alpha * 0.5})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }
        }
        for (let i = splashPool.length - 1; i >= 0; i--) {
            const s = splashPool[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += RAIN_CONFIG.splashGravity;
            s.life -= RAIN_CONFIG.splashFadeSpeed;
            if (s.life <= 0) {
                splashPool.splice(i, 1);
            } else {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${color.hueStart}, 80%, 72%, ${s.life * 0.45})`;
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // ====================================================================
    //  ⚡ 绘制闪电（注入飞行物剪影渲染）
    // ====================================================================
    function drawLightning(ctx, w, h, paths, flashIntensity) {
        ctx.save();

        // a. 全屏背景闪光
        const bgIntensity = flashIntensity * 0.6;
        ctx.fillStyle = `rgba(220, 235, 255, ${bgIntensity})`;
        ctx.fillRect(0, 0, w, h);

        // 🚀 在闪光背景前，闪电路径之后（或之前）绘制神秘飞行物的剪影
        if (activeMysteryObject) {
            // 物体可见度跟随闪电强度（在夜空中只被闪电照亮）
            const objAlpha = flashIntensity * MYSTERY_OBJECT_CONFIG.baseOpacity;
            if (objAlpha > 0.05) {
                drawMysteryObject(ctx, activeMysteryObject, objAlpha);
            }
        }

        // b. 绘制所有分支路径
        for (let pIdx = 0; pIdx < paths.length; pIdx++) {
            const path = paths[pIdx];
            if (!path || path.length < 2) continue;

            const isMain = pIdx === 0;
            const hierarchyFactor = isMain ? 1.0 : (pIdx < 1 + RAIN_CONFIG.lightningBranchMin ? 0.75 : 0.5);

            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);

            const outerA = flashIntensity * 0.6 * hierarchyFactor;
            ctx.strokeStyle = `rgba(160, 210, 255, ${outerA})`;
            ctx.lineWidth = calcTaperedWidth(path, isMain, 5 + flashIntensity * 3, hierarchyFactor);
            ctx.shadowBlur = 30;
            ctx.shadowColor = `rgba(180, 220, 255, ${outerA * 0.3})`;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);

            const mainA = flashIntensity * 0.9 * hierarchyFactor;
            ctx.strokeStyle = `rgba(230, 240, 255, ${mainA})`;
            ctx.lineWidth = calcTaperedWidth(path, isMain, RAIN_CONFIG.lightningMainWidth + flashIntensity * 1.5, hierarchyFactor);
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(230, 240, 255, ${mainA})`;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);

            ctx.strokeStyle = `rgba(255, 255, 255, ${flashIntensity * 0.85 * hierarchyFactor})`;
            ctx.lineWidth = calcTaperedWidth(path, isMain, RAIN_CONFIG.lightningCoreWidth, hierarchyFactor);
            ctx.shadowBlur = 0;
            ctx.stroke();
        }
        ctx.restore();
    }

    // ====================================================================
    //  🛸 绘制神秘飞行物（高精度路径剪影）
    // ====================================================================
    function drawMysteryObject(ctx, obj, alpha) {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.scale(obj.scale * obj.flip, obj.scale);

        // 由于是背光剪影，我们用极深的灰蓝色
        ctx.fillStyle = `rgba(10, 15, 25, ${alpha})`;
        ctx.beginPath();

        if (obj.type === 'ufo') {
            // 经典飞碟：穹顶 + 大圆盘 + 底部突起
            // 穹顶
            ctx.ellipse(0, -8, 18, 12, 0, Math.PI, 0);
            // 底部突起
            ctx.ellipse(0, 5, 22, 8, 0, 0, Math.PI);
            ctx.fill();
            // 大圆盘主机体
            ctx.beginPath();
            ctx.ellipse(0, 0, 45, 12, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (obj.type === 'airplane') {
            // 民航客机侧影 (机头向左/右取决于 flip)
            ctx.moveTo(40, 0); // 机头
            ctx.quadraticCurveTo(30, -7, 10, -7); // 机身上沿
            ctx.lineTo(-30, -7);
            ctx.lineTo(-42, -22); // 垂直尾翼顶端
            ctx.lineTo(-48, -22); // 尾翼宽
            ctx.lineTo(-42, -4);
            ctx.lineTo(-52, -2); // 尾椎
            ctx.lineTo(-42, 5);  // 尾部下方
            ctx.lineTo(-10, 7);  // 机身下沿
            ctx.lineTo(10, 7);
            ctx.quadraticCurveTo(30, 7, 40, 0); // 机头下沿
            ctx.fill();

            // 主机翼 (略微带有透视)
            ctx.beginPath();
            ctx.moveTo(-10, 2);
            ctx.lineTo(-8, 18);
            ctx.lineTo(12, 18);
            ctx.lineTo(8, 2);
            ctx.fill();

            // 发动机吊舱剪影
            ctx.beginPath();
            ctx.ellipse(-2, 10, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();

        } else if (obj.type === 'spaceship') {
            // 科幻飞船 / 星际巡洋舰 (流线型隐身战机/歼星舰风格)
            ctx.moveTo(55, 0); // 尖锐机鼻
            ctx.lineTo(10, -8);
            ctx.lineTo(-30, -18); // 尾翼上端
            ctx.lineTo(-30, -8);
            ctx.lineTo(-45, -8); // 引擎区块
            ctx.lineTo(-45, 8);
            ctx.lineTo(-30, 8);
            ctx.lineTo(-30, 18); // 尾翼下端
            ctx.lineTo(10, 8);
            ctx.closePath();
            ctx.fill();

            // 侧翼细节
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(-20, 25);
            ctx.lineTo(-35, 25);
            ctx.lineTo(-10, 0);
            ctx.fill();
        }

        ctx.restore();
    }

    function calcTaperedWidth(path, isMain, baseWidth, hierarchyFactor) {
        if (path.length < 2) return baseWidth * hierarchyFactor;
        const taperRatio = isMain ? 0.6 : 0.4;
        const midTaper = 1 - taperRatio * 0.5;
        return baseWidth * midTaper * hierarchyFactor;
    }

    // ====================================================================
    //  其他样式（保持不变）
    // ====================================================================
    function drawWaveform(ctx, w, h, color, core) {
        const bc = core.params.barCount;
        const bw = w / bc;
        ctx.beginPath();
        for (let i = 0; i < bc; i++) {
            const x = i * bw + bw / 2;
            const y = core.waveY[i];
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsl(${color.hueStart}, 80%, 60%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fillStyle = `hsla(${color.hueStart}, 80%, 55%, 0.15)`;
        ctx.fill();
    }

    function drawNeon(ctx, w, h, color, core) {
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 3; i++) {
            ctx.shadowBlur = 20 + i * 10;
            ctx.shadowColor = `hsl(${color.hueStart}, 100%, 50%)`;
            ctx.strokeStyle = `hsla(${color.hueStart}, 100%, 70%, 0.6)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let j = 0; j < core.currentHeights.length; j++) {
                const x = (j / core.currentHeights.length) * w;
                const y = h - (core.currentHeights[j] * 0.8) - Math.sin(j * 0.1 + time) * 20;
                j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }

    function drawGlitch(ctx, w, h, color, core) {
        const offset = Math.sin(time) * 5;
        ctx.strokeStyle = 'rgba(255, 0, 100, 0.8)';
        drawPath(ctx, w, h, core, offset);
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
        drawPath(ctx, w, h, core, -offset);
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    }

    function drawPlasma(ctx, w, h, color, core) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.translate(w / 2, h / 2);
        for (let i = 0; i < 10; i++) {
            ctx.rotate(time * 0.1);
            ctx.strokeStyle = `hsla(${color.hueStart + i * 10}, 80%, 50%, 0.3)`;
            ctx.beginPath();
            ctx.arc(0, 0, core.currentHeights[i % 10] * 2, 0, Math.PI);
            ctx.stroke();
        }
    }

    function drawPath(ctx, w, h, core, offset) {
        ctx.beginPath();
        for (let i = 0; i < core.currentHeights.length; i++) {
            const x = (i / core.currentHeights.length) * w + offset;
            const y = h - core.currentHeights[i];
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    window.SpectrumTexture = {
        displayName: '✨ Web纹理',
        draw,
        nextColor: () => {
            colorIdx = (colorIdx + 1) % COLORS.length;
            return COLORS[colorIdx].name;
        },
        nextSubStyle: () => {
            const keys = Object.keys(SUB_STYLES);
            subStyle = keys[(keys.indexOf(subStyle) + 1) % keys.length];
            return SUB_STYLES[subStyle];
        },
        getCurrentColorName: () => COLORS[colorIdx].name,
        getCurrentSubStyleName: () => SUB_STYLES[subStyle]
    };
})();