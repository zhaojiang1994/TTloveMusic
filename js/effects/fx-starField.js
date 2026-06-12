EffectRegister('starField', function(w,h,ctx,cv,act) {

        // ==================== 🎛️ 宇宙万物共存与概率矩阵控制台 ====================
        var CFG = {
            starCount: 2190,         // 背景星空密度
            maxConcurrent: 2,       // 【全局同屏上限】升级到4，允许更多史诗级同框
            baseSpeed: 1,         // 基础宇宙推进速度

            // 🛸 实体行为及共存矩阵核心配置
            entities: {
                ufo: {
                    chance: 0.005,       // 每帧出现概率
                    cooldown: 1140,
                    limit: 1,
                    canSpawnWith: ['ufo', 'overtaker', 'crosser', 'ranger', 'silverGalaxy']
                },
                overtaker: {
                    chance: 0.005,
                    cooldown: 720,
                    limit: 1,
                    canSpawnWith: ['ufo', 'crosser', 'ranger', 'silverGalaxy']
                },
                crosser: {
                    chance: 0.005,       // 【星际迷航·企业号】优雅中速穿梭
                    cooldown: 1100,
                    limit: 1,
                    canSpawnWith: ['ufo', 'overtaker', 'ranger', 'silverGalaxy']
                },
                ranger: {
                    chance: 0.004,       // 【🎬 新增：星际穿越·徘徊者号】极速超越效果
                    cooldown: 440,      // 独立冷却
                    limit: 1,           // 同时只允许一架打破物理极速
                    canSpawnWith: ['ufo', 'overtaker', 'crosser', 'silverGalaxy'] // 允许超越任何飞船
                },
                silverGalaxy: {
                    chance: 0.005,
                    cooldown: 500,
                    limit: 1,
                    canSpawnWith: ['ufo', 'overtaker', 'crosser', 'ranger']
                }
            }
        };
        // =====================================================================

        var t=0, stars = [];
        var cooldowns = { ufo: 0, overtaker: 0, crosser: 0, ranger: 0, silverGalaxy: 0 };

        for(var i=0; i<CFG.starCount; i++) {
            stars.push({x:(_R()-0.5)*w*6, y:(_R()-0.5)*h*6, z:_R()*w, sz:0.4+_R()*1.2, sp:(1.4+_R()*1.8)*CFG.baseSpeed});
        }

        var spaceEntities = [];

        function draw() {
            if(!act()) return; t += 0.012 * CFG.baseSpeed;

            for (var key in cooldowns) { if (cooldowns[key] > 0) cooldowns[key]--; }

            _fillBg(ctx, w, h, '#020205', '#000000');
            ctx.globalCompositeOperation = 'lighter';

            // 1. 远景恒星流渲染
            ctx.fillStyle = '#ffffff';
            for(var i=0; i<stars.length; i++){
                var s = stars[i]; s.z -= s.sp;
                if(s.z <= 1) { s.z = w; s.x = (_R()-0.5)*w*6; s.y = (_R()-0.5)*h*6; }
                var sx = s.x / s.z * 250 + w / 2;
                var sy = s.y / s.z * 250 + h / 2;
                var sz = _M(0.1, s.sz * w / s.z * 0.35);
                if(sz > 6) sz = 6;
                if(sx > -10 && sx < w + 10 && sy > -10 && sy < h + 10){
                    ctx.globalAlpha = _M(0.05, Math.min(0.75, (w - s.z) / (w * 0.25)));
                    ctx.beginPath(); ctx.arc(sx, sy, sz, 0, _P*2); ctx.fill();
                }
            }

            // 2. 矩阵共存碰撞过滤与随机洗牌算法
            if(spaceEntities.length < CFG.maxConcurrent) {
                var activeCounts = {};
                for(var m=0; m<spaceEntities.length; m++) {
                    var actType = spaceEntities[m].type;
                    activeCounts[actType] = (activeCounts[actType] || 0) + 1;
                }

                var eligibleCandidates = [];
                for(var type in CFG.entities) {
                    var conf = CFG.entities[type];
                    if(cooldowns[type] > 0) continue;
                    if((activeCounts[type] || 0) >= conf.limit) continue;

                    var isCompatible = true;
                    for(var activeType in activeCounts) {
                        if(conf.canSpawnWith.indexOf(activeType) === -1) { isCompatible = false; break; }
                    }
                    if(isCompatible) eligibleCandidates.push(type);
                }

                // Fisher-Yates 乱序洗牌打破死锁
                if(eligibleCandidates.length > 1) {
                    for (var k = eligibleCandidates.length - 1; k > 0; k--) {
                        var j = Math.floor(_R() * (k + 1));
                        var temp = eligibleCandidates[k];
                        eligibleCandidates[k] = eligibleCandidates[j];
                        eligibleCandidates[j] = temp;
                    }
                }

                if(eligibleCandidates.length > 0) {
                    for(var n=0; n<eligibleCandidates.length; n++) {
                        var cType = eligibleCandidates[n];
                        if(_R() < CFG.entities[cType].chance) {
                            cooldowns[cType] = CFG.entities[cType].cooldown;

                            if (cType === 'ufo') {
                                var dir = _R() > 0.5 ? 1 : -1;
                                spaceEntities.push({
                                    type: 'ufo', x: dir === 1 ? -w*0.65 : w*0.65, y: (_R()-0.5)*h*0.15, z: w*0.38 + _R()*w*0.12,
                                    vx: dir * (3.8 + _R()*2)*CFG.baseSpeed, vy: _S(t)*0.4, vz: -0.8 * CFG.baseSpeed, sz: 65, seed: _R()*_P
                                });
                            } else if (cType === 'overtaker') {
                                spaceEntities.push({
                                    type: 'overtaker', x: (_R()-0.5)*w*0.08, y: (_R()-0.5)*h*0.08, z: 12,
                                    vx: 0, vy: 0, vz: (15 + _R()*4)*CFG.baseSpeed, sz: 45, seed: _R()*_P
                                });
                            } else if (cType === 'crosser') {
                                var dir = _R() > 0.5 ? 1 : -1;
                                spaceEntities.push({
                                    type: 'crosser', x: dir === 1 ? -w*0.75 : w*0.75, y: (_R()-0.5)*h*0.22, z: w*0.35 + _R()*w*0.1,
                                    vx: dir * (4.8 + _R()*1.2)*CFG.baseSpeed, vy: -0.12 * CFG.baseSpeed, vz: -0.5 * CFG.baseSpeed, sz: 80, seed: _R()*_P
                                });
                            } else if (cType === 'ranger') {
                                // 🛸 徘徊者号超速轨迹：产生从镜头一侧极速向前冲刺超越自身的推背感
                                var dir = _R() > 0.5 ? 1 : -1;
                                spaceEntities.push({
                                    type: 'ranger',
                                    x: dir === 1 ? -w * 0.45 : w * 0.45,
                                    y: (_R() - 0.5) * h * 0.3,
                                    z: w * 0.5, // 从较远方切入，但赋予极高的瞬时 X 和负 Z 轴加速度
                                    vx: dir * (12.5 + _R() * 4.5) * CFG.baseSpeed, // 极高的横向切入相对速度
                                    vy: (_R() - 0.5) * 0.5 * CFG.baseSpeed,
                                    vz: -(4.5 + _R() * 2.5) * CFG.baseSpeed,      // 极速向前跃迁逃逸
                                    sz: 55,
                                    seed: _R() * _P
                                });
                            } else if (cType === 'silverGalaxy') {
                                var side = _R() > 0.5 ? 1 : -1;
                                var pList = [];
                                for(var p=0; p<160; p++) {
                                    var isDebris = _R() < 0.32;
                                    pList.push({
                                        r: 0.08 + _R() * 0.92,
                                        armOffset: (_R() > 0.5 ? 0 : _P),
                                        flowSpeed: 0.003 + _R() * 0.005,
                                        sz: isDebris ? (0.6 + _R()*1.2) : (1.0 + _R()*1.8),
                                        alpha: 0.3 + _R() * 0.6,
                                        isDebris: isDebris,
                                        dragLag: _R() * 0.45
                                    });
                                }
                                spaceEntities.push({
                                    type: 'silverGalaxy', x: side * (w * 0.45 + _R()*w*0.1), y: (_R()-0.5)*h*0.12, z: w,
                                    vx: 0, vy: 0, vz: -2.2 * CFG.baseSpeed, sz: 130, seed: _R()*_P, particles: pList
                                });
                            }
                            break;
                        }
                    }
                }
            }

            // 3. 统一流水线渲染
            for (var i = spaceEntities.length - 1; i >= 0; i--) {
                var ent = spaceEntities[i];
                ent.x += ent.vx; ent.y += ent.vy; ent.z += ent.vz;

                if(ent.z <= 3 || ent.z > w * 1.25 || Math.abs(ent.x) > w * 6) {
                    spaceEntities.splice(i, 1); continue;
                }

                var ex = ent.x / ent.z * 250 + w / 2;
                var ey = ent.y / ent.z * 250 + h / 2;
                var esz = (ent.sz * w / ent.z) * 0.4;

                if (esz > 260) esz = 260;
                if (esz <= 0 || isNaN(esz)) continue;
                if (ex < -350 || ex > w + 350 || ey < -350 || ey > h + 350) continue;

                ctx.save();
                try {
                    ctx.translate(ex, ey);
                    var edgeAlpha = Math.min(1, ent.z / 20) * Math.min(1, (w * 1.1 - ent.z) / (w * 0.15));
                    ctx.globalAlpha = Math.max(0, Math.min(0.95, edgeAlpha));

                    if (ent.type === 'overtaker') {
                        // 【🎬 工业光魔级：重装星际歼星舰 - 巨型机械压迫感与万家灯火】
                        ctx.rotate(_S(t * 0.15) * 0.008); // 极其沉稳的微弱摆动
                        ctx.lineWidth = 1.0;

                        // --- 1. 底层：巨舰阴影轮廓与左/右舷复合装甲 ---
                        // 右舷（受光面：深灰蓝）
                        ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#334155';
                        ctx.beginPath();
                        ctx.moveTo(0, -esz * 0.55);          // 锋利舰艏
                        ctx.lineTo(esz * 0.48, esz * 0.30);   // 右舷末端
                        ctx.lineTo(0, esz * 0.22);            // 尾部中轴凹陷
                        ctx.closePath(); ctx.fill(); ctx.stroke();

                        // 左舷（背光面：极深暗蓝，拉出3D立体割裂感）
                        ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#1e293b';
                        ctx.beginPath();
                        ctx.moveTo(0, -esz * 0.55);          // 锋利舰艏
                        ctx.lineTo(-esz * 0.48, esz * 0.30);  // 左舷末端
                        ctx.lineTo(0, esz * 0.22);            // 尾部中轴凹陷
                        ctx.closePath(); ctx.fill(); ctx.stroke();

                        // --- 2. 中层：中轴线凸起装甲脊梁 (Main Ridge) ---
                        ctx.fillStyle = '#111827';
                        ctx.beginPath();
                        ctx.moveTo(0, -esz * 0.25);
                        ctx.lineTo(esz * 0.08, esz * 0.18);
                        ctx.lineTo(-esz * 0.08, esz * 0.18);
                        ctx.closePath(); ctx.fill();

                        // --- 3. 高层：多层叠置指挥塔台大楼 (Command Structure) ---
                        // 塔台基座
                        ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#475569';
                        ctx.fillRect(-esz * 0.14, esz * 0.10, esz * 0.28, esz * 0.06);
                        ctx.strokeRect(-esz * 0.14, esz * 0.10, esz * 0.28, esz * 0.06);

                        // 核心舰桥（T字形上层建筑）
                        ctx.fillStyle = '#0f172a';
                        ctx.fillRect(-esz * 0.09, esz * 0.06, esz * 0.18, esz * 0.04);
                        // 顶部雷达桁架
                        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(-esz * 0.05, esz * 0.06); ctx.lineTo(esz * 0.05, esz * 0.06);
                        ctx.stroke();

                        // 标志性双侧球形护盾发生器 (Shield Generators)
                        ctx.fillStyle = '#64748b';
                        ctx.beginPath(); ctx.arc(-esz * 0.04, esz * 0.045, esz * 0.015, 0, _P*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(esz * 0.04, esz * 0.045, esz * 0.015, 0, _P*2); ctx.fill();

                        // --- 4. 灵魂注入：全舰像素级巨量舷窗灯火 (Cityscape Window Glow) ---
                        // 利用舰船固定的seed种子，在一副画幅中保持灯火位置固定，但带有极微弱的微秒闪烁
                        var lightSeed = Math.sin(ent.seed) * 1000;
                        ctx.fillStyle = 'rgba(254, 240, 138, 0.85)'; // 帝国经典的暖白/微黄舷窗光

                        // 沿中轴装甲带的灯火
                        for(var l=0; l<16; l++) {
                            var ly = esz * (-0.15 + l * 0.025);
                            var lx = (Math.sin(l + lightSeed) * 0.02) * esz;
                            if(Math.cos(l * 5 + t * 2) > -0.7) { // 模拟星战电影中庞大建筑群的随机部分灯光
                                ctx.fillRect(lx, ly, 1.2, 1.2);
                            }
                        }
                        // 沿左右外装甲边缘的密集星光灯火（极度显大）
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        for(var e=0; e<12; e++) {
                            var ratio = 0.2 + e * 0.06; // 沿边缘分布比例
                            var eY = esz * (-0.55 + 0.85 * ratio);
                            var eX_right = esz * (0.48 * ratio);
                            ctx.fillRect(eX_right - 2, eY, 1, 1);  // 右舷边缘灯
                            ctx.fillRect(-eX_right + 2, eY, 1, 1); // 左舷边缘灯
                        }

                        // --- 5. 尾部：阶梯式巨型高能推进器阵列 (Kuat Engine Wells) ---
                        // 经典的三大主引擎 + 两侧副引擎布局
                        var mainEngines = [-0.14, 0, 0.14];
                        mainEngines.forEach(pos => {
                            // 引擎金属尾喷管
                            ctx.fillStyle = '#334155'; ctx.fillRect(pos * esz - esz*0.03, esz * 0.22, esz*0.06, esz*0.02);
                            // 炽热高能离子光晕
                            var engineGlow = ctx.createRadialGradient(pos * esz, esz * 0.23, 0, pos * esz, esz * 0.23, esz * 0.09);
                            engineGlow.addColorStop(0, '#ffffff');
                            engineGlow.addColorStop(0.2, 'rgba(14, 165, 233, 0.95)'); // 幽蓝色冷光
                            engineGlow.addColorStop(0.6, 'rgba(56, 189, 248, 0.25)');
                            engineGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
                            ctx.fillStyle = engineGlow;
                            ctx.beginPath(); ctx.arc(pos * esz, esz * 0.23, esz * 0.09, 0, _P*2); ctx.fill();
                        });

                        // 边缘较小的两个次级副推进器
                        var subEngines = [-0.25, 0.25];
                        subEngines.forEach(pos => {
                            ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
                            ctx.beginPath(); ctx.arc(pos * esz, esz * 0.24, esz * 0.035, 0, _P*2); ctx.fill();
                            ctx.fillStyle = '#ffffff';
                            ctx.beginPath(); ctx.arc(pos * esz, esz * 0.24, esz * 0.01, 0, _P*2); ctx.fill();
                        });
                    } else if (ent.type === 'crosser') {
                        // 【🎬 企业号：中速巡航、极度扁平优雅】
                        var facing = ent.vx > 0 ? 1 : -1; ctx.scale(facing, 1);
                        ctx.rotate(-0.03);
                        ctx.lineWidth = 1.2;

                        ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#475569';
                        ctx.fillRect(-esz * 0.55, -esz * 0.14, esz * 0.45, esz * 0.03);
                        ctx.strokeRect(-esz * 0.55, -esz * 0.14, esz * 0.45, esz * 0.03);
                        ctx.fillStyle = '#1e293b';
                        ctx.fillRect(-esz * 0.45, -esz * 0.01, esz * 0.45, esz * 0.035);
                        ctx.strokeRect(-esz * 0.45, -esz * 0.01, esz * 0.45, esz * 0.035);

                        ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
                        ctx.fillRect(-esz * 0.42, -esz * 0.125, esz * 0.28, esz * 0.01);
                        ctx.fillRect(-esz * 0.32, -esz * 0.00, esz * 0.28, esz * 0.012);

                        ctx.fillStyle = '#ef4444';
                        ctx.beginPath(); ctx.arc(-esz * 0.09, -esz * 0.125, esz * 0.016, 0, _P*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(esz * 0.01, 0.008 * esz, esz * 0.018, 0, _P*2); ctx.fill();

                        ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(-0.25 * esz, 0.05 * esz); ctx.lineTo(-0.35 * esz, -0.11 * esz);
                        ctx.moveTo(-0.15 * esz, 0.05 * esz); ctx.lineTo(-0.2 * esz, 0.01 * esz);
                        ctx.moveTo(0.05 * esz, 0.04 * esz); ctx.lineTo(0.18 * esz, -0.03 * esz);
                        ctx.stroke();

                        ctx.fillStyle = '#111827'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.ellipse(-esz * 0.05, esz * 0.05, esz * 0.18, esz * 0.045, 0, 0, _P*2); ctx.fill(); ctx.stroke();

                        ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.ellipse(esz * 0.12, esz * 0.05, esz * 0.01, esz * 0.025, 0, 0, _P*2); ctx.fill();
                        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(esz * 0.12, esz * 0.05, esz * 0.004, 0, _P*2); ctx.fill();

                        var saucerGrad = ctx.createLinearGradient(esz * 0.0, -esz * 0.05, esz * 0.5, -esz * 0.05);
                        saucerGrad.addColorStop(0, '#334155'); saucerGrad.addColorStop(0.4, '#1e293b'); saucerGrad.addColorStop(1, '#0f172a');
                        ctx.fillStyle = saucerGrad; ctx.strokeStyle = '#64748b';
                        ctx.beginPath(); ctx.ellipse(esz * 0.25, -esz * 0.05, esz * 0.3, esz * 0.04, 0, 0, _P*2); ctx.fill(); ctx.stroke();

                        ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.ellipse(esz * 0.25, -esz * 0.08, esz * 0.04, esz * 0.012, 0, 0, _P*2); ctx.fill(); ctx.stroke();
                        ctx.fillStyle = '#38bdf8'; ctx.fillRect(esz * 0.24, -esz * 0.088, esz * 0.03, esz * 0.005);

                    } else if (ent.type === 'overtaker') {
                        // 【🎬 《浩瀚苍穹》硬核科幻：火星 MCRN“钱学森号”战巡 - 埃普斯顿引擎全开】
                        ctx.rotate(_S(t * 0.1) * 0.004); // 重型重力舰体极其沉稳的物理漂移
                        ctx.lineWidth = 1.0;

                        // ==================== 🅰️ 【视觉核心：埃普斯顿磁场聚变推进火炬 (Epstein Drive Torch)】 ====================
                        // 聚变火炬能量极高，呈刺眼的线性长锥形，是《浩瀚苍穹》中横渡太阳系的终极动力
                        var torchGrad = ctx.createLinearGradient(0, esz * 0.28, 0, esz * 2.2);
                        torchGrad.addColorStop(0, '#ffffff');                     // 聚变核心点
                        torchGrad.addColorStop(0.12, 'rgba(34, 211, 238, 0.95)'); // 电光翠蓝高能区
                        torchGrad.addColorStop(0.35, 'rgba(59, 130, 246, 0.45)'); // 磁场约束蓝晕
                        torchGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');       // 深空虚化消散
                        ctx.fillStyle = torchGrad;

                        ctx.beginPath();
                        ctx.moveTo(-esz * 0.08, esz * 0.28);
                        ctx.lineTo(0, esz * 2.3);                                 // 极限拉长的聚变火炬束
                        ctx.lineTo(esz * 0.08, esz * 0.28);
                        ctx.closePath(); ctx.fill();

                        // 磁力喷口爆发导致的镜头炫光感（Lens Flare Effect）
                        var flareGrad = ctx.createRadialGradient(0, esz * 0.28, 0, 0, esz * 0.28, esz * 0.4);
                        flareGrad.addColorStop(0, '#ffffff');
                        flareGrad.addColorStop(0.25, 'rgba(6, 182, 212, 0.55)');
                        flareGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
                        ctx.fillStyle = flareGrad;
                        ctx.beginPath(); ctx.arc(0, esz * 0.28, esz * 0.4, 0, _P*2); ctx.fill();
                        // ===================================================================================

                        // 🅱️ 绘制硬核工业风舰体（非气动“飞行的摩天大楼”模块化布局）
                        // MCRN 军舰标志性的棱角分明的碳基复合装甲，左暗右明拉出3D块状感
                        // 右侧受光面
                        ctx.fillStyle = '#1e2530'; ctx.strokeStyle = '#374151';
                        ctx.beginPath();
                        ctx.moveTo(0, -esz * 0.65);             // 极其平直工业化的平头舰艏
                        ctx.lineTo(esz * 0.13, -esz * 0.48);   // 前部PDC近防炮露台
                        ctx.lineTo(esz * 0.15, esz * 0.28);    // 模块化后部储能舱
                        ctx.lineTo(0, esz * 0.28);             // 龙骨尾端
                        ctx.closePath(); ctx.fill(); ctx.stroke();

                        // 左侧阴影面
                        ctx.fillStyle = '#0b0f17';
                        ctx.beginPath();
                        ctx.moveTo(0, -esz * 0.65);
                        ctx.lineTo(-esz * 0.13, -esz * 0.48);
                        ctx.lineTo(-esz * 0.15, esz * 0.28);
                        ctx.lineTo(0, esz * 0.28);
                        ctx.closePath(); ctx.fill(); ctx.stroke();

                        // 龙骨中轴中线、外部加压加固支撑脊梁
                        ctx.fillStyle = '#111827';
                        ctx.fillRect(-esz * 0.03, -esz * 0.48, esz * 0.06, esz * 0.76);

                        // 🚢 【涂装精髓】：火星共和国海军（MCRN）经典高可见度军事橙高光识别带
                        ctx.fillStyle = '#ea580c';
                        ctx.fillRect(-esz * 0.145, -esz * 0.15, esz * 0.018, esz * 0.25); // 左舷橙色带
                        ctx.fillRect(esz * 0.127, -esz * 0.15, esz * 0.018, esz * 0.25);  // 右舷橙色带
                        ctx.fillRect(-esz * 0.04, -esz * 0.42, esz * 0.08, esz * 0.025);  // 舰桥前端警示涂装

                        // 💡 【硬核细节 1】：动态微型高压 RCS 姿态喷口（RCS Thruster Plumes）
                        // 模拟硬核轨道物理中，飞船由于高速突刺自动触发的姿态微调
                        if (Math.sin(t * 6 + ent.seed) > 0.2) {
                            var rcsGrad = ctx.createLinearGradient(-esz * 0.13, 0, -esz * 0.32, 0);
                            rcsGrad.addColorStop(0, '#ffffff'); rcsGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
                            ctx.strokeStyle = rcsGrad; ctx.lineWidth = 1.5;
                            // 舰艏左侧 RCS 喷射
                            ctx.beginPath(); ctx.moveTo(-esz * 0.13, -esz * 0.45); ctx.lineTo(-esz * 0.32, -esz * 0.46); ctx.stroke();
                            // 舰尾右侧 RCS 喷射
                            ctx.beginPath(); ctx.moveTo(esz * 0.15, esz * 0.12); ctx.lineTo(esz * 0.34, esz * 0.13); ctx.stroke();
                        }

                        // 💡 【硬核细节 2】：工业矩阵舷窗灯火与舰艏红色光学传感器 (PDC Target Locks)
                        ctx.fillStyle = '#ef4444'; // 顶端雷达桅杆撞击红灯
                        ctx.beginPath(); ctx.arc(0, -esz * 0.66, 1.2, 0, _P*2); ctx.fill();

                        ctx.fillStyle = 'rgba(243, 244, 246, 0.85)'; // 密集内藏式生活舱冷白窗光
                        var rSeed = Math.floor(ent.seed * 300);
                        for (var g = 0; g < 12; g++) {
                            var gY = esz * (-0.35 + g * 0.048);
                            var gX = (g % 2 === 0 ? 0.045 : -0.045) * esz;
                            if (((g + rSeed) % 3) !== 0) { // 保持每艘船随机亮灯位置固定
                                ctx.fillRect(gX, gY, 1.0, 1.0);
                            }
                        }

                        // 🔩 磁力约束圈重型尾喷管（Magnetic Nozzle Mechanism）
                        ctx.fillStyle = '#374151';
                        ctx.fillRect(-esz * 0.09, esz * 0.28, esz * 0.18, esz * 0.03);
                    }
                    else if (ent.type === 'ufo') {
                        // 【电影级：黑曜石母舰】
                        ctx.fillStyle = '#090d16'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(-esz * 0.75, 0); ctx.lineTo(-esz * 0.25, -esz * 0.09); ctx.lineTo(esz * 0.25, -esz * 0.09);
                        ctx.lineTo(esz * 0.75, 0); ctx.lineTo(esz * 0.2, esz * 0.07); ctx.lineTo(-esz * 0.2, esz * 0.07);
                        ctx.closePath(); ctx.fill(); ctx.stroke();

                        for (var k = 0; k < 7; k++) {
                            var shift = (t * 4 + k * 0.8) % 2.0 - 1.0;
                            var lx = shift * esz * 0.6; var ly = (1 - Math.abs(shift)) * esz * 0.02;
                            ctx.fillStyle = 'rgba(34, 211, 238, 0.85)'; ctx.fillRect(lx - 1, ly - 1, 2.5, 2.5);
                        }

                        ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)'; ctx.lineWidth = 1.2;
                        for (var j = -3; j <= 3; j++) {
                            ctx.beginPath(); ctx.moveTo(j * esz * 0.05, esz * 0.05); ctx.lineTo(j * esz * 0.11, esz * 0.32); ctx.stroke();
                        }

                    } else if (ent.type === 'silverGalaxy') {
                        // 【🎬 电影级：真·3D物理流体银河系旋涡】
                        var bulgeRadius = esz * 0.16;
                        var coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, bulgeRadius);
                        coreGrad.addColorStop(0, '#ffffff');
                        coreGrad.addColorStop(0.25, 'rgba(224, 242, 254, 1)');
                        coreGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.25)');
                        coreGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
                        ctx.fillStyle = coreGrad;
                        ctx.beginPath(); ctx.arc(0, 0, bulgeRadius, 0, _P*2); ctx.fill();

                        ctx.fillStyle = '#000003'; ctx.beginPath();
                        ctx.arc(0, 0, esz * 0.035, 0, _P*2); ctx.fill();

                        ent.particles.forEach(p => {
                            p.r += p.flowSpeed * CFG.baseSpeed;
                            if (p.r > 1.0) p.r = 0.06;

                            var coreSpin = t * 1.6;
                            if (p.isDebris) { coreSpin *= (1.0 - p.dragLag * 0.25); }

                            var twistDensity = 4.2;
                            var finalAng = coreSpin + p.armOffset + (twistDensity / (p.r + 0.04));

                            var rDist = p.r * esz * 1.45;
                            var x0 = _C(finalAng) * rDist;
                            var y0 = _S(finalAng) * rDist;
                            var z0 = p.isDebris ? (_R() - 0.5) * esz * 0.06 : (_R() - 0.5) * esz * 0.015;

                            var tiltCos = 0.50;
                            var tiltSin = 0.866;

                            var x1 = x0;
                            var y1 = y0 * tiltCos - z0 * tiltSin;
                            var z1 = y0 * tiltSin + z0 * tiltCos;

                            var x2 = x1 * 0.95 + z1 * 0.31;
                            var y2 = y1;
                            var z2 = -x1 * 0.31 + z1 * 0.95;

                            var depthFactor = 1.0 + (z2 / (esz * 1.6));
                            var pSize = Math.max(0.25, p.sz * depthFactor);

                            if (p.isDebris) {
                                ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
                            } else {
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                            }
                            ctx.globalAlpha = Math.max(0.04, Math.min(0.9, p.alpha * depthFactor));

                            ctx.fillRect(x2 - pSize/2, y2 - pSize/2, pSize, pSize);
                        });
                    }

                } finally {
                    ctx.restore();
                }
            }

            ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
            aid = requestAnimationFrame(draw);
        } draw();
    });