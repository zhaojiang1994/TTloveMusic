EffectRegister('solarSystem', function(w, h, ctx, cv, act) {

        var t = 0;
        var frameCount = 0;
        var fps = 60;

        // ================== 1. 摄像机物理系统 ==================
        // 摄像机始终在运动，通过改变变化率来改变运动趋势
        var cam = {
            // 当前位置
            phi: 1.2,           // 水平角
            theta: 0.6,         // 仰角
            radius: 680,        // 视距
            x: 0, y: 0, z: 0,   // 焦点偏移（特写时跟随行星）

            // 运动变化率（每帧增加的量，决定运动趋势）
            phiDelta: 0.0012,    // 水平转速（正=顺时针，负=逆时针）
            thetaDelta: 0.0003,  // 仰角转速（正=向上仰，负=向下俯）
            radiusDelta: -0.2,   // 视距变化率（正=拉远，负=拉近）

            // 焦点偏移平滑跟随
            tx: 0, ty: 0, tz: 0,

            // 导演调度器
            viewChangeTimer: 0,
            viewChangeInterval: 15,  // 秒

            // 特写模式
            isCloseup: false,
            closeupTargetPlanet: null,
            closeupProgress: 0,
            closeupDuration: 15,

            // 基础变化率限制（速度大小不变，只改变方向）
            basePhiSpeed: 0.0012,
            baseThetaSpeed: 0.0003
        };

        // ================== 2. 星团背景 ==================
        var bgRotAngle = 0;
        var starLayers = [];
        var starCounts = [540, 270, 135];
        var starRadius = [1800, 2400, 3200];
        for (var layer = 0; layer < 3; layer++) {
            var layerStars = [];
            for (var i = 0; i < starCounts[layer]; i++) {
                var theta_s = Math.acos(2 * Math.random() - 1);
                var phi_s = 2 * Math.PI * Math.random();
                var r_s = starRadius[layer] * (0.7 + Math.random() * 0.6);
                var starType = Math.random() < 0.3 ? 'glow' : 'point';
                var colorRand = Math.random();
                var starColor;
                if (colorRand < 0.15) starColor = '#ffcc99';
                else if (colorRand < 0.3) starColor = '#ffaa88';
                else if (colorRand < 0.5) starColor = '#88ccff';
                else if (colorRand < 0.65) starColor = '#ddbbff';
                else if (colorRand < 0.8) starColor = '#aaffcc';
                else starColor = '#ffffff';

                layerStars.push({
                    x: r_s * Math.sin(theta_s) * Math.cos(phi_s),
                    y: r_s * Math.sin(theta_s) * Math.sin(phi_s),
                    z: r_s * Math.cos(theta_s),
                    baseSize: [0.3 + Math.random() * 0.8, 0.5 + Math.random() * 1.2, 0.8 + Math.random() * 2.0][layer],
                    phase: Math.random() * Math.PI * 2,
                    spd: 0.2 + Math.random() * 1.2,
                    alpha: 0.15 + Math.random() * 0.7,
                    color: starColor,
                    type: starType,
                    glowIntensity: starType === 'glow' ? (0.3 + Math.random() * 0.6) : 0
                });
            }
            starLayers.push(layerStars);
        }


        // ========== 3D流星/彗星配置 ==========



        // ========== 十字星渲染配置（必须在生成 crossStars 之前定义）==========
        // 修改这里的参数可以调整十字星的外观和分布
        var crossConfig = {
            // -------------------- 数量与分布 --------------------
            totalCount: 80,        // 十字星总数量（范围：80-200，越多星星越密集）
            nearDist: 1100,         // 近处十字星的最大距离（世界坐标，越小越近）
            farDist: 4000,          // 远处十字星的最小距离（世界坐标，越大越远）
            nearRatio: 0.25,        // 近处十字星占比 35%（剩余为中等和远处）
            midRatio: 0.40,         // 中等距离占比 40%（自动分配，剩余为远处）

            // -------------------- 形状比例 --------------------
            lengthFactor: 2.2,      // 十字星臂长度系数（2.2 = 长度是宽度的 2.2 倍）
            widthFactor: 0.6,       // 十字星臂宽度系数（0.6 = 实际宽度 = baseSize * 0.6）
            // 最终长宽比 = lengthFactor : widthFactor = 2.2 : 0.6 ≈ 3.7 : 1

            // -------------------- 近处十字星（距离近，形状清晰）--------------------
            near: {
                baseSize: 3.4,      // 基础大小（像素），近处星星更大
                lengthMult: 1.25,    // 长度倍数（相对于基础长度，1.0 = 标准）
                widthMult: 0.50,     // 宽度倍数（相对于基础宽度，1.0 = 标准）
                glowIntensity: 0.15,// 光晕强度（0.25 = 较弱，近处光晕不能遮盖十字形状）
                alpha: 0.8,         // 透明度（0.9 = 几乎不透明，清晰可见）
                shapeSharp: true    // 形状是否清晰锐利（true = 边缘清晰）
            },

            // -------------------- 中等距离十字星（距离适中，有一定光晕）--------------------
            mid: {
                baseSize: 2.5,      // 基础大小（像素），中等大小
                lengthMult: 1.35,    // 长度倍数（0.9 = 比近处略短）
                widthMult: 0.7,     // 宽度倍数（0.9 = 比近处略细）
                glowIntensity: 0.45,// 光晕强度（0.45 = 中等光晕）
                alpha: 0.8,         // 透明度（0.8 = 半透明）
                shapeSharp: true    // 形状清晰
            },

            // -------------------- 远处十字星（距离远，光晕强，形状模糊）--------------------
            far: {
                baseSize: 1.9,      // 基础大小（像素），远处星星更小
                lengthMult: 1.35,    // 长度倍数（0.7 = 更短）
                widthMult: 0.7,     // 宽度倍数（0.7 = 更细）
                glowIntensity: 0.75,// 光晕强度（0.65 = 较强，远处光晕可以盖过形状）
                alpha: 0.7,         // 透明度（0.7 = 更淡）
                shapeSharp: false   // 形状模糊（远处不需要太锐利）
            },

            // -------------------- 颜色池 --------------------
            // 十字星颜色随机从这个数组中选择，颜色越丰富视觉越好
            colors: [
                '#ffd700',  // 金黄色（最亮眼）
                '#ffaa44',  // 橙金色
                '#88ccff',  // 天蓝色
                '#ffffff',  // 纯白色
                '#ffcc88',  // 淡橙色
                '#aaccff',  // 淡蓝色
                '#ffb366',  // 琥珀色
                '#e0e0ff'   // 淡紫色
            ]
        };

        // 远景星系
        // ========== 生成十字星数据（在初始化时执行一次）==========
        var crossStars = [];

        // 根据配置生成不同距离的十字星
        var nearCount = Math.floor(crossConfig.totalCount * crossConfig.nearRatio);
        var midCount = Math.floor(crossConfig.totalCount * crossConfig.midRatio);
        var farCount = crossConfig.totalCount - nearCount - midCount;

        // 近处十字星
        for (var i = 0; i < nearCount; i++) {
            var theta = Math.acos(2 * Math.random() - 1);
            var phi = 2 * Math.PI * Math.random();
            var r = 800 + Math.random() * (crossConfig.nearDist - 800);
            crossStars.push({
                type: 'near',
                x: r * Math.sin(theta) * Math.cos(phi),
                y: r * Math.sin(theta) * Math.sin(phi),
                z: r * Math.cos(theta),
                color: crossConfig.colors[Math.floor(Math.random() * crossConfig.colors.length)],
                alpha: 0.6 + Math.random() * 0.3,
                twinkleSpeed: 0.1 + Math.random() * 0.3,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }

        // 中等距离十字星
        for (var i = 0; i < midCount; i++) {
            var theta = Math.acos(2 * Math.random() - 1);
            var phi = 2 * Math.PI * Math.random();
            var r = crossConfig.nearDist + Math.random() * (crossConfig.farDist - crossConfig.nearDist);
            crossStars.push({
                type: 'mid',
                x: r * Math.sin(theta) * Math.cos(phi),
                y: r * Math.sin(theta) * Math.sin(phi),
                z: r * Math.cos(theta),
                color: crossConfig.colors[Math.floor(Math.random() * crossConfig.colors.length)],
                alpha: 0.5 + Math.random() * 0.3,
                twinkleSpeed: 0.08 + Math.random() * 0.25,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }

        // 远处十字星
        for (var i = 0; i < farCount; i++) {
            var theta = Math.acos(2 * Math.random() - 1);
            var phi = 2 * Math.PI * Math.random();
            var r = crossConfig.farDist + Math.random() * 2500;
            crossStars.push({
                type: 'far',
                x: r * Math.sin(theta) * Math.cos(phi),
                y: r * Math.sin(theta) * Math.sin(phi),
                z: r * Math.cos(theta),
                color: crossConfig.colors[Math.floor(Math.random() * crossConfig.colors.length)],
                alpha: 0.4 + Math.random() * 0.3,
                twinkleSpeed: 0.05 + Math.random() * 0.2,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }

        var nebulae = [];
        var nebulaCount = 10;
        var nebulaColors = ['rgba(40,20,80,', 'rgba(20,50,80,', 'rgba(60,20,40,', 'rgba(20,60,50,',
            'rgba(50,30,20,', 'rgba(30,60,90,', 'rgba(70,20,90,', 'rgba(80,40,20,',
            'rgba(20,40,70,', 'rgba(90,30,50,', 'rgba(30,80,60,', 'rgba(50,50,100,'];
        for (var i = 0; i < nebulaCount; i++) {
            var theta_n = Math.acos(2 * Math.random() - 1);
            var phi_n = 2 * Math.PI * Math.random();
            var r_n = 2200 + Math.random() * 800;
            nebulae.push({
                x: r_n * Math.sin(theta_n) * Math.cos(phi_n),
                y: r_n * Math.sin(theta_n) * Math.sin(phi_n),
                z: r_n * Math.cos(theta_n),
                rx: 180 + Math.random() * 400,
                ry: 120 + Math.random() * 250,
                color: nebulaColors[i % nebulaColors.length],
                alpha: 0.06 + Math.random() * 0.07
            });
        }

        // ================== 3. 行星数据 ==================
        var planets = [
            { nameZH: '水星', a: 140, b: 80,  sp: 0.048,  sz: 4.5, ang: 1.2, baseColor: '#d4c4b0', highlightColor: '#f0e4d0', orbitColor: '200,192,184', orbitArc: 210, atmos: null, specular: 0.35 },
            { nameZH: '金星', a: 210, b: 125, sp: 0.034,  sz: 6.8, ang: 2.8, baseColor: '#f0d878', highlightColor: '#ffe8a0', orbitColor: '240,208,128', orbitArc: 225, atmos: 'rgba(255,220,150,0.3)', specular: 0.55 },
            { nameZH: '地球', a: 285, b: 170, sp: 0.028,  sz: 7.2, ang: 0.5, baseColor: '#3a8ec8', highlightColor: '#6ac8e8', orbitColor: '90,154,213', orbitArc: 240, atmos: 'rgba(80,160,240,0.25)', specular: 0.65 },
            { nameZH: '火星', a: 370, b: 220, sp: 0.032,  sz: 5.5, ang: 4.1, baseColor: '#d06040', highlightColor: '#f08860', orbitColor: '216,112,80',  orbitArc: 255, atmos: 'rgba(200,100,60,0.2)', specular: 0.45 },
            { nameZH: '木星', a: 520, b: 310, sp: 0.016,  sz: 24,  ang: 1.8, baseColor: '#e0c8a0', highlightColor: '#f8e8c0', orbitColor: '184,92,56',   orbitArc: 90, atmos: null, specular: 0.4, banded: true },
            { nameZH: '土星', a: 710, b: 420, sp: 0.0046, sz: 20,  ang: 3.4, baseColor: '#f0e0b8', highlightColor: '#fff0d0', orbitColor: '200,168,124', orbitArc: 135, atmos: null, specular: 0.45 },
            { nameZH: '天王星', a: 920, b: 550, sp: 0.012,  sz: 14,  ang: 0.9, baseColor: '#b0e0e8', highlightColor: '#d0f8f8', orbitColor: '77,182,172',  orbitArc: 180, atmos: 'rgba(140,210,230,0.25)', specular: 0.55 },
            { nameZH: '海王星', a: 1150, b: 680, sp: 0.0052, sz: 13,  ang: 5.5, baseColor: '#4878d8', highlightColor: '#7898f0', orbitColor: '44,62,140',   orbitArc: 225, atmos: 'rgba(80,120,210,0.3)', specular: 0.6 }
        ];

        function degToRad(deg) { return deg * Math.PI / 180; }

        var asteroids = [];
        for (var i = 0; i < 360; i++) {
            var a = 480 + Math.random() * 80;
            asteroids.push({
                a: a, b: a * 0.6 + (Math.random() - 0.5) * 25,
                ang: Math.random() * Math.PI * 2,
                spd: 0.005 + Math.random() * 0.004,
                sz: 0.5 + Math.random() * 1.8,
                alpha: 0.25 + Math.random() * 0.5
            });
        }

        // ================== 4. 核心 3D 矩阵投影 ==================
        function worldToScreen(x, y, z) {
            var cosPhi = Math.cos(cam.phi), sinPhi = Math.sin(cam.phi);
            var cosTheta = Math.cos(cam.theta), sinTheta = Math.sin(cam.theta);

            // 摄像机位置
            var cx = cam.x + cam.radius * cosTheta * cosPhi;
            var cy = cam.y + cam.radius * cosTheta * sinPhi;
            var cz = cam.z + cam.radius * sinTheta;

            // 从摄像机到点的向量
            var dx = x - cx, dy = y - cy, dz = z - cz;
            var dist = Math.hypot(dx, dy, dz);
            if (dist < 0.1) return { x: w/2, y: h/2, dist: 0.1 };

            // 视线方向（从摄像机指向目标点）
            var lx = cam.x - cx, ly = cam.y - cy, lz = cam.z - cz;
            var len = Math.hypot(lx, ly, lz);
            if (len < 0.1) len = 0.1;
            lx /= len; ly /= len; lz /= len;

            // 右向量（视线与上向量(0,0,1)的叉积）
            var rx = ly * 1 - lz * 0;  // upY*lz - upZ*ly
            var ry = lz * 0 - lx * 1;  // upZ*lx - upX*lz
            var rz = lx * 0 - ly * 0;  // upX*ly - upY*lx
            var rLen = Math.hypot(rx, ry, rz);
            if (rLen < 0.1) rLen = 0.1;
            rx /= rLen; ry /= rLen; rz /= rLen;

            // 上向量（视线与右向量的叉积）
            var ux = ly * rz - lz * ry;
            var uy = lz * rx - lx * rz;
            var uz = lx * ry - ly * rx;

            // 投影缩放
            var scale = 350 / dist;

            var screenX = (dx * rx + dy * ry + dz * rz) * scale;
            var screenY = (dx * ux + dy * uy + dz * uz) * scale;

            return { x: screenX + w/2, y: screenY + h/2, dist: dist };
        }

        function getPlanetWorld(p) { return { x: Math.cos(p.ang) * p.a, y: Math.sin(p.ang) * p.b, z: 0 }; }

        // ================== 5. 绘图函数 ==================
        function drawOrbit(p) {
            var planetAngle = p.ang;
            var arcRad = degToRad(p.orbitArc);
            var startAng = planetAngle - arcRad;
            var endAng = planetAngle;
            var segments = Math.max(40, Math.floor(p.orbitArc / 4));
            var baseLineWidth = 1.6;

            // 预提取颜色 RGB 数组，避免每帧字符串拼接
            var orbitRgb = p.orbitColor;

            for (var seg = 0; seg < segments; seg++) {
                var t1 = seg / segments;
                var t2 = (seg + 1) / segments;
                var a1 = startAng + (endAng - startAng) * t1;
                var a2 = startAng + (endAng - startAng) * t2;

                var x1 = Math.cos(a1) * p.a, y1 = Math.sin(a1) * p.b;
                var x2 = Math.cos(a2) * p.a, y2 = Math.sin(a2) * p.b;

                var sc1 = worldToScreen(x1, y1, 0);
                var sc2 = worldToScreen(x2, y2, 0);

                var distToCam = (sc1.dist + sc2.dist) * 0.5;  // 避免除2，用乘法

                // 线宽：近粗远细（范围 0.3~4.0）
                var lineW = Math.min(4.0, Math.max(0.3, 350 / distToCam)) * baseLineWidth;

                // 透明度：尾部淡出 + 距离衰减
                var tailFade = t1;  // 从行星头部（t1=1）到尾部（t1=0）渐隐
                var alpha = Math.min(0.5, 200 / distToCam) * tailFade;
                if (alpha < 0.01) continue;  // 太淡就不画了

                ctx.beginPath();
                ctx.moveTo(sc1.x, sc1.y);
                ctx.lineTo(sc2.x, sc2.y);
                ctx.strokeStyle = 'rgba(' + orbitRgb + ',' + alpha.toFixed(3) + ')';
                ctx.lineWidth = lineW;
                ctx.stroke();
            }
        }

        function drawPlanet(p, wx, wy, wz) {
            var sc = worldToScreen(wx, wy, wz);
            var px = sc.x, py = sc.y, distToCam = sc.dist;

            var sz = p.sz * Math.min(1.4, 580 / distToCam);
            if (sz < 0.4) return;

            var farEffect = Math.min(0.85, Math.max(0, (distToCam - 450) / 650));
            var alpha = 1.0 - farEffect * 0.3;

            if (p.atmos && sz > 2) {
                var atmosSize = sz * 1.2;
                var atmosGrad = ctx.createRadialGradient(px, py, sz * 0.5, px, py, atmosSize);
                atmosGrad.addColorStop(0, p.atmos);
                atmosGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = atmosGrad;
                ctx.beginPath();
                ctx.arc(px, py, atmosSize, 0, Math.PI * 2);
                ctx.fill();
            }

            if (farEffect > 0.05) {
                var glowSize = sz * (1.2 + farEffect * 1.4);
                var glowGrad = ctx.createRadialGradient(px, py, sz * 0.2, px, py, glowSize);
                glowGrad.addColorStop(0, p.highlightColor + '40');
                glowGrad.addColorStop(0.6, p.baseColor + '15');
                glowGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = glowGrad;
                ctx.beginPath();
                ctx.arc(px, py, glowSize, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = alpha;

            // ========== 地球 ==========
            if (p.nameZH === '地球' && sz > 5) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.clip();

                // 海洋基础色
                var earthBase = ctx.createLinearGradient(px - sz * 0.5, py - sz * 0.3, px + sz * 0.6, py + sz * 0.5);
                earthBase.addColorStop(0, '#2a6ab5');
                earthBase.addColorStop(0.3, '#1e5aa8');
                earthBase.addColorStop(0.6, '#164a90');
                earthBase.addColorStop(1, '#0e3a78');
                ctx.fillStyle = earthBase;
                ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);

                // 大陆块
                ctx.fillStyle = '#8cb56c';
                // 非洲-欧亚大陆
                ctx.beginPath();
                ctx.moveTo(px + sz * 0.15, py - sz * 0.35);
                ctx.quadraticCurveTo(px + sz * 0.32, py - sz * 0.42, px + sz * 0.42, py - sz * 0.28);
                ctx.quadraticCurveTo(px + sz * 0.48, py - sz * 0.15, px + sz * 0.44, py - sz * 0.02);
                ctx.quadraticCurveTo(px + sz * 0.38, py + sz * 0.08, px + sz * 0.28, py + sz * 0.04);
                ctx.quadraticCurveTo(px + sz * 0.18, py - sz * 0.02, px + sz * 0.15, py - sz * 0.12);
                ctx.quadraticCurveTo(px + sz * 0.08, py - sz * 0.18, px + sz * 0.1, py - sz * 0.28);
                ctx.fill();
                // 美洲大陆
                ctx.beginPath();
                ctx.moveTo(px - sz * 0.45, py - sz * 0.22);
                ctx.quadraticCurveTo(px - sz * 0.38, py - sz * 0.35, px - sz * 0.28, py - sz * 0.3);
                ctx.quadraticCurveTo(px - sz * 0.22, py - sz * 0.22, px - sz * 0.25, py - sz * 0.1);
                ctx.quadraticCurveTo(px - sz * 0.3, py + sz * 0.02, px - sz * 0.38, py + sz * 0.08);
                ctx.quadraticCurveTo(px - sz * 0.48, py + sz * 0.06, px - sz * 0.48, py - sz * 0.05);
                ctx.fill();
                // 亚洲-澳洲
                ctx.fillStyle = '#9cc06c';
                ctx.beginPath();
                ctx.moveTo(px + sz * 0.32, py + sz * 0.12);
                ctx.quadraticCurveTo(px + sz * 0.48, py + sz * 0.08, px + sz * 0.52, py + sz * 0.18);
                ctx.quadraticCurveTo(px + sz * 0.5, py + sz * 0.28, px + sz * 0.42, py + sz * 0.32);
                ctx.quadraticCurveTo(px + sz * 0.34, py + sz * 0.28, px + sz * 0.32, py + sz * 0.2);
                ctx.fill();

                // 云层
                for (var c = 0; c < 12; c++) {
                    var cloudAngle = (c / 12) * Math.PI * 2;
                    var cloudRad = sz * (0.55 + Math.sin(cloudAngle * 3) * 0.1);
                    var cx = px + Math.cos(cloudAngle) * cloudRad;
                    var cy = py + Math.sin(cloudAngle) * cloudRad * 0.7;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, sz * 0.12, sz * 0.06, cloudAngle, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,255,245,0.18)';
                    ctx.fill();
                }
                ctx.restore();

            } else if (p.nameZH === '地球') {
                // 地球太小
                var pg = ctx.createRadialGradient(px - sz * 0.35, py - sz * 0.35, 0, px, py, sz);
                pg.addColorStop(0, '#ffffff');
                pg.addColorStop(0.15, p.highlightColor);
                pg.addColorStop(0.55, p.baseColor);
                pg.addColorStop(0.9, '#0a0a28');
                pg.addColorStop(1, '#020408');
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.fill();
            }

            // ========== 火星 ==========
            else if (p.nameZH === '火星' && sz > 4) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.clip();
                var marsGrad = ctx.createLinearGradient(px - sz * 0.4, py - sz * 0.3, px + sz * 0.5, py + sz * 0.4);
                marsGrad.addColorStop(0, '#e08060');
                marsGrad.addColorStop(0.3, '#c06040');
                marsGrad.addColorStop(0.7, '#a04028');
                marsGrad.addColorStop(1, '#702818');
                ctx.fillStyle = marsGrad;
                ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);
                // 暗色区域（地表特征）
                for (var m = 0; m < 8; m++) {
                    var mAng = (m / 8) * Math.PI * 2;
                    var mRad = sz * (0.35 + Math.sin(mAng * 2) * 0.12);
                    ctx.beginPath();
                    ctx.ellipse(px + Math.cos(mAng) * mRad, py + Math.sin(mAng) * mRad * 0.6, sz * 0.1, sz * 0.06, mAng, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(60,30,15,0.4)';
                    ctx.fill();
                }
                ctx.restore();
            } else if (p.nameZH === '火星') {
                var pg = ctx.createRadialGradient(px - sz * 0.35, py - sz * 0.35, 0, px, py, sz);
                pg.addColorStop(0, '#ffffff');
                pg.addColorStop(0.15, p.highlightColor);
                pg.addColorStop(0.55, p.baseColor);
                pg.addColorStop(0.9, '#0a0a28');
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.fill();
            }

            // ========== 金星 ==========
            else if (p.nameZH === '金星' && sz > 5) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.clip();
                var venusGrad = ctx.createLinearGradient(px - sz * 0.4, py - sz * 0.3, px + sz * 0.5, py + sz * 0.4);
                venusGrad.addColorStop(0, '#f0d878');
                venusGrad.addColorStop(0.4, '#e0c060');
                venusGrad.addColorStop(0.8, '#c8a048');
                venusGrad.addColorStop(1, '#a87830');
                ctx.fillStyle = venusGrad;
                ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);
                // 云层漩涡
                for (var v = 0; v < 6; v++) {
                    var vAng = (v / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.ellipse(px + Math.cos(vAng) * sz * 0.45, py + Math.sin(vAng) * sz * 0.3, sz * 0.2, sz * 0.08, vAng, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,240,180,0.2)';
                    ctx.fill();
                }
                ctx.restore();
            } else if (p.nameZH === '金星') {
                var pg = ctx.createRadialGradient(px - sz * 0.35, py - sz * 0.35, 0, px, py, sz);
                pg.addColorStop(0, '#ffffff');
                pg.addColorStop(0.15, p.highlightColor);
                pg.addColorStop(0.55, p.baseColor);
                pg.addColorStop(0.9, '#0a0a28');
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.fill();
            }

            // ========== 木星 ==========
            else if (p.nameZH === '木星' && sz > 6) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.clip();

                var jupiterBase = ctx.createLinearGradient(px - sz * 0.6, py - sz * 0.4, px + sz * 0.5, py + sz * 0.5);
                jupiterBase.addColorStop(0, '#e8c8a0');
                jupiterBase.addColorStop(0.2, '#d4b080');
                jupiterBase.addColorStop(0.5, '#c09868');
                jupiterBase.addColorStop(0.8, '#a87850');
                jupiterBase.addColorStop(1, '#8a6038');
                ctx.fillStyle = jupiterBase;
                ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);

                var beltColors = [
                    { y: -0.35, width: 0.12, color: '#8a6040', alpha: 0.7 },
                    { y: -0.2, width: 0.1, color: '#b89060', alpha: 0.6 },
                    { y: -0.05, width: 0.14, color: '#7a5030', alpha: 0.75 },
                    { y: 0.08, width: 0.13, color: '#c0a070', alpha: 0.55 },
                    { y: 0.22, width: 0.11, color: '#9a7048', alpha: 0.65 },
                    { y: 0.35, width: 0.1, color: '#886040', alpha: 0.7 }
                ];
                for (var b = 0; b < beltColors.length; b++) {
                    var belt = beltColors[b];
                    ctx.beginPath();
                    ctx.ellipse(px, py + belt.y * sz, sz * 0.95, belt.width * sz, 0, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(' + _hexToRgb(belt.color) + ',' + belt.alpha + ')';
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.ellipse(px, py - 0.12 * sz, sz * 0.92, 0.08 * sz, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(230,210,170,0.5)';
                ctx.fill();

                if (sz > 12) {
                    ctx.beginPath();
                    ctx.ellipse(px + sz * 0.32, py - sz * 0.08, sz * 0.22, sz * 0.14, -0.15, 0, Math.PI * 2);
                    var redSpotGrad = ctx.createRadialGradient(px + sz * 0.3, py - sz * 0.1, sz * 0.05, px + sz * 0.32, py - sz * 0.08, sz * 0.18);
                    redSpotGrad.addColorStop(0, '#c06040');
                    redSpotGrad.addColorStop(0.5, '#a04028');
                    redSpotGrad.addColorStop(1, '#702818');
                    ctx.fillStyle = redSpotGrad;
                    ctx.fill();
                }
                ctx.restore();

            } else if (p.nameZH === '木星') {
                var pg = ctx.createRadialGradient(px - sz * 0.35, py - sz * 0.35, 0, px, py, sz);
                pg.addColorStop(0, '#ffffff');
                pg.addColorStop(0.15, p.highlightColor);
                pg.addColorStop(0.55, p.baseColor);
                pg.addColorStop(0.9, '#0a0a28');
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.fill();
            }

            // ========== 土星（带光环）==========
            else if (p.nameZH === '土星' && sz > 5) {
                ctx.save();
                // 光环（先绘制底层）
                var ringTilt = -0.22;
                var ringWidth = sz * 1.95;
                var ringHeight = sz * 0.48;
                ctx.beginPath();
                ctx.ellipse(px, py, ringWidth, ringHeight, ringTilt, 0, Math.PI * 2);
                var ringGrad = ctx.createLinearGradient(px - ringWidth, py, px + ringWidth, py);
                ringGrad.addColorStop(0, 'rgba(160,130,75,0.35)');
                ringGrad.addColorStop(0.3, 'rgba(210,180,110,0.5)');
                ringGrad.addColorStop(0.6, 'rgba(240,210,140,0.55)');
                ringGrad.addColorStop(1, 'rgba(170,140,80,0.4)');
                ctx.fillStyle = ringGrad;
                ctx.fill();

                // 土星本体
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.clip();

                var saturnBase = ctx.createLinearGradient(px - sz * 0.5, py - sz * 0.3, px + sz * 0.6, py + sz * 0.4);
                saturnBase.addColorStop(0, '#f0e0b8');
                saturnBase.addColorStop(0.3, '#e8d0a0');
                saturnBase.addColorStop(0.6, '#d4bc88');
                saturnBase.addColorStop(1, '#c0a870');
                ctx.fillStyle = saturnBase;
                ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);

                var saturnBands = [
                    { y: -0.25, width: 0.08, color: '#d4b878', alpha: 0.5 },
                    { y: -0.1, width: 0.1, color: '#c8a868', alpha: 0.45 },
                    { y: 0.05, width: 0.12, color: '#e0c888', alpha: 0.4 },
                    { y: 0.2, width: 0.09, color: '#c8a868', alpha: 0.5 }
                ];
                for (var sb = 0; sb < saturnBands.length; sb++) {
                    var band = saturnBands[sb];
                    ctx.beginPath();
                    ctx.ellipse(px, py + band.y * sz, sz * 0.96, band.width * sz, 0, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(' + _hexToRgb(band.color) + ',' + band.alpha + ')';
                    ctx.fill();
                }
                ctx.restore();

            } else if (p.nameZH === '土星' && sz > 3) {
                // 土星较小时
                ctx.save();
                ctx.translate(px, py);
                ctx.strokeStyle = 'rgba(210,180,110,0.55)';
                ctx.fillStyle = 'rgba(190,155,85,0.25)';
                ctx.lineWidth = sz * 0.24;
                ctx.beginPath();
                ctx.ellipse(0, 0, sz * 1.85, sz * 0.45, -0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(0, 0, sz * 2.1, sz * 0.4, -0.18, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                var pg = ctx.createRadialGradient(px - sz * 0.35, py - sz * 0.35, 0, px, py, sz);
                pg.addColorStop(0, '#ffffff');
                pg.addColorStop(0.15, p.highlightColor);
                pg.addColorStop(0.55, p.baseColor);
                pg.addColorStop(0.9, '#0a0a28');
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.fill();
            }

            // ========== 天王星 / 海王星 ==========
            else if ((p.nameZH === '天王星' || p.nameZH === '海王星') && sz > 5) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.clip();
                var iceGrad = ctx.createLinearGradient(px - sz * 0.4, py - sz * 0.3, px + sz * 0.5, py + sz * 0.4);
                if (p.nameZH === '天王星') {
                    iceGrad.addColorStop(0, '#b0e0e8');
                    iceGrad.addColorStop(0.5, '#90c8d8');
                    iceGrad.addColorStop(1, '#70a8b8');
                } else {
                    iceGrad.addColorStop(0, '#4878d8');
                    iceGrad.addColorStop(0.5, '#3860b8');
                    iceGrad.addColorStop(1, '#284898');
                }
                ctx.fillStyle = iceGrad;
                ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);
                // 淡淡的大气纹理
                for (var u = 0; u < 8; u++) {
                    var uAng = (u / 8) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.ellipse(px + Math.cos(uAng) * sz * 0.45, py + Math.sin(uAng) * sz * 0.25, sz * 0.15, sz * 0.05, uAng, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(200,220,240,0.15)';
                    ctx.fill();
                }
                ctx.restore();
            } else if (p.nameZH === '天王星' || p.nameZH === '海王星') {
                var pg = ctx.createRadialGradient(px - sz * 0.35, py - sz * 0.35, 0, px, py, sz);
                pg.addColorStop(0, '#ffffff');
                pg.addColorStop(0.15, p.highlightColor);
                pg.addColorStop(0.55, p.baseColor);
                pg.addColorStop(0.9, '#0a0a28');
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.fill();
            }

            // ========== 水星及其他（默认渐变）==========
            else {
                var pg = ctx.createRadialGradient(px - sz * 0.35, py - sz * 0.35, 0, px, py, sz);
                pg.addColorStop(0, '#ffffff');
                pg.addColorStop(0.12, p.highlightColor);
                pg.addColorStop(0.5, p.baseColor);
                pg.addColorStop(0.88, '#0a0a28');
                pg.addColorStop(1, '#020408');
                ctx.fillStyle = pg;
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.fill();
            }

            // ========== 高光点（所有行星通用）==========
            var specularSize = sz * 0.28 * p.specular;
            var specularGrad = ctx.createRadialGradient(px - sz * 0.25, py - sz * 0.25, 0, px - sz * 0.25, py - sz * 0.25, specularSize);
            specularGrad.addColorStop(0, 'rgba(255,255,245,0.7)');
            specularGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = specularGrad;
            ctx.beginPath();
            ctx.arc(px - sz * 0.25, py - sz * 0.25, specularSize, 0, Math.PI * 2);
            ctx.fill();

            // ========== 文字标签 ==========
            var isCloseupMode = cam.isCloseup && cam.closeupTargetPlanet === p;
            if (sz > 3.5 && distToCam < 1300) {
                var fontSize = isCloseupMode ? Math.min(10, 7 * (450 / distToCam)) : Math.max(8, 9 * (500 / distToCam));
                ctx.fillStyle = isCloseupMode ? 'rgba(200,240,200,0.9)' : 'rgba(180,210,255,0.75)';
                ctx.font = fontSize + 'px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.nameZH, px, py - sz - 5);
            }
            ctx.globalAlpha = 1;
        }

        // ================== 太阳科幻特效（增强版）==================
        // ================== 太阳等离子体质感版（纯质感、无颗粒、无闪烁）==================
        function drawSunSciFi() {
            var sc = worldToScreen(0, 0, 0);
            var sx = sc.x, sy = sc.y;
            var _R = Math.min(42, 2800 / sc.dist);
            if (_R < 1) return _R;

            // ================== 1. 深空环境纯圆微光 (超大范围环境渲染) ==================
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            var ambientGlow = ctx.createRadialGradient(sx, sy, _R * 0.5, sx, sy, _R * 5.0);
            ambientGlow.addColorStop(0, 'rgba(255, 80, 10, 0.12)');
            ambientGlow.addColorStop(0.4, 'rgba(255, 35, 5, 0.04)');
            ambientGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = ambientGlow;
            ctx.beginPath();
            ctx.arc(sx, sy, _R * 5.0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ================== 2. 纯圆日冕层 (随时间轻微呼吸律动) ==================
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            // 完美的圆形发光边缘，带有一点点均匀的能量扩张感
            var breatheR = _R * (1.6 + Math.sin(t * 2.0) * 0.1);
            var coronaGlow = ctx.createRadialGradient(sx, sy, _R * 0.8, sx, sy, breatheR);
            coronaGlow.addColorStop(0, 'rgba(255, 160, 30, 0.4)');
            coronaGlow.addColorStop(0.6, 'rgba(230, 55, 10, 0.12)');
            coronaGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = coronaGlow;
            ctx.beginPath();
            ctx.arc(sx, sy, breatheR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ================== 3. 太阳本体：完美的球体聚变渐变 ==================
            ctx.save();
            // 核心稍微向左上角偏置 10%，营造极其自然的 3D 球体视觉
            var bodyGrad = ctx.createRadialGradient(sx - _R * 0.1, sy - _R * 0.1, 0, sx, sy, _R);
            bodyGrad.addColorStop(0, '#ffffff');       // 核心高能过曝（刺眼感来源）
            bodyGrad.addColorStop(0.2, '#ffeb99');     // 金黄过渡
            bodyGrad.addColorStop(0.55, '#ff6600');    // 高热橙红
            bodyGrad.addColorStop(0.85, '#b31200');    // 边缘深红
            bodyGrad.addColorStop(1, '#4a0200');       // 边缘吸光剪影，收束成完美正圆
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(sx, sy, _R, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ================== 4. 内部流动层 (用 clip 锁死在圆圈内部，不溢出) ==================
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath();
            ctx.arc(sx, sy, _R * 0.95, 0, Math.PI * 2); // 稍微往里缩一点，保证边缘干净
            ctx.clip(); // 裁剪遮罩：后续画的任何动态光晕都只在太阳内部显现

            for (var i = 0; i < 3; i++) {
                var ang = t * (0.3 + i * 0.2);
                var cx = sx + Math.cos(ang) * (_R * 0.12);
                var cy = sy + Math.sin(ang) * (_R * 0.12);
                var internalR = _R * (0.65 + i * 0.1);

                var intGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, internalR);
                intGrad.addColorStop(0, 'rgba(255, 215, 100, 0.16)');
                intGrad.addColorStop(0.6, 'rgba(255, 75, 10, 0.05)');
                intGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = intGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, internalR, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // ================== 5. 纯圆金色电离边框 (强化圆形的轮廓) ==================
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            var rimGrad = ctx.createRadialGradient(sx, sy, _R * 0.92, sx, sy, _R * 1.12);
            rimGrad.addColorStop(0, 'transparent');
            rimGrad.addColorStop(0.4, 'rgba(255, 120, 25, 0.35)');
            rimGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = rimGrad;
            ctx.beginPath();
            ctx.arc(sx, sy, _R * 1.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            return _R;
        }


        // ========== 彗星系统（从屏幕边缘飞入）==========
        // ========== 彗星系统（完全可配置）==========
        var cometSystem = (function () {
            var comets = [];

            var config = {
                maxCount: 2,                    // 最多同时存在的彗星数量（避免画面拥挤）
                spawnChance: 0.008,             // 每帧生成概率（0.008≈每1-2秒一颗）

                // ========== 彗星头部配置（深邃太空感）==========
                head: {
                    minSize: 1.5,               // 最小头部大小（像素）
                    maxSize: 7,                // 最大头部大小（像素）
                    minOpacity: 0.7,            // 最小不透明度（越深邃越半透明）
                    maxOpacity: 0.92,           // 最大不透明度

                    // 颜色池设计理念：
                    // - 深邃感 = 低饱和度 + 冷色调 + 带蓝/青/紫倾向
                    // - 科幻感 = 高能量核心 + 冷光外晕
                    // - 避免纯白、纯黄、纯红（这些太刺眼、缺乏深邃感）

                    colors: [
                        // ========== 顶级深邃（推荐占比50%）==========
                        [20, 100, 180],         // 深海蓝 - 极深邃，像黑暗深渊中的冷光
                        [30, 110, 170],         // 靛蓝 - 神秘、幽深
                        [40, 90, 160],          // 暮光蓝 - 黄昏星空的颜色
                        [60, 120, 200],         // 星云蓝 - 像星云中心的冷光
                        [15, 80, 150],          // 午夜蓝 - 最暗最深邃
                        [50, 130, 190],         // 冰川蓝 - 冷冽、纯净
                        [25, 95, 165],          // 深渊蓝 - 像深海发光生物

                        // ========== 高级深邃（推荐占比30%）==========
                        [70, 110, 180],         // 电光紫蓝 - 科幻感、能量感
                        [55, 100, 175],         // 夜幕蓝 - 星空主色调
                        [45, 120, 195],         // 湖蓝 - 清澈深邃
                        [80, 100, 170],         // 雾霾蓝 - 朦胧深邃

                        // ========== 冷色调深邃（推荐占比15%）==========
                        [90, 140, 210],         // 天青蓝 - 明亮但深邃
                        [100, 130, 190],        // 钢蓝 - 冷硬科幻
                        [85, 120, 185],         // 灰蓝 - 低调深邃

                        // ========== 稀有深邃（推荐占比5%，特殊视觉效果）==========
                        [140, 100, 200],        // 淡紫蓝 - 神秘外星感
                        [110, 90, 170],         // 暗紫 - 宇宙深渊色
                        [160, 130, 210],        // 香芋紫 - 柔和科幻
                        [130, 110, 180]         // 暮光紫 - 黄昏紫色
                    ]
                },

                // ========== 拖尾配置 ==========
                tail: {
                    minLength: 56,              // 最小拖尾长度（像素）
                    maxLength: 180,             // 最大拖尾长度
                    segments: 60,              // 拖尾线段数（平滑度）
                    startOpacity: 0.55,         // 头部处不透明度（不要太亮）
                    endOpacity: 0.0,           // 尾部处不透明度（完全淡出）
                    startWidth: 2.5,           // 头部处宽度（像素）
                    endWidth: 0.08,            // 尾部处宽度（极细）

                    // 拖尾颜色生成逻辑：
                    // - 头部颜色越深，拖尾越淡
                    // - 拖尾会从头部颜色渐变到几乎无色
                    // - 避免拖尾太亮抢戏
                },

                // ========== 运动配置 ==========
                motion: {
                    edgeSpeed: { min: 1.8, max: 4.5 },      // 边缘进入速度范围
                    edgeDirectionBias: 0.65,                // 朝向中心偏向量（0=随机，1=完全朝向中心）
                    depthSpeed: { min: 1.2, max: 3.0 },     // 深处飞来速度范围
                    depthStartSize: 0.6,                    // 深处初始大小（小点开始）
                    depthGrowRate: 0.07,                    // 每帧大小增长率（由小变大）
                    gravity: 0.012,                         // 太阳引力强度（影响轨迹弯曲）
                    maxSpeed: 5.5,                          // 最大速度限制
                    lifeDecay: 0.9975                       // 每帧生命衰减（越慢衰减越远）
                },

                // 出现类型比例
                spawnRatio: {
                    edge: 0.55,      // 55%从屏幕边缘飞入
                    depth: 0.45      // 45%从宇宙深处飞来（由小变大）
                }
            };

            function rand(min, max) { return min + Math.random() * (max - min); }

            function lerpColor(c1, c2, t) {
                return [
                    c1[0] + (c2[0] - c1[0]) * t,
                    c1[1] + (c2[1] - c1[1]) * t,
                    c1[2] + (c2[2] - c1[2]) * t
                ];
            }

            function toRgba(c, a) {
                return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')';
            }

            // 增强版颜色：生成更鲜艳的拖尾色
            function getEnhancedTailColor(headColor) {
                // 根据头部颜色生成对应的鲜艳拖尾色
                var r = headColor[0], g = headColor[1], b = headColor[2];

                // 蓝色系 → 青蓝拖尾
                if (r < 100 && g > 100 && b > 150) return [50, 180, 220];
                // 白色/金色系 → 暖黄/橙拖尾
                if (r > 200 && g > 180 && b < 150) return [255, 160, 80];
                // 红色/紫色系 → 紫红/粉拖尾
                if (r > 180 && g < 120) return [220, 80, 150];
                // 默认
                return [r * 0.7, g * 0.8, b * 1.2];
            }

            function buildComet(x, y, vx, vy, type, targetSize) {
                var colorIdx = Math.floor(Math.random() * config.head.colors.length);
                var headColor = config.head.colors[colorIdx];
                var tailColor = getEnhancedTailColor(headColor);

                return {
                    type: type,
                    x: x, y: y,
                    vx: vx, vy: vy,
                    headColor: headColor,
                    tailColor: tailColor,
                    headSize: type === 'depth' ? config.motion.depthStartSize : rand(config.head.minSize, config.head.maxSize),
                    targetHeadSize: targetSize || rand(config.head.minSize, config.head.maxSize),
                    tailLen: rand(config.tail.minLength, config.tail.maxLength),
                    opacity: rand(config.head.minOpacity, config.head.maxOpacity),
                    alpha: 1.0,
                    trail: [],
                    particles: [],
                    // 添加闪烁效果
                    flicker: rand(0.5, 1.0),
                    flickerSpeed: rand(0.05, 0.15)
                };
            }

            function spawnEdge(w, h) {
                var side = Math.floor(Math.random() * 4);
                var x, y;
                switch (side) {
                    case 0: x = -30; y = rand(0, h); break;
                    case 1: x = w + 30; y = rand(0, h); break;
                    case 2: x = rand(0, w); y = -30; break;
                    default: x = rand(0, w); y = h + 30; break;
                }
                var cx = w / 2, cy = h / 2;
                var spd = rand(config.motion.edgeSpeed.min, config.motion.edgeSpeed.max);
                var angle = Math.random() * Math.PI * 2;
                var vx = Math.cos(angle) * spd;
                var vy = Math.sin(angle) * spd;
                var dx = cx - x, dy = cy - y;
                var len = Math.hypot(dx, dy) || 1;
                var bias = config.motion.edgeDirectionBias;
                vx = vx * (1 - bias) + (dx / len) * spd * bias;
                vy = vy * (1 - bias) + (dy / len) * spd * bias;
                return buildComet(x, y, vx, vy, 'edge');
            }

            function spawnDepth(w, h) {
                var side = Math.floor(Math.random() * 4);
                var x, y;
                switch (side) {
                    case 0: x = rand(-300, -80); y = rand(0, h); break;
                    case 1: x = rand(w + 80, w + 300); y = rand(0, h); break;
                    case 2: x = rand(0, w); y = rand(-300, -80); break;
                    default: x = rand(0, w); y = rand(h + 80, h + 300); break;
                }
                var cx = w / 2, cy = h / 2;
                var dx = cx - x, dy = cy - y;
                var len = Math.hypot(dx, dy) || 1;
                var spd = rand(config.motion.depthSpeed.min, config.motion.depthSpeed.max);
                var target = rand(config.head.minSize, config.head.maxSize);
                return buildComet(x, y, (dx / len) * spd, (dy / len) * spd, 'depth', target);
            }

            function spawnParticle(c) {
                var spd = rand(0.5, 1.8);
                var angle = Math.atan2(c.vy, c.vx) + Math.PI + rand(-0.8, 0.8);
                return {
                    x: c.x, y: c.y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    life: 1.0,
                    decay: rand(0.03, 0.07),
                    size: rand(0.6, 1.5),
                    color: c.headColor
                };
            }

            function drawTail(ctx, c, time) {
                if (c.trail.length < 2) return;

                var len = c.trail.length;
                var WHITE = [255, 255, 255];

                for (var j = 0; j < len - 1; j++) {
                    var p1 = c.trail[j];
                    var p2 = c.trail[j + 1];

                    var t = j / (len - 1);
                    var fade = 1 - t;

                    var alpha = c.alpha * c.opacity * (
                        config.tail.startOpacity * (1 - t) + config.tail.endOpacity * t
                    );
                    if (alpha < 0.008) continue;

                    var width = (config.tail.startWidth * (1 - t) + config.tail.endWidth * t) * (c.headSize / 5);

                    // 拖尾颜色渐变：从头部颜色渐变到更透明的蓝/紫色
                    var tailColor;
                    if (t < 0.3) {
                        tailColor = lerpColor(c.headColor, c.tailColor, t * 3);
                    } else {
                        tailColor = lerpColor(c.tailColor, [120, 100, 180], (t - 0.3) / 0.7);
                    }

                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';

                    // 主拖尾线
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = toRgba(tailColor, alpha * 0.85);
                    ctx.lineWidth = Math.max(0.15, width);
                    ctx.lineCap = 'round';
                    ctx.stroke();

                    // 内层光晕（更亮）
                    if (alpha > 0.1) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = toRgba(WHITE, alpha * 0.35);
                        ctx.lineWidth = Math.max(0.1, width * 0.6);
                        ctx.stroke();
                    }

                    ctx.restore();
                }
            }

            function drawHead(ctx, c, time) {
                var x = c.x, y = c.y, r = c.headSize;

                // 微闪效果（增加生动感）
                var flicker = 0.92 + Math.sin(time * c.flickerSpeed * 12) * 0.08;
                var alpha = c.alpha * c.opacity * flicker;

                ctx.save();

                // ========== 第1层：紧致光晕（范围小，内收）==========
                ctx.globalCompositeOperation = 'lighter';
                var glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
                glow.addColorStop(0, toRgba(c.headColor, alpha * 0.25));
                glow.addColorStop(0.5, toRgba(c.headColor, alpha * 0.08));
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
                ctx.fill();

                // ========== 第2层：科幻能量球主体 ==========
                ctx.globalCompositeOperation = 'source-over';
                var body = ctx.createRadialGradient(x, y, 0, x, y, r);
                // 核心：炽白
                body.addColorStop(0, toRgba([255, 255, 255], alpha * 0.95));
                // 过渡：头部颜色
                body.addColorStop(0.4, toRgba(c.headColor, alpha * 0.8));
                // 边缘：融入黑暗
                body.addColorStop(0.85, toRgba(c.headColor, alpha * 0.2));
                body.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = body;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();

                // ========== 第3层：中心能量核心（深邃感）==========
                ctx.globalCompositeOperation = 'lighter';
                var core = ctx.createRadialGradient(x, y, 0, x, y, r * 0.45);
                core.addColorStop(0, toRgba([255, 255, 245], alpha * 0.9));
                core.addColorStop(0.7, toRgba([255, 255, 255], alpha * 0.4));
                core.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = core;
                ctx.beginPath();
                ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            function drawParticles(ctx, c, time) {
                for (var i = 0; i < c.particles.length; i++) {
                    var p = c.particles[i];
                    ctx.save();
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.globalAlpha = p.life * 0.7;

                    var pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.8);
                    pg.addColorStop(0, toRgba([255, 255, 255], 0.95));
                    pg.addColorStop(0.4, toRgba(p.color, 0.6));
                    pg.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = pg;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // 添加时间变量用于闪烁效果
            var globalTime = 0;

            return {
                updateAndDraw: function (ctx, w, h, sunX, sunY) {
                    globalTime += 0.05;

                    if (comets.length < config.maxCount && Math.random() < config.spawnChance) {
                        comets.push(Math.random() < config.spawnRatio.edge ? spawnEdge(w, h) : spawnDepth(w, h));
                    }

                    for (var i = comets.length - 1; i >= 0; i--) {
                        var c = comets[i];

                        if (config.motion.gravity > 0 && sunX != null) {
                            var dx = sunX - c.x, dy = sunY - c.y;
                            var dist = Math.hypot(dx, dy);
                            if (dist > 10 && dist < 900) {
                                var gf = config.motion.gravity * (280 / dist);
                                c.vx += (dx / dist) * gf;
                                c.vy += (dy / dist) * gf;
                            }
                        }

                        var spd = Math.hypot(c.vx, c.vy);
                        if (spd > config.motion.maxSpeed) {
                            c.vx = c.vx / spd * config.motion.maxSpeed;
                            c.vy = c.vy / spd * config.motion.maxSpeed;
                        }

                        c.x += c.vx;
                        c.y += c.vy;
                        c.alpha *= config.motion.lifeDecay;

                        if (c.type === 'depth' && c.headSize < c.targetHeadSize) {
                            c.headSize = Math.min(c.headSize + config.motion.depthGrowRate, c.targetHeadSize);
                        }

                        c.trail.unshift({ x: c.x, y: c.y });
                        var maxTrail = Math.floor(c.tailLen / 3.2);
                        if (c.trail.length > maxTrail) c.trail.pop();

                        // 粒子生成概率提高，增加视觉效果
                        if (Math.random() < 0.35 && c.headSize > 2) {
                            c.particles.push(spawnParticle(c));
                        }
                        for (var pi = c.particles.length - 1; pi >= 0; pi--) {
                            var p = c.particles[pi];
                            p.x += p.vx; p.y += p.vy;
                            p.life -= p.decay;
                            if (p.life <= 0) c.particles.splice(pi, 1);
                        }

                        if (c.x < -400 || c.x > w + 400 || c.y < -400 || c.y > h + 400 || c.alpha < 0.04) {
                            comets.splice(i, 1);
                            continue;
                        }

                        drawTail(ctx, c, globalTime);
                        drawParticles(ctx, c, globalTime);
                        drawHead(ctx, c, globalTime);
                    }
                }
            };
        })();

        function drawBackground() {
            bgRotAngle += 0.0002;

            // ========== 普通星星 ==========
            for (var li = 0; li < starLayers.length; li++) {
                var layer = starLayers[li];
                for (var si = 0; si < layer.length; si++) {
                    var s = layer[si];
                    var cosBg = Math.cos(bgRotAngle * 0.5), sinBg = Math.sin(bgRotAngle * 0.5);
                    var sx3 = s.x * cosBg - s.z * sinBg, sz3 = s.x * sinBg + s.z * cosBg;
                    var sc = worldToScreen(sx3, s.y, sz3);
                    if (sc.x < -10 || sc.x > w + 10 || sc.y < -10 || sc.y > h + 10) continue;

                    var alpha = s.alpha * (0.3 + 0.7 * Math.abs(Math.sin(t * s.spd + s.phase)));
                    ctx.globalAlpha = Math.min(0.7, alpha);
                    var size = s.baseSize * (500 / sc.dist);

                    ctx.fillStyle = s.color;
                    ctx.beginPath();
                    ctx.arc(sc.x, sc.y, Math.max(0.5, size), 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // ========== 彗星 ==========
            cometSystem.updateAndDraw(ctx, w, h, w/2, h/2);

            // ========== 十字星 ==========
            for (var ci = 0; ci < crossStars.length; ci++) {
                var cs = crossStars[ci];
                var cosBg = Math.cos(bgRotAngle * 0.02), sinBg = Math.sin(bgRotAngle * 0.02);
                var csx = cs.x * cosBg - cs.z * sinBg, csz = cs.x * sinBg + cs.z * cosBg;
                var sc = worldToScreen(csx, cs.y, csz);

                if (sc.x < -50 || sc.x > w + 50 || sc.y < -50 || sc.y > h + 50) continue;
                if (sc.dist < 200) continue;

                var cfg = cs.type === 'near' ? crossConfig.near :
                    (cs.type === 'mid' ? crossConfig.mid : crossConfig.far);

                var twinkle = 0.7 + 0.3 * Math.sin(t * cs.twinkleSpeed + cs.twinklePhase);
                var distFactor = 400 / Math.max(sc.dist, 300);
                var baseSize = cfg.baseSize * Math.min(1.5, distFactor) * twinkle;
                var length = baseSize * crossConfig.lengthFactor * cfg.lengthMult;
                var width = baseSize * crossConfig.widthFactor * cfg.widthMult;
                var coreR = baseSize * 0.35;

                ctx.save();
                ctx.translate(sc.x, sc.y);
                ctx.globalAlpha = cfg.alpha * cs.alpha * (0.7 + 0.3 * twinkle);

                if (cfg.glowIntensity > 0) {
                    var glowSize = length * (1.2 + cfg.glowIntensity * 1.5);
                    var glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                    glowGrad.addColorStop(0, cs.color);
                    glowGrad.addColorStop(0.3, cs.color + '88');
                    glowGrad.addColorStop(0.7, cs.color + '22');
                    glowGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = glowGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
                    ctx.fill();
                }

                for (var dir = 0; dir < 4; dir++) {
                    var angle = dir * Math.PI / 2;
                    var dx = Math.cos(angle);
                    var dy = Math.sin(angle);
                    var perpX = -dy;
                    var perpY = dx;
                    var tipX = dx * length;
                    var tipY = dy * length;
                    var baseLeftX = perpX * width;
                    var baseLeftY = perpY * width;
                    var baseRightX = -perpX * width;
                    var baseRightY = -perpY * width;

                    ctx.beginPath();
                    ctx.moveTo(baseLeftX, baseLeftY);
                    ctx.lineTo(tipX, tipY);
                    ctx.lineTo(baseRightX, baseRightY);
                    ctx.closePath();

                    var grad = ctx.createLinearGradient(0, 0, tipX, tipY);
                    grad.addColorStop(0, cs.color);
                    grad.addColorStop(0.6, cs.color);
                    grad.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = grad;
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.arc(0, 0, coreR, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(0, 0, coreR * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = cs.color;
                ctx.fill();

                ctx.restore();
            }
            ctx.globalAlpha = 1;
        }

        // ================== 6. 导演调度系统（只改变变化率，不改变位置）==================
        function scheduleNextCameraEvent() {
            cam.viewChangeTimer = 0;
            cam.viewChangeInterval = 12 + Math.random() * 10;

            var rand = Math.random();

            if (rand < 0.25 && !cam.isCloseup) {
                // 25% 特写模式
                var validPlanets = planets.filter(function(p) { return p.nameZH !== '水星'; });
                var idx = Math.floor(Math.random() * validPlanets.length);
                cam.closeupTargetPlanet = validPlanets[idx];
                cam.isCloseup = true;
                cam.closeupProgress = 0;

                // 设置特写时长
                if (cam.closeupTargetPlanet.nameZH === '土星') {
                    cam.closeupDuration = 12;
                } else if (cam.closeupTargetPlanet.nameZH === '地球') {
                    cam.closeupDuration = 20;
                } else {
                    cam.closeupDuration = 15;
                }

                // 特写模式：保持速度大小不变，只改变方向符号
                // 计算目标行星的方向
                var pPos = getPlanetWorld(cam.closeupTargetPlanet);
                var targetPhi = Math.atan2(pPos.y, pPos.x);
                var diffPhi = targetPhi - cam.phi;
                var diffTheta = 0.25 - cam.theta;

                // 只改变方向符号，速度大小保持与漫游一致
                // 水平方向：朝着行星方向（正或负）
                cam.phiDelta = (diffPhi > 0 ? 0.0012 : -0.0012);
                // 仰角：朝着0.25方向
                cam.thetaDelta = (diffTheta > 0 ? 0.0003 : -0.0003);
                // 视距：开始慢慢拉近（速度大小与漫游一致）
                cam.radiusDelta = -0.8;

            } else if (!cam.isCloseup) {
                // 75% 漫游模式：只改变运动方向，速度大小不变

                // 1. 水平方向：随机左转或右转（改变 phiDelta 的正负号）
                var newPhiDir = (Math.random() - 0.5) > 0 ? 0.0012 : -0.0012;
                cam.phiDelta = newPhiDir;

                // 2. 仰角方向：随机向上或向下（改变 thetaDelta 的正负号）
                var newThetaDir = (Math.random() - 0.5) > 0 ? 0.0003 : -0.0003;
                cam.thetaDelta = newThetaDir;

                // 3. 视距方向：随机拉近或拉远（改变 radiusDelta 的正负号）
                var newRadiusDir = (Math.random() - 0.5) * 1.5;
                cam.radiusDelta = newRadiusDir;

                // 焦点回归太阳系中心
                cam.tx = 0; cam.ty = 0; cam.tz = 0;
            }
        }

        var lastTime = performance.now();

        function drawHUD() {
            var px = 10, py = 8;

            // 测量文字宽度
            ctx.font = '500 12px "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';
            var titleW = ctx.measureText('深空追踪者').width;
            ctx.font = '10px "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';
            var line1W = ctx.measureText('视距 ' + cam.radius.toFixed(0) + ' km').width;
            var line2W = ctx.measureText('仰角 ' + (cam.theta * 57).toFixed(0) + '°').width;
            var modeText = (cam.isCloseup && cam.closeupTargetPlanet) ? cam.closeupTargetPlanet.nameZH + ' 特写' : '星际漫游';
            var line3W = ctx.measureText(modeText).width;
            var line4W = ctx.measureText('帧率 ' + fps).width;
            var nextChange = Math.max(0, Math.ceil(cam.viewChangeInterval - cam.viewChangeTimer));
            var line5W = ctx.measureText('方向 ' + nextChange + 's').width;

            // 框宽度 = 最大文字宽度 + 内边距（加大一点）
            var maxW = Math.max(titleW, line1W, line2W, line3W, line4W, line5W) + 28;
            var hBox = 94;  // 高度稍微加一点

            ctx.fillStyle = 'rgba(3, 8, 20, 0.85)';
            ctx.fillRect(px, py, maxW, hBox);
            ctx.strokeStyle = 'rgba(0, 180, 210, 0.4)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(px, py, maxW, hBox);

            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // 标题
            ctx.font = '500 12px "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';
            ctx.fillStyle = '#0af';
            ctx.fillText('深空追踪者', px + 10, py + 6);

            // 分隔线
            ctx.strokeStyle = 'rgba(0, 180, 210, 0.25)';
            ctx.beginPath();
            ctx.moveTo(px + 8, py + 22);
            ctx.lineTo(px + maxW - 8, py + 22);
            ctx.stroke();

            // 数据行
            ctx.font = '10px "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';
            ctx.fillStyle = '#8cf';
            var y = py + 28;
            var lineH = 13;

            ctx.fillText('视距 ' + cam.radius.toFixed(0) + ' km', px + 10, y);
            y += lineH;
            ctx.fillText('仰角 ' + (cam.theta * 57).toFixed(0) + '°', px + 10, y);
            y += lineH;
            ctx.fillText(modeText, px + 10, y);
            y += lineH;
            ctx.fillText('帧率 ' + fps, px + 10, y);
            y += lineH;

            ctx.fillStyle = nextChange <= 4 ? '#fa3' : '#6af';
            ctx.fillText('方向 ' + nextChange + 's', px + 10, y);
        }

        // ================== 7. 主循环 ==================
        function draw() {
            if (!act()) return;

            var now = performance.now();
            var dt = (now - lastTime) / 1000;
            if (dt > 0.1) dt = 0.1;
            if (dt <= 0) dt = 0.016;
            fps = Math.round(1 / dt);
            lastTime = now;

            t += dt;

            // 天体运动（行星持续公转）
            for (var pi = 0; pi < planets.length; pi++) planets[pi].ang += planets[pi].sp * dt * 0.8;
            for (var ai = 0; ai < asteroids.length; ai++) asteroids[ai].ang += asteroids[ai].spd * dt * 0.7;

            // 导演调度（定时改变变化率）
            cam.viewChangeTimer += dt;
            if (cam.viewChangeTimer >= cam.viewChangeInterval) {
                scheduleNextCameraEvent();
            }

            // 特写模式处理
            if (cam.isCloseup && cam.closeupTargetPlanet) {
                cam.closeupProgress += dt;

                if (cam.closeupProgress >= cam.closeupDuration) {
                    // 退出特写，恢复漫游模式
                    cam.isCloseup = false;
                    cam.closeupTargetPlanet = null;
                    cam.tx = 0; cam.ty = 0; cam.tz = 0;
                    // 恢复随机的运动趋势（速度大小不变）
                    cam.phiDelta = (Math.random() - 0.5) > 0 ? 0.0012 : -0.0012;
                    cam.thetaDelta = (Math.random() - 0.5) > 0 ? 0.0003 : -0.0003;
                    cam.radiusDelta = (Math.random() - 0.5) * 1.5;
                } else {
                    // 特写中：只改变方向符号，保持速度大小
                    var pPos = getPlanetWorld(cam.closeupTargetPlanet);
                    cam.tx = pPos.x;
                    cam.ty = pPos.y;
                    cam.tz = pPos.z;

                    // 计算目标方向
                    var targetPhi = Math.atan2(pPos.y, pPos.x);
                    var targetTheta = 0.25;

                    var diffPhi = targetPhi - cam.phi;
                    var diffTheta = targetTheta - cam.theta;

                    // 只改变方向符号，保持速度大小不变
                    cam.phiDelta = (diffPhi > 0 ? 0.0012 : -0.0012);
                    cam.thetaDelta = (diffTheta > 0 ? 0.0003 : -0.0003);

                    // 视距逐渐拉近
                    var targetRadius = Math.max(110, cam.closeupTargetPlanet.sz * 4.5 + 45);
                    var radiusDiff = targetRadius - cam.radius;
                    // 柔和调整视距变化率
                    cam.radiusDelta = radiusDiff * 0.03;
                }
            } else {
                // 漫游模式：焦点平滑回归太阳中心
                cam.x += (cam.tx - cam.x) * 0.05;
                cam.y += (cam.ty - cam.y) * 0.05;
                cam.z += (cam.tz - cam.z) * 0.05;
            }

            // 关键：每帧更新摄像机位置（连续运动，无跳跃）
            cam.phi += cam.phiDelta * dt * 60;
            cam.theta += cam.thetaDelta * dt * 60;
            cam.radius += cam.radiusDelta * dt * 60;

            // 边界限制
            cam.theta = Math.min(1.2, Math.max(0.12, cam.theta));
            cam.radius = Math.min(900, Math.max(120, cam.radius));

            // 角度范围归一化
            if (cam.phi > Math.PI * 2) cam.phi -= Math.PI * 2;
            if (cam.phi < 0) cam.phi += Math.PI * 2;

            // 渲染
            ctx.fillStyle = '#010206';
            ctx.fillRect(0, 0, w, h);
            drawBackground();

            for (var ai = 0; ai < asteroids.length; ai++) {
                var ast = asteroids[ai];
                var sc = worldToScreen(Math.cos(ast.ang) * ast.a, Math.sin(ast.ang) * ast.b, 0);
                ctx.globalAlpha = ast.alpha * 0.4;
                ctx.fillStyle = '#9c8e7c';
                ctx.beginPath();
                ctx.arc(sc.x, sc.y, ast.sz * Math.max(0.25, 350 / sc.dist), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            for (var pi = 0; pi < planets.length; pi++) drawOrbit(planets[pi]);
            var sunR = drawSunSciFi();  // 使用科幻特效太阳

            var planets3D = [];
            for (var pi = 0; pi < planets.length; pi++) {
                var wpos = getPlanetWorld(planets[pi]);
                var sc = worldToScreen(wpos.x, wpos.y, wpos.z);
                planets3D.push({ p: planets[pi], x: wpos.x, y: wpos.y, z: wpos.z, dist: sc.dist });
            }
            planets3D.sort(function(a, b) { return b.dist - a.dist; });
            for (var ii = 0; ii < planets3D.length; ii++) {
                drawPlanet(planets3D[ii].p, planets3D[ii].x, planets3D[ii].y, planets3D[ii].z);
            }

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            var sunPos = worldToScreen(0, 0, 0);
            var aura = ctx.createRadialGradient(sunPos.x, sunPos.y, sunR * 0.4, sunPos.x, sunPos.y, sunR * 4.5);
            aura.addColorStop(0, 'rgba(255,140,40,0.08)');
            aura.addColorStop(1, 'rgba(255,40,0,0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(sunPos.x, sunPos.y, sunR * 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            drawHUD();
            requestAnimationFrame(draw);
        }
        draw();
    });