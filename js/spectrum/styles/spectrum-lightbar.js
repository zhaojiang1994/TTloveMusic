// 拾音灯样式 - 完整版（有效区间占满画布）【性能优化版 - 视觉不变】
(function() {
    // ==================== 用户可调参数 ====================
    // ==================== 主拾音灯参数配置 ====================
// 作用：控制频谱响应速度、灵敏度、平滑度、LED 视觉效果
// 所有参数仅影响动画与视觉表现，不改变画面样式

    const sprays = [];


    const CONFIG = {
        ledTotal: 30,                    // LED 总数量
        nonlinearExponent: 3.89,         // 音量非线性映射指数（控制灵敏度曲线）
        minVolumeThreshold: 1.55,        // 最小音量阈值（低于此值视为无声）
        volumeAttack: 0.51,              // 音量起奏速度（声音变大的响应速度）
        volumeDecay: 0.97,              // 音量衰减速度（声音变小的回落速度）
        levelSmooth: 0.95,               // LED 整体平滑度
        hysteresis: 0.93,                // 滞后系数（防止灯条快速闪烁）
        maxVolumeDecay: 0.999,           // 最大音量记录衰减
        maxVolumeMin: 10,                // 最小音量上限
        volumeHistoryFrames: 25,         // 音量历史记录帧数
        ledBrightness: 0.87,             // LED 亮度系数
        shadowBlur: 2,                   // 灯光阴影模糊强度
        highlightStrength: 0.3,          // LED 高光强度
        gradientDarkness: 0.65           // 渐变底部暗度
    };

// ==================== 海浪模式固定配置 ====================
// 作用：统一管理海浪场景中所有元素的尺寸、数量、速度
// 已移出绘制函数，大幅提升性能，画面视觉完全不变
    const OCEAN_CONFIG = {
        // 灯塔位置与大小
        lighthouse: { x: 0.28, y: 0.26, size: 13 },

        // 沙滩椅与遮阳伞样式
        chair: {
            size: 19,
            angle: 0.08,
            backTilt: -0.15,
            umbrellaTilt: -0.02,
            umbrellaRadius: 1.15
        },

        // 小船数量与大小范围
        boat: { count: 4, sizeMin: 13, sizeMax: 11 },

        // 潜艇数量、大小、移动速度
        submarine: { count: 1, size: 11, speedX: 0.22 },

        // 乌贼数量、大小、移动速度
        squid: { count: 3, size: 16, speedX: 0.25 },

        // 水下小鱼数量、大小、移动速度
        underwaterFish: { count: 4, size: 7, speedX: 0.14 },

        // 海豚数量、大小、跳跃高度、移动速度
        dolphin: { count: 2, size: 13, jumpHeight: 26, speedX: 0.5 },

        // 水母数量、大小、上浮速度
        jellyfish: { count: 2, size: 7, speedY: -0.15 },

        // 螃蟹大小、横向移动速度
        crab: { size: 7, speedX: 0.2 },

        // 沙滩装饰物（贝壳/星星等）数量与大小范围
        beachItem: { countMin: 9, countMax: 13, sizeMin: 5, sizeMax: 13 }
    };

    // ==================== 可切换的选项 ====================
    const subStyles = ['lightbar', 'horizontal', 'oceanwave'];
    const subStyleNames = {
        lightbar: '🎵 拾音灯',
        horizontal: '📊 频谱分析仪',
        oceanwave: '🌊 海浪'
    };
    let currentSubStyle = 'lightbar';

    // 颜色方案
    const colorSchemes = [
        { name: '💚 翠绿', light: '#44cc55', mid: '#339944', dark: '#226633' },
        { name: '🔵 冰蓝', light: '#4499dd', mid: '#3377bb', dark: '#225599' },
        { name: '💛 琥珀', light: '#ffb347', mid: '#dd9922', dark: '#aa7711' },
        { name: '🎛️ 橙红', light: '#ff6644', mid: '#dd4422', dark: '#aa3311' },
        { name: '🟣 紫罗兰', light: '#cc66ff', mid: '#aa44dd', dark: '#8833aa' },
        { name: '⚪ 纯白', light: '#e8f4f8', mid: '#c0d0e0', dark: '#a0b0c0' },
        { name: '🌈 彩虹', light: 'rainbow', mid: 'rainbow', dark: 'rainbow' }
    ];
    let colorIndex = 0;
    let currentColor = colorSchemes[0];

    // ==================== 状态变量 ====================
    let currentLevel = 0;
    let targetLevel = 0;
    let smoothedVolume = 0;
    let maxVolumeEver = 1;
    let volumeHistory = [];
    let silentFrames = 0;
    let ledPaths = [];
    let lastColorIndex = -1;
    let lastW = 0, lastH = 0;
    let ledLayout = null;

    let smoothedPeak = 0;
    let peakTrail = [];
    let waveOffset = 0;
    let waveSurge = 0;

    // 缓存随机数，避免每帧大量 Math.random 造成卡顿
    const randomCache = new Array(100).fill(0).map(() => Math.random());
    let randomPtr = 0;
    function fastRandom() {
        randomPtr = (randomPtr + 1) % randomCache.length;
        return randomCache[randomPtr];
    }

    function nonlinearMap(volume, maxLevel) {
        let mapped = Math.pow(volume, CONFIG.nonlinearExponent);
        return Math.floor(mapped * maxLevel);
    }

    function drawLightbar(ctx, led, x, y, w, h, color, isLit) {
        if (isLit) {
            const grad = ctx.createLinearGradient(x, y, x, y + h);
            grad.addColorStop(0, color);
            grad.addColorStop(1, `rgba(0,0,0,${CONFIG.gradientDarkness})`);
            if (CONFIG.shadowBlur > 0) {
                ctx.shadowBlur = CONFIG.shadowBlur;
                ctx.shadowColor = color;
            }
            ctx.fillStyle = grad;
            ctx.fill(led.path);
            if (CONFIG.highlightStrength > 0) {
                ctx.beginPath();
                ctx.roundRect(x + 1, y + 1, w - 2, 3, 1);
                ctx.fillStyle = `rgba(255,255,255,${CONFIG.highlightStrength})`;
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = '#050505';
            ctx.fill(led.path);
        }
    }

    function precomputeLeds(ctx, w, h, ledCount) {
        const grooveX = 6, grooveY = 4;
        const grooveW = w - 12, grooveH = h - 8;
        const ledSpacing = grooveW / ledCount;
        const ledWidth = ledSpacing - 2.5;
        const ledHeight = grooveH - 6;
        const ledY = grooveY + 3;

        ledPaths = [];
        for (let i = 0; i < ledCount; i++) {
            const ledX = grooveX + i * ledSpacing;
            const path = new Path2D();
            const r = 2;
            path.moveTo(ledX + r, ledY);
            path.lineTo(ledX + ledWidth - r, ledY);
            path.quadraticCurveTo(ledX + ledWidth, ledY, ledX + ledWidth, ledY + r);
            path.lineTo(ledX + ledWidth, ledY + ledHeight - r);
            path.quadraticCurveTo(ledX + ledWidth, ledY + ledHeight, ledX + ledWidth - r, ledY + ledHeight);
            path.lineTo(ledX + r, ledY + ledHeight);
            path.quadraticCurveTo(ledX, ledY + ledHeight, ledX, ledY + ledHeight - r);
            path.lineTo(ledX, ledY + r);
            path.quadraticCurveTo(ledX, ledY, ledX + r, ledY);
            path.closePath();

            ledPaths.push({ path, x: ledX, y: ledY, w: ledWidth, h: ledHeight });
        }
        return { grooveX, grooveY, grooveW, grooveH, ledSpacing, ledWidth, ledHeight, ledY };
    }

    function nextColor() {
        colorIndex = (colorIndex + 1) % colorSchemes.length;
        currentColor = colorSchemes[colorIndex];
        lastColorIndex = -1;
        return currentColor.name;
    }

    function getCurrentColorName() {
        return currentColor.name;
    }

    function nextSubStyle() {
        let idx = subStyles.indexOf(currentSubStyle);
        idx = (idx + 1) % subStyles.length;
        currentSubStyle = subStyles[idx];
        return subStyleNames[currentSubStyle];
    }

    function getCurrentSubStyleName() {
        return subStyleNames[currentSubStyle];
    }

    function draw(core, canvas, ctx, barWidth) {
        if (!core || !canvas || !ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const ledCount = CONFIG.ledTotal;

        if (lastW !== w || lastH !== h || !ledPaths.length) {
            ledLayout = precomputeLeds(ctx, w, h, ledCount);
            lastW = w;
            lastH = h;
        }

        let totalVolume = 0, maxVol = 0;
        const heights = core.currentHeights;
        for (let i = 0; i < heights.length; i++) {
            const v = heights[i];
            totalVolume += v;
            if (v > maxVol) maxVol = v;
        }
        let avgVolume = totalVolume / heights.length;
        const isSilent = maxVol < CONFIG.minVolumeThreshold;

        if (isSilent) {
            silentFrames++;
            if (silentFrames > 2) {
                smoothedVolume = 0;
                targetLevel = 0;
                currentLevel = 0;
                maxVolumeEver = Math.max(CONFIG.maxVolumeMin, maxVolumeEver * CONFIG.maxVolumeDecay);
            }
        } else {
            silentFrames = 0;
            volumeHistory.push(avgVolume);
            if (volumeHistory.length > CONFIG.volumeHistoryFrames) volumeHistory.shift();
            let maxInHistory = Math.max(...volumeHistory, CONFIG.maxVolumeMin);
            maxVolumeEver = maxInHistory > maxVolumeEver
                ? maxInHistory
                : Math.max(CONFIG.maxVolumeMin, maxVolumeEver * CONFIG.maxVolumeDecay);

            let normalizedVolume = Math.min(0.98, Math.max(0, avgVolume / maxVolumeEver));
            smoothedVolume = normalizedVolume > smoothedVolume
                ? normalizedVolume * CONFIG.volumeAttack + smoothedVolume * (1 - CONFIG.volumeAttack)
                : Math.max(0, smoothedVolume * CONFIG.volumeDecay);
        }

        let rawTarget = smoothedVolume > 0 ? nonlinearMap(smoothedVolume, ledCount) : 0;
        if (smoothedVolume < 0.03) rawTarget = 0;

        if (rawTarget > targetLevel) {
            targetLevel = rawTarget;
        } else {
            const threshold = Math.floor(targetLevel * (1 - CONFIG.hysteresis));
            if (rawTarget <= targetLevel - threshold - 1) targetLevel = rawTarget;
        }
        targetLevel = Math.min(ledCount, Math.max(0, targetLevel));

        currentLevel = targetLevel > currentLevel
            ? currentLevel + (targetLevel - currentLevel) * CONFIG.levelSmooth
            : currentLevel - (currentLevel - targetLevel) * CONFIG.levelSmooth;
        if (Math.abs(currentLevel - targetLevel) < 0.01) currentLevel = targetLevel;

        const drawLevel = Math.round(currentLevel);
        const targetPeak = targetLevel / ledCount;
        smoothedPeak = smoothedPeak * 0.92 + targetPeak * 0.08;
        peakTrail.unshift(smoothedPeak);
        if (peakTrail.length > 15) peakTrail.pop();
        waveOffset = (waveOffset + 1) % 360;

        // 海浪模式：更快的响应速度，让海浪跟随节奏
        if (currentSubStyle === 'oceanwave') {
            // 海浪专用：attack 快，decay 也快，制造节奏感
            const targetSurge = drawLevel / ledCount;
            if (targetSurge > waveSurge) {
                waveSurge = waveSurge * 0.7 + targetSurge * 0.3;  // 快速上涨
            } else {
                waveSurge = waveSurge * 0.85 + targetSurge * 0.15; // 快速回落
            }
        } else {
            waveSurge = waveSurge * 0.96 + (drawLevel / ledCount) * 0.04;
        }
        // ========== 模式1：经典拾音灯 ==========
        if (currentSubStyle === 'lightbar') {
            ctx.fillStyle = '#1a1c1e';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#3a3c3e';
            ctx.fillRect(0, 0, w, 1);
            ctx.fillStyle = '#2a2c2e';
            ctx.fillRect(0, 1, w, 1);
            ctx.fillStyle = '#0a0c0e';
            ctx.fillRect(0, h - 2, w, 2);
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 2, 3, h - 4);
            ctx.fillRect(w - 3, 2, 3, h - 4);

            const gx = ledLayout.grooveX, gy = ledLayout.grooveY;
            const gw = ledLayout.grooveW, gh = ledLayout.grooveH;
            ctx.fillStyle = '#080a0e';
            ctx.fillRect(gx, gy, gw, gh);
            ctx.fillStyle = '#222426';
            ctx.fillRect(gx, gy + gh - 1, gw, 1);

            for (let i = 0; i < ledCount; i++) {
                const led = ledPaths[i];
                const isLit = i < drawLevel;
                const c = currentColor.light === 'rainbow'
                    ? `hsl(${i / ledCount * 360}, 85%, 55%)`
                    : currentColor.light;
                ctx.save();
                drawLightbar(ctx, led, led.x, led.y, led.w, led.h, c, isLit);
                ctx.restore();
            }

            ctx.fillStyle = '#1a1c1e';
            const spacing = ledLayout.ledSpacing;
            for (let i = 1; i < ledCount; i++) {
                const lx = gx + i * spacing - 1.5;
                ctx.fillRect(lx, gy + 3, 1.5, ledLayout.ledHeight + 2);
            }

            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#fff';
            ctx.fillRect(gx, gy, gw, gh);
            ctx.globalAlpha = 1;

            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = '#88aacc';
            ctx.fillText('LIGHTBAR', 12, h - 6);
            ctx.fillStyle = '#668899';
            ctx.fillText('AUDIO', w - 48, h - 6);
            ctx.beginPath();
            ctx.arc(w - 8, 8, 2, 0, Math.PI * 2);
            ctx.fillStyle = (!isSilent && smoothedVolume > 0.03) ? '#44ff44' : '#224422';
            ctx.fill();
        }

        // ========== 模式2：频谱分析仪 ==========
        else if (currentSubStyle === 'horizontal') {
            const isRainbow = currentColor.name === '🌈 彩虹';
            const mainColor = isRainbow ? '#88ccff' : currentColor.light;
            const fillColor = isRainbow ? '#4499dd' : currentColor.mid;

            ctx.fillStyle = '#0a0a10';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = '#2a3a4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(4, 4, w - 8, h - 8);

            const minFreq = 20, maxFreq = 2000;
            const freqMarks = [20,50,100,200,500,1000,2000];
            ctx.strokeStyle = 'rgba(80,120,160,0.15)';
            ctx.lineWidth = 0.5;
            const logMin = Math.log10(minFreq), logRange = Math.log10(maxFreq)-logMin;
            for (let f of freqMarks) {
                const t = (Math.log10(f)-logMin)/logRange;
                const x = 8 + t*(w-16);
                ctx.beginPath();
                ctx.moveTo(x,8);
                ctx.lineTo(x,h-8);
                ctx.stroke();
            }

            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = '#7a9aba';
            ctx.fillText('0dB',10,18);
            ctx.fillText('-12dB',10,h*0.45);
            ctx.fillText('-24dB',10,h*0.72);

            ctx.font = '7px monospace';
            ctx.fillStyle = '#5a7a9a';
            const labels = ['20','50','100','200','500','1k','2k'];
            for(let i=0;i<freqMarks.length;i++){
                const t=(Math.log10(freqMarks[i])-logMin)/logRange;
                const x=8+t*(w-16)-12;
                if(x>5&&x<w-20)ctx.fillText(labels[i],x,h-8);
            }

            const dbX=w-22,dbY=10,dbH=h-20;
            const fillH=(drawLevel/ledCount)*dbH;
            ctx.fillStyle='#1a2a3a';
            ctx.fillRect(dbX,dbY,5,dbH);
            ctx.fillStyle=mainColor;
            ctx.fillRect(dbX,dbY+dbH-fillH,5,fillH);
            ctx.strokeStyle='#3a5a7a';
            ctx.lineWidth=0.5;
            ctx.strokeRect(dbX,dbY,5,dbH);
            ctx.font='bold 6px monospace';
            ctx.fillStyle='#7a9aba';
            ctx.fillText('0',dbX-8,dbY+8);
            ctx.fillText('-24',dbX-12,dbY+dbH-3);

            const points=[];
            const baseY=h*0.85;
            const maxAmp=h*0.65;
            const gx=ledLayout.grooveX,spacing=ledLayout.ledSpacing,wid=ledLayout.ledWidth;
            for(let i=0;i<ledCount;i++){
                const inten=i<drawLevel?(drawLevel-i)/drawLevel:0;
                const x=gx+i*spacing+wid/2;
                const y=baseY-inten*maxAmp;
                points.push({x,y});
            }

            ctx.beginPath();
            ctx.moveTo(points[0].x,points[0].y);
            for(let i=1;i<points.length-2;i++){
                const xc=(points[i].x+points[i+1].x)/2;
                const yc=(points[i].y+points[i+1].y)/2;
                ctx.quadraticCurveTo(points[i].x,points[i].y,xc,yc);
            }
            ctx.quadraticCurveTo(points[points.length-2].x,points[points.length-2].y,points[points.length-1].x,points[points.length-1].y);
            ctx.strokeStyle=mainColor;
            ctx.lineWidth=2.5;
            ctx.lineCap='round';
            ctx.shadowBlur=4;
            ctx.shadowColor=mainColor;
            ctx.stroke();
            ctx.lineTo(points[points.length-1].x,h-15);
            ctx.lineTo(points[0].x,h-15);
            ctx.fillStyle=`${fillColor}33`;
            ctx.fill();
            ctx.shadowBlur=0;

            for(let t=0;t<peakTrail.length;t++){
                const v=peakTrail[t];
                const y=baseY-v*maxAmp;
                const a=0.2*(1-t/peakTrail.length);
                ctx.beginPath();
                ctx.moveTo(points[0].x,y);
                ctx.lineTo(points[points.length-1].x,y);
                ctx.strokeStyle=`${mainColor}${Math.floor(a*255).toString(16).padStart(2,'0')}`;
                ctx.lineWidth=0.8;
                ctx.stroke();
            }

            const py=baseY-smoothedPeak*maxAmp;
            ctx.shadowBlur=3;
            ctx.shadowColor=mainColor;
            ctx.beginPath();
            ctx.arc(points[points.length-1].x-3,py,3,0,Math.PI*2);
            ctx.fillStyle='#fff';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(points[points.length-1].x-3,py,1.5,0,Math.PI*2);
            ctx.fillStyle=mainColor;
            ctx.fill();
            ctx.shadowBlur=0;
            const db=Math.round(-24+(1-smoothedPeak)*24);
            ctx.font='bold 7px monospace';
            ctx.fillStyle=mainColor;
            ctx.fillText(`${db}dB`,points[points.length-1].x-30,py-2);
            ctx.font='bold 6px monospace';
            ctx.fillStyle='#5a7a9a';
            ctx.fillText('20Hz',12,h-6);
            ctx.fillText('2kHz',w-38,h-6);
            ctx.beginPath();
            ctx.arc(w-10,12,2,0,Math.PI*2);
            ctx.fillStyle=(!isSilent&&smoothedVolume>0.03)?'#44ff44':'#335533';
            ctx.fill();
        }

        // ========== 模式3：海水涌上沙滩（优化版，视觉100%不变）==========
        else if (currentSubStyle === 'oceanwave') {
            const lightColor = currentColor.light;
            const isRainbow = currentColor.name === '🌈 彩虹';
            const waterColor = isRainbow ? '#44ccaa' : lightColor;
            const surgeWidth = w * waveSurge;

            // 【核心优化】装饰只初始化一次，永不重复创建 → 彻底修复内存泄漏
            if (!canvas.oceanDecorations) {
                canvas.oceanDecorations = [];
                const cfg = OCEAN_CONFIG;

                // 灯塔
                canvas.oceanDecorations.push({
                    type:'lighthouse',x:w*cfg.lighthouse.x,y:h*cfg.lighthouse.y,size:cfg.lighthouse.size
                });

                // 椅子
                for(let i=0;i<2;i++){
                    canvas.oceanDecorations.push({
                        type:'beach_chair',x:w*0.83+i*20,y:h*(0.28+i*0.26)+fastRandom()*4,size:cfg.chair.size
                    });
                }

                // 船
                for(let i=0;i<cfg.boat.count;i++){
                    canvas.oceanDecorations.push({
                        type:'boat',boatStyle:i%3,x:w*(0.05+i*0.12),y:h*(0.18+fastRandom()*0.45),
                        size:cfg.boat.sizeMin+fastRandom()*(cfg.boat.sizeMax-cfg.boat.sizeMin),
                        seed:fastRandom()*100,speedY:(fastRandom()-0.5)*0.06
                    });
                }

                // 潜艇
                for(let i=0;i<cfg.submarine.count;i++){
                    canvas.oceanDecorations.push({
                        type:'submarine',x:w*0.02+fastRandom()*w*0.1,y:h*(0.4+fastRandom()*0.15),
                        size:cfg.submarine.size,seed:fastRandom()*100,speedX:cfg.submarine.speedX,
                        speedY:(fastRandom()-0.5)*0.015
                    });
                }

                // 乌贼
                for(let i=0;i<cfg.squid.count;i++){
                    canvas.oceanDecorations.push({
                        type:'squid',x:w*(0.12+fastRandom()*0.15),y:h*(0.5+fastRandom()*0.25),
                        size:cfg.squid.size,seed:fastRandom()*100,speedX:cfg.squid.speedX+fastRandom()*0.02,
                        speedY:(fastRandom()-0.5)*0.03
                    });
                }

                // 小鱼
                for(let i=0;i<cfg.underwaterFish.count;i++){
                    canvas.oceanDecorations.push({
                        type:'underwater_fish',x:w*(0.06+fastRandom()*0.25),y:h*(0.22+fastRandom()*0.55),
                        size:cfg.underwaterFish.size*(0.8+fastRandom()*0.4),seed:fastRandom()*100,
                        speedX:cfg.underwaterFish.speedX+fastRandom()*0.05,speedY:(fastRandom()-0.5)*0.04
                    });
                }

                // 海豚
                for(let i=0;i<cfg.dolphin.count;i++){
                    canvas.oceanDecorations.push({
                        type:'dolphin',status:'swim',x:w*(0.05+fastRandom()*0.2),
                        y:h*(0.5+fastRandom()*0.15),baseY:h*(0.5+fastRandom()*0.15),
                        size:cfg.dolphin.size,speedX:cfg.dolphin.speedX+fastRandom()*0.1,
                        jumpProgress:0,jumpHeight:cfg.dolphin.jumpHeight,nextJumpTimer:60+fastRandom()*180
                    });
                }

                // 水母
                for(let i=0;i<cfg.jellyfish.count;i++){
                    canvas.oceanDecorations.push({
                        type:'jellyfish',x:w*(0.05+fastRandom()*0.25),y:h*(0.85+fastRandom()*0.1),
                        size:cfg.jellyfish.size,speedY:cfg.jellyfish.speedY-fastRandom()*0.08,
                        swingSpeed:0.02+fastRandom()*0.02,swingRange:0.3+fastRandom()*0.3,seed:fastRandom()*100
                    });
                }

                // 沙滩物品
                const itemCount=cfg.beachItem.countMin+Math.floor(fastRandom()*(cfg.beachItem.countMax-cfg.beachItem.countMin+1));
                const emojis=['🐚','🦪','🐌','⭐','🌟'];
                for(let i=0;i<itemCount;i++){
                    canvas.oceanDecorations.push({
                        type:'beach_item',emoji:emojis[Math.floor(fastRandom()*emojis.length)],
                        x:w*(0.4+fastRandom()*0.43),y:h*(0.08+fastRandom()*0.84),
                        size:cfg.beachItem.sizeMin+fastRandom()*(cfg.beachItem.sizeMax-cfg.beachItem.sizeMin),
                        rotation:fastRandom()*Math.PI*2
                    });
                }

                // 螃蟹
                canvas.oceanDecorations.push({
                    type:'crab',x:w*0.75+fastRandom()*w*0.05,y:h*(0.45+fastRandom()*0.25),
                    size:cfg.crab.size,startX:w*0.75,seed:fastRandom()*100,speedX:cfg.crab.speedX
                });
            }

            // 背景渐变
            const bgGrad=ctx.createLinearGradient(0,0,w,0);
            bgGrad.addColorStop(0,waterColor);
            bgGrad.addColorStop(0.5,'#c8b89a');
            bgGrad.addColorStop(1,'#d4c4a4');
            ctx.fillStyle=bgGrad;
            ctx.fillRect(0,0,w,h);

            // 绘制沙滩装饰
            const decors=canvas.oceanDecorations;
            for(const el of decors){
                if(el.type==='beach_item'){
                    ctx.save();ctx.translate(el.x,el.y);ctx.rotate(el.rotation);
                    ctx.font=`${el.size}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
                    ctx.globalAlpha=0.85;ctx.fillText(el.emoji,0,0);ctx.restore();
                }else if(el.type==='crab'){
                    el.seed+=0.04;el.x=el.startX+Math.sin(el.seed*0.5)*15;
                    ctx.save();ctx.translate(el.x,el.y);const cs=el.size;
                    ctx.fillStyle='rgba(235,65,40,1)';ctx.strokeStyle='rgba(235,65,40,1)';
                    ctx.lineWidth=cs*0.15;ctx.lineJoin='round';
                    const legWiggle=Math.sin(el.seed*3)*(cs*0.15);
                    ctx.beginPath();
                    ctx.moveTo(-cs*0.3,0);ctx.lineTo(-cs*0.7,-cs*0.2+legWiggle);ctx.lineTo(-cs*0.9,cs*0.2);
                    ctx.moveTo(-cs*0.1,0);ctx.lineTo(-cs*0.6,cs*legWiggle);ctx.lineTo(-cs*0.8,cs*0.4);
                    ctx.moveTo(-cs*0.2,0);ctx.lineTo(-cs*0.5,cs*0.3-legWiggle);ctx.lineTo(-cs*0.7,cs*0.6);
                    ctx.moveTo(cs*0.3,0);ctx.lineTo(cs*0.7,-cs*0.2-legWiggle);ctx.lineTo(cs*0.9,cs*0.2);
                    ctx.moveTo(cs*0.1,0);ctx.lineTo(cs*0.6,-cs*legWiggle);ctx.lineTo(cs*0.8,cs*0.4);
                    ctx.moveTo(cs*0.2,0);ctx.lineTo(cs*0.5,cs*0.3+legWiggle);ctx.lineTo(cs*0.7,cs*0.6);
                    ctx.stroke();
                    ctx.beginPath();ctx.moveTo(-cs*0.4,-cs*0.2);ctx.lineTo(-cs*0.6,-cs*0.6+legWiggle);
                    ctx.moveTo(cs*0.4,-cs*0.2);ctx.lineTo(cs*0.6,-cs*0.6-legWiggle);ctx.stroke();
                    ctx.beginPath();ctx.arc(-cs*0.6,-cs*0.6+legWiggle,cs*0.25,0,Math.PI*2);
                    ctx.arc(cs*0.6,-cs*0.6-legWiggle,cs*0.25,0,Math.PI*2);ctx.fill();
                    ctx.beginPath();ctx.ellipse(0,0,cs,cs*0.7,0,0,Math.PI*2);ctx.fill();
                    ctx.fillStyle='#000';ctx.beginPath();ctx.arc(-cs*0.25,-cs*0.6,cs*0.12,0,Math.PI*2);
                    ctx.arc(cs*0.25,-cs*0.6,cs*0.12,0,Math.PI*2);ctx.fill();ctx.restore();
                }else if(el.type==='beach_chair'){
                    ctx.save();ctx.translate(el.x,el.y);const s=el.size;const c=OCEAN_CONFIG.chair;
                    ctx.strokeStyle='#eef2f5';ctx.lineWidth=1.2;ctx.lineJoin='round';ctx.lineCap='round';
                    ctx.beginPath();ctx.moveTo(-s*0.55,s*0.45);ctx.lineTo(-s*0.12,s*0.44+c.angle*s);
                    ctx.lineTo(s*0.16,s*0.26);ctx.lineTo(s*0.46,s*0.26+Math.sin(c.backTilt)*s*0.45);ctx.stroke();
                    ctx.strokeStyle='#d1d8df';ctx.lineWidth=1;
                    ctx.beginPath();ctx.moveTo(-s*0.4,s*0.45);ctx.lineTo(-s*0.45,s*0.68);
                    ctx.moveTo(s*0.12,s*0.26);ctx.lineTo(s*0.08,s*0.68);
                    ctx.moveTo(s*0.32,s*0.15);ctx.lineTo(s*0.36,s*0.68);ctx.stroke();
                    ctx.strokeStyle='#2b7fb9';ctx.lineWidth=2;
                    ctx.beginPath();ctx.moveTo(-s*0.5,s*0.43);ctx.lineTo(-s*0.12,s*0.42+c.angle*s);
                    ctx.lineTo(s*0.15,s*0.24);ctx.lineTo(s*0.44,s*0.24+Math.sin(c.backTilt)*s*0.45);ctx.stroke();
                    ctx.save();ctx.translate(-s*0.15,-s*0.2);ctx.rotate(c.umbrellaTilt);
                    ctx.strokeStyle='#c5b598';ctx.lineWidth=1.4;ctx.beginPath();
                    ctx.moveTo(0,s*1.25);ctx.lineTo(0,-s*0.55);ctx.stroke();
                    const r=s*c.umbrellaRadius;ctx.fillStyle='#ff6b6b';
                    ctx.beginPath();ctx.moveTo(-r,-s*0.45);ctx.quadraticCurveTo(0,-s*0.82,r,-s*0.45);
                    ctx.lineTo(r,-s*0.32);ctx.quadraticCurveTo(r*0.5,-s*0.4,0,-s*0.32);
                    ctx.quadraticCurveTo(-r*0.5,-s*0.4,-r,-s*0.32);ctx.closePath();ctx.fill();
                    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-r*0.35,-s*0.44);
                    ctx.quadraticCurveTo(0,-s*0.78,r*0.35,-s*0.44);ctx.lineTo(r*0.08,-s*0.35);
                    ctx.quadraticCurveTo(0,-s*0.62,-r*0.08,-s*0.35);ctx.closePath();ctx.fill();
                    ctx.strokeStyle='rgba(0,0,0,0.08)';ctx.lineWidth=0.8;
                    ctx.beginPath();ctx.moveTo(0,-s*0.55);ctx.lineTo(-r,-s*0.45);
                    ctx.moveTo(0,-s*0.55);ctx.lineTo(r,-s*0.45);ctx.stroke();
                    ctx.restore();ctx.restore();
                }
            }

// ============================================================
// 海浪完整优化版 — 替换原有海浪代码块
// 依赖变量（需在外部定义）：
//   ctx         — CanvasRenderingContext2D
//   w, h        — 画布宽高（数字）
//   surgeWidth  — 当前海浪宽度
//   waveOffset  — 时间偏移量（每帧递增）
//   waveSurge   — 浪涌强度系数（0~1）
//   decors      — 水下生物数组（原有结构保持不变）
//   fastRandom  — 随机函数
//
// 额外新增（建议在 drawFrame 外定义一次）：
// ============================================================

            if (surgeWidth > 0) {

                // ─── 辅助：获取边缘点数组 ───────────────────────────────────
                const segments = 120;
                const edge = [];
                for (let i = 0; i <= segments; i++) {
                    const yf = i / segments;
                    const y  = yf * h;
                    // 多层叠加，边缘更柔和自然
                    const n1 = Math.sin(yf * 4.5  + waveOffset * 0.048) * 14;
                    const n2 = Math.sin(yf * 11   + waveOffset * 0.031) * 7;
                    const n3 = Math.sin(yf * 28   + waveOffset * 0.019) * 3;
                    const n4 = (fastRandom() - 0.5) * 2.5;
                    const ex = Math.max(0, surgeWidth + n1 + n2 + n3 + n4);
                    edge.push({ x: ex, y });
                }

                // ─── 1. 水体主体 ─────────────────────────────────────────────
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(surgeWidth, 0);
                for (const p of edge) ctx.lineTo(p.x, p.y);
                ctx.lineTo(0, h);
                ctx.closePath();

                // 横向主渐变（深蓝 → 浅青）
                const gH = ctx.createLinearGradient(0, 0, surgeWidth + 50, 0);
                gH.addColorStop(0,    '#063d7a');
                gH.addColorStop(0.25, '#0b5fa0');
                gH.addColorStop(0.55, '#1d9ecf');
                gH.addColorStop(0.8,  '#43c8e4');
                gH.addColorStop(1,    '#88e8ff');
                ctx.fillStyle = gH;
                ctx.fill();

                // 竖向深度光影叠加
                const gV = ctx.createLinearGradient(0, 0, 0, h);
                gV.addColorStop(0,   'rgba(255,255,255,0.06)');
                gV.addColorStop(0.4, 'rgba(0,0,0,0)');
                gV.addColorStop(1,   'rgba(0,0,80,0.18)');
                ctx.fillStyle = gV;
                ctx.fill();
                ctx.restore();

                // ─── 2. 水下丁达尔光束（光轴效果）──────────────────────────
                ctx.save();
                ctx.globalAlpha = 0.045;
                const beamCount = 5;
                for (let i = 0; i < beamCount; i++) {
                    const bx = surgeWidth * (0.1 + i * 0.17);
                    const bw = surgeWidth * 0.06 + Math.sin(waveOffset * 0.02 + i) * surgeWidth * 0.03;
                    const gB = ctx.createLinearGradient(bx, 0, bx + bw, h * 0.7);
                    gB.addColorStop(0, 'rgba(160,230,255,0.9)');
                    gB.addColorStop(1, 'rgba(160,230,255,0)');
                    ctx.fillStyle = gB;
                    ctx.fillRect(bx + Math.sin(waveOffset * 0.025 + i) * 8, 0, bw, h * 0.7);
                }
                ctx.restore();

                // ─── 3. 水面内波纹 ───────────────────────────────────────────
                ctx.save();
                ctx.globalAlpha = 0.07;
                ctx.strokeStyle = '#a0e8ff';
                ctx.lineWidth = 1.5;
                for (let layer = 0; layer < 4; layer++) {
                    const yw = h * (0.05 + layer * 0.18);
                    ctx.beginPath();
                    for (let x = 0; x < surgeWidth; x += 4) {
                        const yy = yw + Math.sin(x * 0.035 + waveOffset * 0.03 + layer * 1.1) * 5
                            + Math.sin(x * 0.09  + waveOffset * 0.02 + layer) * 2.5;
                        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
                    }
                    ctx.stroke();
                }
                ctx.restore();

                // ─── 4. 气泡 ─────────────────────────────────────────────────
                ctx.save();
                for (const el of decors) {
                    if (el.type !== 'bubble' || el.x >= surgeWidth - 5) continue;
                    el.y  += el.speedY;
                    el.x  += Math.sin(el.seed + waveOffset * 0.015) * 0.4;
                    el.seed += 0.02;
                    if (el.y < h * 0.05) {
                        el.y = h * (0.5 + fastRandom() * 0.45);
                        el.x = surgeWidth * (0.05 + fastRandom() * 0.8);
                    }
                    ctx.beginPath();
                    ctx.arc(el.x, el.y, el.r, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(200,240,255,0.06)';
                    ctx.fill();
                }
                ctx.restore();

                // ─── 5. 水母（优化：径向渐变+多触手）───────────────────────
                for (const el of decors) {
                    if (el.type !== 'jellyfish' || el.x >= surgeWidth - 10) continue;
                    el.seed += 0.022;
                    el.y    += el.speedY;
                    el.x    += Math.sin(el.seed * el.swingSpeed) * el.swingRange * 0.012;
                    if (el.y < h * 0.1) {
                        el.y = h * (0.7 + fastRandom() * 0.2);
                        el.x = (surgeWidth - 20) * (0.05 + fastRandom() * 0.85);
                    }
                    ctx.save();
                    const pulse = 1 + Math.sin(el.seed * 1.4) * 0.13;
                    ctx.translate(el.x, el.y);
                    ctx.scale(pulse, 1 / pulse);
                    const jz = el.size;

                    // 伞盖（径向渐变）
                    ctx.globalAlpha = 0.72;
                    ctx.beginPath();
                    ctx.arc(0, 0, jz, Math.PI, 0);
                    ctx.quadraticCurveTo(0, jz * 0.5, -jz, jz * 0.1);
                    const jg = ctx.createRadialGradient(0, -jz * 0.3, 0, 0, 0, jz);
                    jg.addColorStop(0, 'rgba(200,240,255,0.9)');
                    jg.addColorStop(0.6, 'rgba(140,200,255,0.55)');
                    jg.addColorStop(1, 'rgba(100,170,255,0.1)');
                    ctx.fillStyle = jg;
                    ctx.fill();

                    // 伞内弧线纹路
                    ctx.globalAlpha = 0.3;
                    ctx.strokeStyle = 'rgba(220,250,255,0.8)';
                    ctx.lineWidth = 0.8;
                    for (let r = 0; r < 3; r++) {
                        ctx.beginPath();
                        ctx.arc(0, 0, jz * (0.3 + r * 0.25), Math.PI, 0);
                        ctx.stroke();
                    }

                    // 触手
                    ctx.globalAlpha = 0.5;
                    ctx.strokeStyle = 'rgba(200,235,255,0.7)';
                    ctx.lineWidth = jz * 0.1;
                    const wig = Math.sin(el.seed * 1.8) * (jz * 0.3);
                    ctx.beginPath();
                    ctx.moveTo(-jz * 0.5,  jz * 0.05); ctx.quadraticCurveTo(-jz * 0.45 + wig, jz * 0.9, -jz * 0.3,  jz * 1.6);
                    ctx.moveTo(-jz * 0.15, jz * 0.05); ctx.quadraticCurveTo(-jz * 0.05 + wig * 0.7, jz * 0.95, 0,         jz * 1.8);
                    ctx.moveTo( jz * 0.2,  jz * 0.05); ctx.quadraticCurveTo( jz * 0.3  + wig * 0.5, jz * 0.85,  jz * 0.35, jz * 1.55);
                    ctx.moveTo( jz * 0.5,  jz * 0.05); ctx.quadraticCurveTo( jz * 0.48 + wig * 0.3, jz * 0.75,  jz * 0.3,  jz * 1.3);
                    ctx.stroke();
                    ctx.restore();
                }

                // ─── 6. 鱿鱼（优化：渐变填充）──────────────────────────────
                for (const el of decors) {
                    if (el.type !== 'squid' || el.x >= surgeWidth - 10) continue;
                    el.seed += 0.018;
                    el.x    += el.speedX; if (el.x > surgeWidth * 0.88) el.x = surgeWidth * 0.05;
                    el.y    += el.speedY; if (el.y < h * 0.25 || el.y > h * 0.88) el.speedY *= -1;
                    ctx.save();
                    ctx.globalAlpha = 0.28;
                    ctx.translate(el.x, el.y);
                    ctx.rotate(el.speedY * 1.2);
                    const s = el.size;
                    ctx.beginPath();
                    ctx.moveTo(-s * 0.55, 0);
                    ctx.quadraticCurveTo(0, -s * 0.55, s * 0.65, 0);
                    ctx.quadraticCurveTo(0, s * 0.55, -s * 0.55, 0);
                    ctx.fillStyle = 'rgba(180,230,255,0.85)';
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(200,240,255,0.7)';
                    ctx.lineWidth = 1;
                    const wav = Math.sin(el.seed * 2) * 3;
                    const arms = [
                        [-0.42, -0.12, -1,    -0.35 + wav, -1.45, -0.15],
                        [-0.42,  0,    -1.05,  wav,          -1.5,   0.05],
                        [-0.42,  0.12, -1,     0.35 - wav,  -1.45,  0.2 ],
                    ];
                    for (const a of arms) {
                        ctx.beginPath();
                        ctx.moveTo(a[0]*s, a[1]*s);
                        ctx.quadraticCurveTo(a[2]*s, a[3]*s, a[4]*s, a[5]*s);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                // ─── 7. 水下鱼 ───────────────────────────────────────────────
                for (const el of decors) {
                    if (el.type !== 'underwater_fish' || el.x >= surgeWidth - 10) continue;
                    el.seed += 0.025;
                    el.x    += el.speedX; if (el.x > surgeWidth * 0.9) el.x = surgeWidth * 0.02;
                    el.y    += el.speedY; if (el.y < h * 0.12 || el.y > h * 0.88) el.speedY *= -1;
                    ctx.save();
                    ctx.globalAlpha = 0.2;
                    ctx.fillStyle = '#d0f0ff';
                    ctx.translate(el.x, el.y + Math.sin(el.seed) * 0.8);
                    const s = el.size;
                    ctx.beginPath();
                    ctx.moveTo(-s, 0);
                    ctx.quadraticCurveTo(0, -s * 0.3, s, 0);
                    ctx.quadraticCurveTo(0, s * 0.3, -s, 0);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(s, 0); ctx.lineTo(s*1.28, -s*0.2); ctx.lineTo(s*1.28, s*0.2); ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }

                // ─── 8. 潜水艇（保留原有逻辑，提升外观）────────────────────
                for (const el of decors) {
                    if (el.type !== 'submarine' || el.x >= surgeWidth - 8) continue;
                    el.seed += 0.012;
                    el.x    += el.speedX; if (el.x > surgeWidth * 0.82) el.x = surgeWidth * 0.02;
                    el.y    += el.speedY; if (el.y < h * 0.22 || el.y > h * 0.78) el.speedY *= -1;
                    ctx.save();
                    ctx.globalAlpha = 0.52;
                    ctx.translate(el.x, el.y + Math.sin(el.seed) * 0.7);
                    const s = el.size;
                    // 躯体
                    ctx.beginPath();
                    ctx.moveTo(-s*1.1, 0);
                    ctx.quadraticCurveTo(-s*0.6, -s*0.4, s*0.6, -s*0.32);
                    ctx.lineTo(s*1.1, -s*0.06);
                    ctx.quadraticCurveTo(s*1.22, 0, s*1.1, s*0.06);
                    ctx.lineTo(s*0.6, s*0.32);
                    ctx.quadraticCurveTo(-s*0.6, s*0.4, -s*1.1, 0);
                    const sg = ctx.createLinearGradient(-s, -s*0.4, s, s*0.4);
                    sg.addColorStop(0, '#1c3a52'); sg.addColorStop(0.5, '#2c5370'); sg.addColorStop(1, '#1c3a52');
                    ctx.fillStyle = sg;
                    ctx.strokeStyle = '#0d1f2e'; ctx.lineWidth = 0.8;
                    ctx.fill(); ctx.stroke();
                    // 指挥台
                    ctx.fillStyle = '#243f58'; ctx.strokeStyle = '#0d1f2e';
                    ctx.fillRect(s*0.08, -s*0.7, s*0.36, s*0.4);
                    ctx.strokeRect(s*0.08, -s*0.7, s*0.36, s*0.4);
                    // 天线
                    ctx.beginPath();
                    ctx.moveTo(s*0.22, -s*0.7); ctx.lineTo(s*0.22, -s*0.92); ctx.lineTo(s*0.3, -s*0.92);
                    ctx.strokeStyle = '#1d3346'; ctx.lineWidth = 1;
                    ctx.stroke();
                    // 螺旋桨（简化）
                    ctx.fillStyle = '#c8a855';
                    ctx.fillRect(-s*1.28, -s*0.17, s*0.09, s*0.34);
                    // 舷窗
                    ctx.fillStyle = '#4ecdc4'; ctx.beginPath();
                    ctx.arc(s*0.1, 0, s*0.09, 0, Math.PI*2); ctx.fill();
                    ctx.restore();
                }

                // ─── 9. 海豚（优化：渐变 + 飞跃入水溅射）───────────────────
                for (const el of decors) {
                    if (el.type !== 'dolphin') continue;
                    const ds = el.size;
                    ctx.save();
                    if (el.status === 'swim') {
                        el.x += el.speedX * 0.45;
                        if (el.x > surgeWidth * 0.78) el.x = -ds * 2.5;
                        el.nextJumpTimer--;
                        if (el.nextJumpTimer <= 0 && el.x > surgeWidth * 0.12 && el.x < surgeWidth * 0.65) {
                            el.status = 'jump'; el.jumpProgress = 0;
                        }
                        ctx.globalAlpha = 0.18;
                        ctx.translate(el.x, el.baseY + Math.sin(el.seed + waveOffset * 0.022) * 1.8);
                        ctx.rotate(0.04);
                    } else {
                        el.jumpProgress += 0.04;
                        el.x += el.speedX * 1.7;
                        const cy = el.baseY - Math.sin(el.jumpProgress) * el.jumpHeight;
                        const ang = -Math.cos(el.jumpProgress) * 0.55;
                        ctx.globalAlpha = 0.95;
                        ctx.translate(el.x, cy); ctx.rotate(ang);
                        if (el.jumpProgress >= Math.PI) {
                            el.status = 'swim';
                            el.nextJumpTimer = 160 + fastRandom() * 200;
                            // 入水溅射（如果有 sprays 数组）
                            if (typeof sprays !== 'undefined') {
                                for (let si = 0; si < 8; si++) {
                                    const ang2 = -Math.PI * 0.5 + (fastRandom() - 0.5) * Math.PI * 0.8;
                                    const spd  = 0.8 + fastRandom() * 2.2;
                                    sprays.push({ x: el.x, y: el.baseY, vx: Math.cos(ang2)*spd, vy: Math.sin(ang2)*spd*0.7, life: 1, r: 0.6+fastRandom()*1.8 });
                                }
                            }
                        }
                    }
                    el.seed += 0.012;
                    // 躯干
                    ctx.beginPath();
                    ctx.moveTo(-ds, 0);
                    ctx.quadraticCurveTo(-ds*0.5, -ds*0.42, ds*0.2, -ds*0.38);
                    ctx.lineTo(ds*0.9, -ds*0.1); ctx.lineTo(ds*1.28, 0); ctx.lineTo(ds*0.9, ds*0.12);
                    ctx.quadraticCurveTo(0, ds*0.42, -ds*0.8, ds*0.14); ctx.closePath();
                    const dg = ctx.createLinearGradient(-ds, 0, ds, 0);
                    dg.addColorStop(0, '#c0dff0'); dg.addColorStop(0.5, '#edf7ff'); dg.addColorStop(1, '#c0dff0');
                    ctx.fillStyle = dg; ctx.fill();
                    // 背鳍
                    ctx.beginPath();
                    ctx.moveTo(-ds*0.1, -ds*0.36);
                    ctx.quadraticCurveTo(ds*0.08, -ds*0.88, ds*0.18, -ds*0.75);
                    ctx.quadraticCurveTo(ds*0.2, -ds*0.42, ds*0.32, -ds*0.33); ctx.closePath();
                    ctx.fillStyle = '#a8cce0'; ctx.fill();
                    // 尾鳍
                    ctx.beginPath();
                    ctx.moveTo(-ds*0.9, 0);
                    ctx.quadraticCurveTo(-ds*1.2, -ds*0.48, -ds*1.42, -ds*0.52);
                    ctx.lineTo(-ds*1.26, 0); ctx.lineTo(-ds*1.42, ds*0.52);
                    ctx.quadraticCurveTo(-ds*1.2, ds*0.48, -ds*0.9, 0); ctx.closePath();
                    ctx.fillStyle = '#98bcd5'; ctx.fill();
                    // 眼睛
                    ctx.beginPath(); ctx.arc(ds*0.55, -ds*0.12, ds*0.08, 0, Math.PI*2);
                    ctx.fillStyle = '#1a3a55'; ctx.fill();
                    ctx.restore();
                }

                // ─── 10. 飞沫粒子更新（需外部 sprays 数组）─────────────────
                if (typeof sprays !== 'undefined') {
                    ctx.save();
                    for (let i = sprays.length - 1; i >= 0; i--) {
                        const s = sprays[i];
                        s.x += s.vx; s.y += s.vy; s.vy += 0.06; s.life -= 0.025;
                        if (s.life <= 0) { sprays.splice(i, 1); continue; }
                        ctx.globalAlpha = s.life * 0.8;
                        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
                    }
                    ctx.restore();
                }

                // ─── 11. 泡沫线（三层，柔和叠加）───────────────────────────
                ctx.save();
                // 宽虚光层
                ctx.beginPath();
                for (const p of edge) ctx.lineTo(p.x + Math.sin(p.y * 0.04 + waveOffset * 0.03) * 4 + 2, p.y);
                ctx.strokeStyle = 'rgba(255,255,255,0.12)';
                ctx.lineWidth = 9; ctx.stroke();
                // 主泡沫线
                ctx.beginPath();
                for (const p of edge) ctx.lineTo(p.x + Math.sin(p.y * 0.06 + waveOffset * 0.04) * 2.5 - 1, p.y);
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.stroke();
                ctx.restore();

                // ─── 12. 浪尖亮白线（带柔和发光）───────────────────────────
                ctx.save();
                for (let pass = 0; pass < 3; pass++) {
                    ctx.beginPath();
                    for (const p of edge) {
                        const off = Math.sin(p.y * 0.045 + waveOffset * 0.05) * 11;
                        ctx.lineTo(surgeWidth + off, p.y);
                    }
                    ctx.strokeStyle = ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.22)', 'rgba(200,240,255,0.08)'][pass];
                    ctx.lineWidth   = [2.5, 6, 14][pass];
                    ctx.stroke();
                }
                ctx.restore();

                // ─── 13. 边缘飞沫散点 ────────────────────────────────────────
                ctx.save();
                const splatCount = Math.floor(6 * waveSurge + 4);
                for (let i = 0; i < splatCount; i++) {
                    const p = edge[Math.floor(fastRandom() * edge.length)];
                    if (!p) continue;
                    ctx.globalAlpha = fastRandom() * 0.7 + 0.1;
                    ctx.beginPath();
                    ctx.arc(p.x + fastRandom() * 22 - 4, p.y + (fastRandom() - 0.5) * 14, fastRandom() * 2.2 + 0.4, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff'; ctx.fill();
                }
                ctx.restore();

            } // end if (surgeWidth > 0)
            // 顶层灯塔、船
            for(const el of decors){
                if(el.type==='lighthouse'){
                    ctx.save();ctx.translate(el.x,el.y);const s=el.size;
                    ctx.fillStyle='#3a4245';ctx.fillRect(-s*0.4,0,s*0.8,2.5);
                    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-s*0.16,0);ctx.lineTo(-s*0.1,-s);ctx.lineTo(s*0.1,-s);ctx.lineTo(s*0.16,0);ctx.closePath();ctx.fill();
                    ctx.fillStyle='#e74c3c';ctx.fillRect(-s*0.13,-s*0.55,s*0.26,s*0.25);
                    ctx.beginPath();ctx.moveTo(-s*0.1,-s);ctx.lineTo(s*0.1,-s);ctx.lineTo(0,-s*1.25);ctx.closePath();ctx.fill();ctx.restore();
                }else if(el.type==='boat'&&el.x<surgeWidth-10){
                    el.seed+=0.015;el.y+=el.speedY;
                    if(el.y<h*0.15||el.y>h*0.8)el.speedY*=-1;
                    ctx.save();ctx.translate(el.x+Math.sin(el.seed)*1.5+waveSurge*10,el.y);ctx.rotate(Math.sin(el.seed)*0.04);const s=el.size;
                    if(el.boatStyle===0){
                        ctx.fillStyle='rgba(30,75,120,0.8)';ctx.beginPath();ctx.moveTo(-s*0.7,0);ctx.lineTo(s*0.7,0);ctx.lineTo(s*0.45,s*0.28);ctx.lineTo(-s*0.45,s*0.28);ctx.closePath();ctx.fill();
                        ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.moveTo(-s*0.06,0);ctx.lineTo(-s*0.06,-s*0.95);ctx.lineTo(s*0.38,-s*0.12);ctx.closePath();ctx.fill();
                    }else if(el.boatStyle===1){
                        ctx.fillStyle='rgba(165,90,40,0.85)';ctx.beginPath();ctx.moveTo(-s*0.75,-s*0.02);ctx.quadraticCurveTo(0,s*0.32,s*0.75,-s*0.02);ctx.quadraticCurveTo(0,s*0.04,-s*0.75,-s*0.02);ctx.closePath();ctx.fill();
                        ctx.strokeStyle='rgba(230,230,230,0.6)';ctx.lineWidth=0.4;ctx.beginPath();ctx.moveTo(-s*0.35,-s*0.05);ctx.lineTo(s*0.35,s*0.18);ctx.stroke();
                    }else{
                        ctx.fillStyle='rgba(45,55,68,0.85)';ctx.fillRect(-s*0.55,0,s*1.1,s*0.24);
                        ctx.fillStyle='rgba(245,245,245,0.95)';ctx.beginPath();ctx.moveTo(-s*0.2,0);ctx.lineTo(-s*0.2,-s*0.85);ctx.lineTo(s*0.08,-s*0.2);ctx.closePath();ctx.fill();
                        ctx.beginPath();ctx.moveTo(s*0.08,0);ctx.lineTo(s*0.08,-s*0.65);ctx.lineTo(s*0.32,-s*0.15);ctx.closePath();ctx.fill();
                    }
                    ctx.restore();
                }
            }

            // UI
            ctx.fillStyle=`rgba(180,220,255,0.35)`;
            for(let i=0;i<10;i++){
                ctx.beginPath();ctx.arc((waveOffset*0.5+i*50)%w,(h-15)-Math.sin(waveOffset*0.04+i)*8,1.5+(i%2),0,Math.PI*2);ctx.fill();
            }
            ctx.strokeStyle='#5a8aaa';ctx.lineWidth=1.2;ctx.strokeRect(4,4,w-8,h-8);
            ctx.font='bold 7px monospace';ctx.fillStyle='rgba(200,220,240,0.4)';ctx.fillText('🌊 海水涌上沙滩 →',12,h-5);
            ctx.fillStyle='rgba(150,200,220,0.35)';ctx.fillText('AUDIO',w-38,h-5);
            ctx.beginPath();ctx.arc(w-8,8,1.8,0,Math.PI*2);ctx.fillStyle=(!isSilent&&smoothedVolume>0.03)?'#44ffaa':'#226644';ctx.fill();
        }
    }

    window.SpectrumLightbar = {
        displayName: '🎹 拾音灯',
        draw: draw,
        nextColor: nextColor,
        getCurrentColorName: getCurrentColorName,
        nextSubStyle: nextSubStyle,
        getCurrentSubStyleName: getCurrentSubStyleName
    };

    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.moveTo(x + r, y);
            this.lineTo(x + w - r, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r);
            this.lineTo(x + w, y + h - r);
            this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            this.lineTo(x + r, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r);
            this.lineTo(x, y + r);
            this.quadraticCurveTo(x, y, x + r, y);
            return this;
        };
    }
})();