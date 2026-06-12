/**
 * 尊享版电影级歌词背景特效系统核心引擎 (Premium Edition)
 * 包含：高精建模、物理光学、全重力椭圆、引力透镜黑洞等核心模块
 */
(function() {
    function EffectRegister(n, fn) { FX[n] = { init: fn }; }

    function start(n) {
        if (!ctx || !c) return;
        var w = c.width, h = c.height;
        if (w < 1 || h < 1) { setTimeout(function() { start(n); }, 150); return; }
        if (FX[n]) FX[n].init(w, h, ctx, c, function() { return cur === n; });
    }

    

        function sizeCanvas() {
            var rect = b.getBoundingClientRect();
            c.width = rect.width || window.innerWidth;
            c.height = rect.height || window.innerHeight;
        }

        function rs() {
            if (!c) return;
            sizeCanvas();
            if (aid) cancelAnimationFrame(aid);
            if (cur !== 'none' && c.width > 0 && c.height > 0) start(cur);
        }

        sizeCanvas();
        window.addEventListener('resize', rs);

        if (s) {
            // 恢复上次保存的特效
            var savedFx = localStorage.getItem('ttplayer-lyric-fx');
            if (savedFx && FX[savedFx]) {
                cur = savedFx;
                s.value = savedFx;
            } else {
                cur = s.value;
            }
            s.addEventListener('change', function(e) {
                cur = e.target.value;
                localStorage.setItem('ttplayer-lyric-fx', cur);
                if (aid) cancelAnimationFrame(aid);
                ctx.clearRect(0, 0, c.width, c.height);
                setTimeout(function() { start(cur); }, 30);
            });
        }
        start(cur);
    });

    var _P = Math.PI, _R = Math.random, _F = Math.floor, _S = Math.sin, _C = Math.cos, _M = Math.max;

    function _fillBg(ctx, w, h, c1, c2) {
        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, c1); g.addColorStop(1, c2);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }

    // ======== [1] 纯白极简 (plainWhite) ========
    EffectRegister('plainWhite', function(w,h,ctx,cv,act) {
        function draw() {
            if(!act()) return;
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
            aid = requestAnimationFrame(draw);
        } draw();
    });

    // ======== [2] 星空穿越 (starField) *星际穿越极速跃迁版 ========
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

                try {
                    ctx.save();
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

                    ctx.restore();
                } catch (e) {
                    ctx.restore();
                }
            }

            ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
            aid = requestAnimationFrame(draw);
        } draw();
    });

    // ======== [3] 月光海岸 (moonlight) ========
    EffectRegister('moonlight', function(w, h, ctx, cv, act) {
        var t = 0;
        var stars = [];

        // 【关键】初始化或重置星星（基于当前画布尺寸）
        function initStars() {
            stars = [];
            for (var i = 0; i < 80; i++) {
                stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h * 0.55,
                    s: 0.6 + Math.random() * 1.4,
                    p: Math.random() * Math.PI * 2,
                    bright: 0.4 + Math.random() * 0.6
                });
            }
        }
        initStars(); // 立即执行一次

        function draw() {
            if (!act()) return; // 特效已切换，停止绘制
            t += 0.012;

            // 1. 夜空渐变背景
            var grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#0a0f1c');
            grad.addColorStop(1, '#18203a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // 2. 闪烁星星
            for (var i = 0; i < stars.length; i++) {
                var s = stars[i];
                var alpha = s.bright * (0.3 + 0.7 * Math.abs(Math.sin(t * 2.2 + s.p)));
                ctx.globalAlpha = Math.min(0.9, alpha);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // ========== 3. 绘制完美圆形月亮（核心修复） ==========
            // 保存当前状态，并【完全重置变换矩阵】，确保 arc 不受任何缩放影响
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换，消除任何潜在变形

            // 注意：重置变换后，坐标系统是相对于 Canvas 物理像素的。
            // 我们需要重新计算月亮在重置后的坐标系中的位置。
            // 此时画布左上角为 (0,0)，右下角为 (w, h)。
            var centerX = w * 0.78;
            var centerY = h * 0.24;
            // 半径缩小，月亮小一点更精致
            var moonRadius = Math.min(w, h) * 0.055;
            moonRadius = Math.min(moonRadius, 60);

            // 月亮外光晕（暖色月光）
            var halo = ctx.createRadialGradient(centerX, centerY, moonRadius * 0.3, centerX, centerY, moonRadius * 1.9);
            halo.addColorStop(0, 'rgba(220, 235, 255, 0.25)');
            halo.addColorStop(0.6, 'rgba(190, 210, 245, 0.06)');
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(centerX, centerY, moonRadius * 2.2, 0, Math.PI * 2);
            ctx.fill();

            // 月球本体（暖色渐变，略带冷调）
            var moonGrad = ctx.createRadialGradient(centerX - moonRadius * 0.22, centerY - moonRadius * 0.18, 2, centerX, centerY, moonRadius);
            moonGrad.addColorStop(0, '#fffef5');
            moonGrad.addColorStop(0.5, '#ede8e0');
            moonGrad.addColorStop(1, '#b8b0a0');
            ctx.fillStyle = moonGrad;
            ctx.beginPath();
            ctx.arc(centerX, centerY, moonRadius, 0, Math.PI * 2);
            ctx.fill();

            // 简单的月面纹理（暗色斑点）
            ctx.fillStyle = 'rgba(130, 145, 165, 0.25)';
            ctx.beginPath();
            ctx.arc(centerX - moonRadius * 0.28, centerY - moonRadius * 0.2, moonRadius * 0.13, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + moonRadius * 0.24, centerY + moonRadius * 0.27, moonRadius * 0.09, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + moonRadius * 0.08, centerY - moonRadius * 0.35, moonRadius * 0.07, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore(); // 恢复绘图状态，后续线条等不受影响

            // ========== 4. 绘制海面与波浪 ==========
            var waterLevel = h * 0.7;
            // 海水底色
            var seaGrad = ctx.createLinearGradient(0, waterLevel, 0, h);
            seaGrad.addColorStop(0, '#0b1328');
            seaGrad.addColorStop(1, '#030612');
            ctx.fillStyle = seaGrad;
            ctx.fillRect(0, waterLevel, w, h - waterLevel);

            // 多层动态波浪
            for (var i = 0; i < 3; i++) {
                ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.03 - i * 0.008) + ')';
                ctx.beginPath();
                ctx.moveTo(0, h);
                for (var x = 0; x <= w; x += 20) {
                    var y = waterLevel + 6 + Math.sin(x * 0.006 + t * 0.5 + i * 1.5) * 14 + i * 10;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(w, h);
                ctx.fill();
            }

            // ========== 5. 绘制月光倒影 ==========
            // 重新获取月亮位置用于倒影（因为上面 save/restore 了，这里直接用之前的计算值）
            var moonCenterX = w * 0.78;
            var moonRadiusVal = Math.min(w, h) * 0.075;
            var finalMoonRadius = Math.min(moonRadiusVal, 85);

            for (var j = 0; j < 35; j++) {
                var depth = j / 35;
                var rx = moonCenterX + Math.sin(t * 0.8 + j * 0.7) * (depth * 45);
                var ry = waterLevel + 8 + depth * (h - waterLevel) * 0.75;
                var rw = (finalMoonRadius * 0.75) * (1 - depth * 0.55);
                ctx.fillStyle = 'rgba(190, 220, 250, ' + (0.3 * (1 - depth)) + ')';
                ctx.fillRect(rx - rw / 2, ry, Math.max(1, rw), 1.5);
            }

            // 6. 请求下一帧
            aid = requestAnimationFrame(draw);
        }

        draw(); // 启动动画
    });

    // ======== [4] 星河流转 (galaxy) *终极优化版 ========
    EffectRegister('galaxy', function(w,h,ctx,cv,act) {
        var t=0, stars=[];
        for(var i=0;i<180;i++) {
            stars.push({
                angle: Math.random()*Math.PI*2,
                r: 40 + Math.random()*w*0.5,
                speed: 0.002 + Math.random()*0.003,
                size: 0.5+Math.random()*1.5,
                c: Math.random()>0.4?'#ffffff':'#a5f3fc'
            });
        }

        // ====================== 尺寸设定 ======================
        // 两艘真实科幻飞船（1/3大小，完全不同造型）
        var ship1 = { x: 0, y: 0, speed: 0, len: 16, dir: 1 };
        var ship2 = { x: 0, y: 0, speed: 0, len: 16, dir: 1 };
        // UFO 放大 20% ✅
        var ufo   = { x: 0, y: 0, speed: 0, r: 9.6, angle: 0 };

        // 随机重生
        function resetShip1() {
            ship1.dir = Math.random() > 0.5 ? 1 : -1;
            ship1.speed = (0.5 + Math.random()*0.4) * ship1.dir;
            ship1.x = ship1.dir === 1 ? -180 : w + 180;
            ship1.y = h*0.15 + Math.random()*h*0.6;
        }
        function resetShip2() {
            ship2.dir = Math.random() > 0.5 ? 1 : -1;
            ship2.speed = (0.6 + Math.random()*0.5) * ship2.dir;
            ship2.x = ship2.dir === 1 ? -200 : w + 200;
            ship2.y = h*0.15 + Math.random()*h*0.6;
        }
        function resetUFO() {
            ufo.speed = -0.7;
            ufo.x = w + 120;
            ufo.y = h*0.25 + Math.random()*h*0.4;
        }

        resetShip1();
        resetShip2();
        resetUFO();

        function draw() {
            if(!act()) return; t += 0.01;
            _fillBg(ctx, w, h, '#020309', '#070a14');

            // 星河背景
            ctx.save(); ctx.translate(w*0.5, h*0.45);
            stars.forEach(s => {
                s.angle += s.speed;
                var sx = Math.cos(s.angle) * s.r;
                var sy = Math.sin(s.angle) * s.r * 0.5;
                ctx.fillStyle = s.c;
                ctx.globalAlpha = 0.3 + 0.7*Math.abs(Math.sin(t + s.r));
                ctx.fillRect(sx, sy, s.size, s.size);
            });
            ctx.restore();
            ctx.globalAlpha = 1;

// ======================================================
// 🚀 飞船 1：重型星际运输舰（厚重、装甲、真实质感）
// ======================================================
            ship1.x += ship1.speed;
            if(ship1.dir === 1 && ship1.x > w + 180) resetShip1();
            if(ship1.dir ===-1 && ship1.x < -180) resetShip1();

            ctx.save();
            ctx.translate(ship1.x, ship1.y);
            if(ship1.dir === -1) ctx.scale(-1, 1);

            // 装甲船体
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(-4, -2.5);
            ctx.lineTo(6, -1.5);
            ctx.lineTo(8, 0);
            ctx.lineTo(6, 1.5);
            ctx.lineTo(-4, 2.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 引擎光效
            var g1 = ctx.createLinearGradient(-8,0,-13,0);
            g1.addColorStop(0,'rgba(56,189,248,0.9)');
            g1.addColorStop(1,'transparent');
            ctx.fillStyle = g1;
            ctx.fillRect(-13, -1.5, 5, 3);

            // 导航灯
            ctx.fillStyle = Math.sin(t*12) > 0 ? '#ef4444' : '#1e293b';
            ctx.beginPath();
            ctx.arc(6,0,1,0,Math.PI*2);
            ctx.fill();
            ctx.restore();

// ======================================================
// ✨ 飞船 2：轻型隐形战斗机（锐利、流线、完全不同）
// ======================================================
            ship2.x += ship2.speed;
            if(ship2.dir === 1 && ship2.x > w + 200) resetShip2();
            if(ship2.dir ===-1 && ship2.x < -200) resetShip2();

            ctx.save();
            ctx.translate(ship2.x, ship2.y);
            if(ship2.dir === -1) ctx.scale(-1, 1);

            // 锐利机身
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(-3, -3);
            ctx.lineTo(7, -1);
            ctx.lineTo(8, 0);
            ctx.lineTo(7, 1);
            ctx.lineTo(-3, 3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 尾焰
            var g2 = ctx.createLinearGradient(-8,0,-14,0);
            g2.addColorStop(0,'rgba(249,115,22,0.85)');
            g2.addColorStop(1,'transparent');
            ctx.fillStyle = g2;
            ctx.fillRect(-14, -1, 6, 2);
            ctx.restore();

// ======================================================
// 👽 UFO：放大20% + 更精致好看（你喜欢的轮廓不动）
// ======================================================
            ufo.x += ufo.speed;
            ufo.angle += 0.02;
            if(ufo.x < -100) resetUFO();

            ctx.save();
            ctx.translate(ufo.x, ufo.y);
            ctx.globalAlpha = 0.45;

            // 金属底盘
            var ufoG = ctx.createLinearGradient(0,-4,0,4);
            ufoG.addColorStop(0,'#7b8da3');
            ufoG.addColorStop(1,'#1e293b');
            ctx.fillStyle = ufoG;
            ctx.beginPath();
            ctx.ellipse(0,0, ufo.r, ufo.r*0.38, 0,0,Math.PI*2);
            ctx.fill();

            // 能量穹顶
            var dome = ctx.createRadialGradient(0,-3.5,0, 0,-3.5,6);
            dome.addColorStop(0,'rgba(0,240,255,0.7)');
            dome.addColorStop(1,'rgba(0,120,255,0.1)');
            ctx.fillStyle = dome;
            ctx.beginPath();
            ctx.arc(0,-3.5,6, Math.PI,0);
            ctx.closePath();
            ctx.fill();

            // 环绕灯
            for(var k=0;k<8;k++){
                var a = ufo.angle + k/8*Math.PI*2;
                var lx = Math.cos(a) * 8.5;
                var ly = Math.sin(a) * 2.2 + 1.2;
                ctx.fillStyle = (Math.floor(t*4)+k)%3 ===0 ? '#38bdf8':'#f43f5e';
                ctx.beginPath();
                ctx.arc(lx,ly, 1,0,Math.PI*2);
                ctx.fill();
            }

            ctx.restore();
            requestAnimationFrame(draw);
        }
        draw();
    });

    // 辅助函数：将十六进制颜色转换为RGB字符串
    function _hexToRgb(hex) {
        var r = parseInt(hex.slice(1,3), 16);
        var g = parseInt(hex.slice(3,5), 16);
        var b = parseInt(hex.slice(5,7), 16);
        return r + ',' + g + ',' + b;
    }


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
    // ======== [6] 冬日雪花 (snow) ========
    EffectRegister('snow', function(w,h,ctx,cv,act) {
        var flakes=[];
        for(var i=0;i<40;i++) flakes.push({x:_R()*w, y:_R()*h, r:3+_R()*5, sp:0.3+_R()*0.5, sw:_R()*5, alpha:0.3+_R()*0.5, type:_F(_R()*2)});
        function drawSnow(ctx, r, type) {
            for(var j=0; j<6; j++){
                ctx.rotate(_P/3); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, -r); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.8; ctx.stroke();
                if(type===1) { ctx.beginPath(); ctx.moveTo(0, -r*0.6); ctx.lineTo(-r*0.2, -r*0.75); ctx.moveTo(0, -r*0.6); ctx.lineTo(r*0.2, -r*0.75); ctx.stroke(); }
            }
        }
        function draw() {
            if(!act()) return;
            _fillBg(ctx, w, h, '#070b12', '#121824');
            for(var i=0;i<flakes.length;i++){
                var f=flakes[i]; f.y += f.sp; f.x += _S(f.y*0.01 + f.sw)*0.2;
                if(f.y > h+10) { f.y=-10; f.x=_R()*w; }
                ctx.save(); ctx.translate(f.x, f.y); ctx.globalAlpha = f.alpha; ctx.rotate(f.y*0.005); drawSnow(ctx, f.r, f.type); ctx.restore();
            }
            ctx.globalAlpha = 1; aid=requestAnimationFrame(draw);
        } draw();
    });

    // ======== [7] 深海世界 (deepSea) *大写实：写实潜艇、头灯潜水员、随机跃动鱼群 ========
// ======== [7] 深海世界 (deepSea) *动画电影风格：温暖明亮·海底总动员氛围========
    // ======== [7] 深海世界 (deepSea) *动画电影风格：超小鱼群·深海蓝调·流畅动作========
    EffectRegister('deepSea', function(w, h, ctx, cv, act) {
        var t = 0;
        var lastTime = 0;

        // ========== 鱼群配置（可自由调节）==========
        var FishConfig = {
            TOTAL_COUNT: 45,                    // 鱼群总数
            SMALL_RATIO: 0.60,                  // 小鱼比例 60%
            MEDIUM_RATIO: 0.20,                // 中鱼比例 20%
            LARGE_RATIO: 0.20,                 // 大鱼比例 20%
            SMALL_SIZE: 0.65,                  // 小鱼大小乘数
            MEDIUM_SIZE: 0.85,                 // 中鱼大小乘数
            LARGE_SIZE: 1.15,                  // 大鱼大小乘数
            CLOWN_RATIO: 0.55,                 // 小丑鱼比例
            // Boid参数（调低防止抖动）
            SEPARATION_DIST: 28,               // 分离距离（增大让鱼更松散）
            ALIGNMENT_DIST: 65,               // 对齐距离
            COHESION_DIST: 90,                // 聚集距离
            SEPARATION_FORCE: 0.06,           // 分离力（降低防抖）
            ALIGNMENT_FORCE: 0.03,            // 对齐力
            COHESION_FORCE: 0.004,            // 聚集力（降低防抖）
            MAX_SPEED: 0.9,                   // 最大速度
            MAX_FORCE: 0.05                   // 最大转向力
        };

        // ========== 1. 波光粼粼的海面（不是直射光柱）==========
        function drawWaterAndGlitter() {
            // 深海渐变
            var waterGrad = ctx.createLinearGradient(0, 0, 0, h);
            waterGrad.addColorStop(0, "#4ab8d8");
            waterGrad.addColorStop(0.3, "#3aa0c0");
            waterGrad.addColorStop(0.6, "#2a80a0");
            waterGrad.addColorStop(0.85, "#1a6080");
            waterGrad.addColorStop(1, "#0a4868");
            ctx.fillStyle = waterGrad;
            ctx.fillRect(0, 0, w, h);

            // 波光粼粼效果（大量闪烁光斑，不是直射光柱）
            ctx.globalCompositeOperation = 'lighter';
            for (var i = 0; i < 80; i++) {
                var x = (i * 73 + t * 45) % (w + 150) - 75;
                var y = 15 + Math.sin(i * 0.5 + t * 4) * 12 + Math.cos(i * 0.3) * 8;
                var size = 2 + Math.sin(i * 0.8 + t * 6) * 1.5;
                var alpha = 0.08 + Math.sin(i * 0.6 + t * 5) * 0.06;
                ctx.fillStyle = "rgba(255, 245, 200, " + alpha + ")";
                ctx.beginPath();
                ctx.ellipse(x, y, size, size * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // 第二层细碎光斑
            for (var i = 0; i < 120; i++) {
                var x = (i * 131 + t * 28) % (w + 200) - 100;
                var y = 25 + Math.sin(i * 0.8 + t * 3.5) * 15;
                ctx.fillStyle = "rgba(255, 255, 210, 0.06)";
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        // ========== 2. 漂浮粒子 ==========
        var particles = [];
        function initParticles() {
            particles = [];
            for (var i = 0; i < 180; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.05,
                    vy: (Math.random() - 0.5) * 0.03 - 0.01,
                    size: 0.5 + Math.random() * 1.2,
                    alpha: 0.04 + Math.random() * 0.1,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
        function drawParticles() {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                if (p.x > w + 30) p.x = -20;
                if (p.x < -30) p.x = w + 20;
                if (p.y > h + 30) p.y = -20;
                if (p.y < -30) p.y = h + 20;
                var flicker = 0.6 + 0.4 * Math.sin(t * 1.5 + p.phase);
                ctx.fillStyle = "rgba(180, 210, 240, " + (p.alpha * flicker) + ")";
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.6 * flicker, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // ========== 3. 气泡 ==========
        var bubbles = [];
        function initBubbles() {
            bubbles = [];
            for (var i = 0; i < 40; i++) {
                bubbles.push({
                    x: Math.random() * w,
                    y: h - Math.random() * 80,
                    size: 1 + Math.random() * 2.5,
                    vy: -0.15 - Math.random() * 0.25,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: 0.3 + Math.random() * 0.6
                });
            }
        }
        function drawBubbles() {
            for (var i = 0; i < bubbles.length; i++) {
                var b = bubbles[i];
                b.y += b.vy;
                b.x += Math.sin(t * b.wobbleSpeed + b.wobble) * 0.15;
                if (b.y < 10) {
                    b.y = h - 20;
                    b.x = Math.random() * w;
                }
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(180, 210, 240, 0.4)";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(220, 235, 255, 0.6)";
                ctx.fill();
            }
        }

        // ========== 4. 高挑海草（数量少但高）==========
        var seaweeds = [];
        function Seaweed(x, baseY, height, color) {
            this.x = x;
            this.baseY = baseY;
            this.height = height;
            this.color = color;
            this.phase = Math.random() * Math.PI * 2;
            this.freq = 0.7 + Math.random() * 0.5;
        }
        Seaweed.prototype.draw = function(ctx, time) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, this.baseY);
            var steps = 20;
            var segH = this.height / steps;
            for (var i = 1; i <= steps; i++) {
                var r = i / steps;
                var y = this.baseY - r * this.height;
                var offsetX = 5 * Math.sin(time * this.freq + this.phase + r * Math.PI * 2);
                var cp1x = this.x + offsetX * 0.35;
                var cp1y = y + segH * 0.35;
                var cp2x = this.x + offsetX * 0.7;
                var cp2y = y + segH * 0.7;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, this.x + offsetX, y);
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.stroke();
            ctx.restore();
        };

        // ========== 5. 鱼群（大小可配置，不抖动）==========
        var fishSchool = [];

        function getFishSize() {
            var rand = Math.random();
            if (rand < FishConfig.SMALL_RATIO) return FishConfig.SMALL_SIZE;
            if (rand < FishConfig.SMALL_RATIO + FishConfig.MEDIUM_RATIO) return FishConfig.MEDIUM_SIZE;
            return FishConfig.LARGE_SIZE;
        }

        function MiniFish(x, y, vx, vy, type) {
            this.x = x;
            this.y = y;
            this.vx = (vx === undefined || vx === 0) ? 0.5 : vx;
            this.vy = (vy === undefined) ? 0 : vy;
            this.type = type || (Math.random() < FishConfig.CLOWN_RATIO ? "clown" : "yellow");
            this.tailPhase = Math.random() * Math.PI * 2;
            this.bodyWave = Math.random() * Math.PI * 2;
            this.waveSpeed = 3 + Math.random() * 3;
            this.size = getFishSize();
        }

        MiniFish.prototype.update = function(fishList, delta, w, h) {
            var ax = 0, ay = 0;
            var neighborCount = 0;
            var centerX = 0, centerY = 0;
            var avgVx = 0, avgVy = 0;

            for (var i = 0; i < fishList.length; i++) {
                var other = fishList[i];
                if (other === this) continue;

                var dx = this.x - other.x;
                var dy = this.y - other.y;
                var dist = Math.hypot(dx, dy);

                if (dist < FishConfig.SEPARATION_DIST && dist > 0.01) {
                    ax += (dx / dist) * FishConfig.SEPARATION_FORCE;
                    ay += (dy / dist) * FishConfig.SEPARATION_FORCE;
                }

                if (dist < FishConfig.ALIGNMENT_DIST) {
                    avgVx += other.vx;
                    avgVy += other.vy;
                    centerX += other.x;
                    centerY += other.y;
                    neighborCount++;
                }
            }

            if (neighborCount > 0) {
                avgVx /= neighborCount;
                avgVy /= neighborCount;
                ax += (avgVx - this.vx) * FishConfig.ALIGNMENT_FORCE;
                ay += (avgVy - this.vy) * FishConfig.ALIGNMENT_FORCE;

                centerX /= neighborCount;
                centerY /= neighborCount;
                var towardX = centerX - this.x;
                var towardY = centerY - this.y;
                var distToCenter = Math.hypot(towardX, towardY);
                if (distToCenter > 0.01) {
                    ax += (towardX / distToCenter) * FishConfig.COHESION_FORCE;
                    ay += (towardY / distToCenter) * FishConfig.COHESION_FORCE;
                }
            }

            var forceMag = Math.hypot(ax, ay);
            if (forceMag > FishConfig.MAX_FORCE) {
                ax = ax / forceMag * FishConfig.MAX_FORCE;
                ay = ay / forceMag * FishConfig.MAX_FORCE;
            }

            this.vx += ax;
            this.vy += ay;

            var speed = Math.hypot(this.vx, this.vy);
            if (speed > FishConfig.MAX_SPEED) {
                this.vx = this.vx / speed * FishConfig.MAX_SPEED;
                this.vy = this.vy / speed * FishConfig.MAX_SPEED;
            }
            if (speed < 0.2 && neighborCount > 3) {
                this.vx += (Math.random() - 0.5) * 0.02;
                this.vy += (Math.random() - 0.5) * 0.01;
            }

            this.x += this.vx * delta * 30;
            this.y += this.vy * delta * 30;
            this.bodyWave += this.waveSpeed * delta;

            // 边界环绕
            if (this.x > w + 40) this.x = -30;
            if (this.x < -40) this.x = w + 30;
            if (this.y > h - 45) this.y = h - 50;
            if (this.y < 75) this.y = 80;

            this.tailPhase += 8 * delta;
        };

        MiniFish.prototype.draw = function(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            var dir = this.vx > 0 ? 1 : -1;
            ctx.scale(dir, 1);
            var waveOffset = Math.sin(this.bodyWave) * 0.4;
            var s = this.size;

            if (this.type === "clown") {
                ctx.fillStyle = "#ff7800";
                ctx.beginPath();
                ctx.ellipse((0 + waveOffset * 0.2) * s, 0, 6.5 * s, 3.8 * s, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.ellipse((-1.5 + waveOffset * 0.15) * s, 0, 1.6 * s, 3 * s, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse((2 + waveOffset * 0.1) * s, 0, 1.3 * s, 2.6 * s, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = "#ffcc44";
                ctx.beginPath();
                ctx.ellipse((0 + waveOffset * 0.2) * s, 0, 6 * s, 3.5 * s, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffaa22";
                ctx.beginPath();
                ctx.ellipse((0 + waveOffset * 0.15) * s, -1.5 * s, 2.5 * s, 2 * s, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc((2.8 + waveOffset * 0.12) * s, -1.2 * s, 1.1 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#222222";
            ctx.beginPath();
            ctx.arc((3.1 + waveOffset * 0.12) * s, -1.4 * s, 0.6 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc((3.3 + waveOffset * 0.12) * s, -1.7 * s, 0.25 * s, 0, Math.PI * 2);
            ctx.fill();

            var tailAng = Math.sin(this.tailPhase) * 0.5;
            ctx.save();
            ctx.translate((-5.5 + waveOffset * 0.1) * s, 0);
            ctx.rotate(tailAng);
            ctx.fillStyle = this.type === "clown" ? "#ff7800" : "#ffcc44";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-3 * s, -2 * s);
            ctx.lineTo(-1.5 * s, 0);
            ctx.lineTo(-3 * s, 2 * s);
            ctx.fill();
            ctx.restore();
            ctx.restore();
        };

        // ========== 重新加载鱼群 ==========
        function initFish() {
            fishSchool = [];
            for (var i = 0; i < FishConfig.TOTAL_COUNT; i++) {
                var x = 50 + Math.random() * (w - 100);
                var y = 100 + Math.random() * (h - 180);
                var angle = Math.random() * Math.PI * 2;
                var speed = 0.35 + Math.random() * 0.5;
                fishSchool.push(new MiniFish(
                    x, y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed * 0.3,
                    null
                ));
            }
        }

        // ========== 6. 呆萌鲨鱼 ==========
        var shark = { x: w * 0.7, y: h * 0.55, vx: -0.25, vy: 0 };
        SharkBehavior = {
            update: function(delta, w, h) {
                this.x += this.vx * delta * 12;
                if (this.x < -100) this.x = w + 90;
                if (this.x > w + 110) this.x = -90;
                this.y += Math.sin(t * 0.18) * 0.25 * delta * 10;
                this.y = Math.min(h - 60, Math.max(90, this.y));
            },
            draw: function(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                var dir = this.vx > 0 ? 1 : -1;
                ctx.scale(dir, 1);
                ctx.fillStyle = "#6a8aaa";
                ctx.beginPath();
                ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#8aaac8";
                ctx.beginPath();
                ctx.ellipse(0, -1.5, 19, 6.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#b8d0e0";
                ctx.beginPath();
                ctx.ellipse(0, 2.5, 18, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(13, -2.5, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#4a6a8a";
                ctx.beginPath();
                ctx.arc(14, -3, 1.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(15, -3.8, 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(10, 1, 3.8, 0.1, Math.PI - 0.1);
                ctx.strokeStyle = "#5a7a9a";
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.fillStyle = "#6a8aaa";
                ctx.beginPath();
                ctx.moveTo(2, -8);
                ctx.lineTo(7, -11);
                ctx.lineTo(12, -7);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-20, 0);
                ctx.lineTo(-24, -3);
                ctx.lineTo(-22, 0);
                ctx.lineTo(-24, 3);
                ctx.fill();
                ctx.restore();
            }
        };
        Object.setPrototypeOf(shark, SharkBehavior);

        // ========== 7. 梦幻鲸鱼 ==========
        var whale = {
            active: false,
            x: -200,
            y: h * 0.4,
            vx: 0.45,
            timer: 0,
            interval: 35,
            rainbowTimer: 0
        };
        WhaleBehavior = {
            update: function(delta, w, h) {
                if (!this.active) {
                    this.timer += delta;
                    if (this.timer >= this.interval) {
                        this.active = true;
                        this.timer = 0;
                        this.x = -150;
                        this.y = h * 0.38 + Math.random() * 15;
                    }
                } else {
                    this.x += this.vx * delta * 18;
                    this.y += Math.sin(t * 0.24) * 0.25 * delta * 8;
                    this.rainbowTimer += delta;
                    if (this.rainbowTimer > 0.12) this.rainbowTimer = 0;
                    if (this.x > w + 180) this.active = false;
                }
            },
            draw: function(ctx) {
                if (!this.active) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.fillStyle = "#a898d8";
                ctx.beginPath();
                ctx.ellipse(0, 0, 55, 21, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#c8b8e8";
                ctx.beginPath();
                ctx.ellipse(0, -2.5, 50, 16, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#e0d8f8";
                ctx.beginPath();
                ctx.ellipse(0, 5, 45, 11, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(38, -5, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#6a5a8a";
                ctx.beginPath();
                ctx.arc(39.5, -6, 1.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(33, 0.5, 5, 0.1, Math.PI - 0.1);
                ctx.strokeStyle = "#8a7aaa";
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.fillStyle = "#b8a8d8";
                ctx.beginPath();
                ctx.moveTo(22, 5);
                ctx.quadraticCurveTo(34, 14, 42, 10);
                ctx.lineTo(30, 3);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-52, 0);
                ctx.quadraticCurveTo(-59, -8, -62, -5);
                ctx.lineTo(-57, 0);
                ctx.lineTo(-62, 5);
                ctx.quadraticCurveTo(-59, 8, -52, 0);
                ctx.fill();
                if (this.rainbowTimer < 0.1) {
                    for (var r = 0; r < 4; r++) {
                        ctx.fillStyle = ["#ff8888", "#ffbb88", "#ffee88", "#88ff88"][r];
                        ctx.beginPath();
                        ctx.ellipse(42 + r * 2 - this.rainbowTimer * 14, -18 - r * 2, 2 - r * 0.3, 1.5 - r * 0.2, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }
        };
        Object.setPrototypeOf(whale, WhaleBehavior);

        // ========== 8. 糖果水母 ==========
        var jellyfishList = [];
        function CandyJellyfish(x, y, size) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.15 - 0.06;
            this.pulse = Math.random() * Math.PI * 2;
            this.tentaclePhase = Math.random() * Math.PI * 2;
        }
        CandyJellyfish.prototype.update = function(delta, w, h) {
            this.pulse += delta * 1.4;
            var contract = 0.75 + 0.25 * Math.sin(this.pulse);
            var speedMult = 0.85 + contract * 0.4;
            this.x += this.vx * delta * 9 * speedMult;
            this.y += this.vy * delta * 7 * speedMult;
            if (this.x < 20) this.x = 25;
            if (this.x > w - 20) this.x = w - 25;
            if (this.y < 40) this.y = 45;
            if (this.y > h - 65) this.y = h - 70;
            this.tentaclePhase += delta * 0.9;
        };
        CandyJellyfish.prototype.draw = function(ctx, time) {
            ctx.save();
            var contract = 0.75 + 0.25 * Math.sin(this.pulse);
            var r = this.size * 0.45 * contract;
            ctx.shadowBlur = 6;
            ctx.shadowColor = "rgba(200, 100, 180, 0.2)";
            var grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
            grad.addColorStop(0, "#ff88cc");
            grad.addColorStop(0.7, "#ff66aa");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, r, r * 0.48, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(255, 200, 220, 0.45)";
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, r * 0.28, r * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 0.7;
            for (var i = 0; i < 7; i++) {
                var ang = (i / 7) * Math.PI * 2;
                var offX = Math.cos(ang) * r * 0.6;
                var offY = Math.sin(ang) * r * 0.38;
                var len = 10 + Math.sin(time * 1.2 + this.tentaclePhase + i) * 3.5;
                var hue = (i * 50 + time * 45) % 360;
                ctx.beginPath();
                ctx.moveTo(this.x + offX, this.y + offY);
                ctx.quadraticCurveTo(
                    this.x + offX * 1.05 + Math.sin(time * 0.9 + i) * 1,
                    this.y + offY + len * 0.5,
                    this.x + offX * 0.85,
                    this.y + offY + len
                );
                ctx.strokeStyle = "hsl(" + hue + ", 70%, 58%)";
                ctx.stroke();
            }
            ctx.restore();
        };

        // ========== 精美版海龟 ==========
        var seaTurtle = {
            x: w * 0.7,
            y: h * 0.48,
            vx: -0.22,
            legPhase: 0,
            headBob: 0
        };

        TurtleBehavior = {
            update: function(delta, w, h) {
                this.x += this.vx * delta * 12;
                if (this.x < -120) this.x = w + 110;
                if (this.x > w + 130) this.x = -110;
                this.y = h * 0.5 + Math.sin(t * 0.2) * 2.5;
                this.legPhase += 1.2 * delta;
                this.headBob += 1.5 * delta;
            },
            draw: function(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                var dir = this.vx > 0 ? 1 : -1;
                ctx.scale(dir, 1);

                // === 1. 龟壳阴影 ===
                ctx.shadowBlur = 8;
                ctx.shadowColor = "rgba(0,0,0,0.2)";

                // === 2. 龟壳主体（立体渐变）===
                var shellGrad = ctx.createLinearGradient(-15, -15, 15, 10);
                shellGrad.addColorStop(0, "#7acc7a");
                shellGrad.addColorStop(0.5, "#5ab85a");
                shellGrad.addColorStop(1, "#3a9840");
                ctx.fillStyle = shellGrad;
                ctx.beginPath();
                ctx.ellipse(0, 0, 34, 26, 0, 0, Math.PI * 2);
                ctx.fill();

                // === 3. 龟壳高光（立体感）===
                ctx.fillStyle = "rgba(150, 220, 150, 0.5)";
                ctx.beginPath();
                ctx.ellipse(-6, -6, 18, 12, 0, 0, Math.PI * 2);
                ctx.fill();

                // === 4. 龟壳精致花纹 ===
                ctx.strokeStyle = "#2a7830";
                ctx.lineWidth = 1.2;
                ctx.shadowBlur = 2;

                // 中央主脊
                ctx.beginPath();
                ctx.moveTo(0, -18);
                ctx.quadraticCurveTo(0, 0, 0, 18);
                ctx.stroke();

                // 放射状花纹
                for (var i = 0; i < 10; i++) {
                    var angle = -Math.PI / 2 + (i / 10) * Math.PI;
                    var x1 = Math.cos(angle) * 8;
                    var y1 = Math.sin(angle) * 10;
                    var x2 = Math.cos(angle) * 18;
                    var y2 = Math.sin(angle) * 16;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }

                // 边缘小圆点装饰
                ctx.fillStyle = "#3a9840";
                for (var i = 0; i < 16; i++) {
                    var angle = (i / 16) * Math.PI * 2;
                    var x = Math.cos(angle) * 30;
                    var y = Math.sin(angle) * 22;
                    ctx.beginPath();
                    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // === 5. 头部（精致立体）===
                var headYaw = Math.sin(this.headBob) * 1.5;
                ctx.fillStyle = "#5aae5a";
                ctx.beginPath();
                ctx.ellipse(34 + headYaw * 0.3, -3 + Math.sin(this.headBob) * 1, 13, 11, 0.15, 0, Math.PI * 2);
                ctx.fill();

                // 头部高光
                ctx.fillStyle = "#7acc7a";
                ctx.beginPath();
                ctx.ellipse(36 + headYaw * 0.2, -6, 5, 4, 0, 0, Math.PI * 2);
                ctx.fill();

                // 头部斑点
                ctx.fillStyle = "#3a8830";
                for (var i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.arc(30 + i * 2 + headYaw * 0.2, -1, 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }

                // === 6. 大眼睛（精致有神）===
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(40 + headYaw * 0.2, -6.5, 3.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#1a2a1a";
                ctx.beginPath();
                ctx.arc(41 + headYaw * 0.15, -7, 1.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(42 + headYaw * 0.1, -8, 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(40, -5.5, 0.5, 0, Math.PI * 2);
                ctx.fill();

                // 眼睑线条
                ctx.beginPath();
                ctx.ellipse(41 + headYaw * 0.15, -7.5, 2, 1.2, 0.1, 0, Math.PI * 2);
                ctx.strokeStyle = "#3a7830";
                ctx.lineWidth = 0.6;
                ctx.stroke();

                // === 7. 精致嘴巴 ===
                ctx.beginPath();
                ctx.moveTo(44 + headYaw * 0.2, -3);
                ctx.quadraticCurveTo(47 + headYaw * 0.2, -4.5, 48 + headYaw * 0.2, -2.5);
                ctx.strokeStyle = "#2a6830";
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // 微笑弧度
                ctx.beginPath();
                ctx.arc(39 + headYaw * 0.15, -1, 4, 0.05, Math.PI - 0.15);
                ctx.stroke();

                // 鼻孔
                ctx.fillStyle = "#2a6830";
                ctx.beginPath();
                ctx.arc(44 + headYaw * 0.2, -8.5, 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(46 + headYaw * 0.2, -8.5, 0.7, 0, Math.PI * 2);
                ctx.fill();

                // === 8. 前腿（精致桨状）===
                var legAngle = Math.sin(this.legPhase) * 0.45;
                ctx.shadowBlur = 3;

                ctx.save();
                ctx.translate(18, 14);
                ctx.rotate(legAngle);
                ctx.fillStyle = "#5aae5a";
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(7, -6, 16, -3);
                ctx.lineTo(14, 2);
                ctx.quadraticCurveTo(6, 1, 0, 2);
                ctx.fill();
                // 前腿纹路
                ctx.strokeStyle = "#3a8830";
                ctx.lineWidth = 0.6;
                for (var i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(6 + i * 3, -1);
                    ctx.lineTo(5 + i * 3, 1);
                    ctx.stroke();
                }
                ctx.restore();

                // === 9. 后腿 ===
                ctx.save();
                ctx.translate(-16, 15);
                ctx.rotate(-legAngle * 0.6);
                ctx.fillStyle = "#5aae5a";
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(6, -4, 13, -1);
                ctx.lineTo(11, 3);
                ctx.quadraticCurveTo(4, 2, 0, 2);
                ctx.fill();
                ctx.restore();

                // === 10. 精致尾巴 ===
                ctx.fillStyle = "#4a9e4a";
                ctx.beginPath();
                ctx.moveTo(-32, 2);
                ctx.quadraticCurveTo(-38, 0, -36, 5);
                ctx.quadraticCurveTo(-34, 4, -32, 3);
                ctx.fill();

                // === 11. 龟壳边缘金色镶边 ===
                ctx.beginPath();
                ctx.ellipse(0, 0, 34, 26, 0, 0, Math.PI * 2);
                ctx.strokeStyle = "#d4aa50";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // 边缘内侧细线
                ctx.beginPath();
                ctx.ellipse(0, 0, 31, 23, 0, 0, Math.PI * 2);
                ctx.strokeStyle = "#c49840";
                ctx.lineWidth = 0.8;
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.restore();
            }
        };
        Object.setPrototypeOf(seaTurtle, TurtleBehavior);
        // ========== 10. 玩具潜艇 ==========
        var submarine = {
            x: w * 0.3,
            y: h * 0.6,
            vx: 0.4,
            active: true
        };
        SubmarineBehavior = {
            update: function(delta, w, h) {
                this.x += this.vx * delta * 13;
                if (this.x > w + 100) this.x = -90;
                if (this.x < -100) this.x = w + 90;
                this.y += Math.sin(t * 0.16) * 0.25 * delta * 9;
            },
            draw: function(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                var dir = this.vx > 0 ? 1 : -1;
                ctx.scale(dir, 1);
                ctx.fillStyle = "#ffcc44";
                ctx.beginPath();
                ctx.ellipse(0, 0, 40, 9, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffaa22";
                ctx.beginPath();
                ctx.ellipse(0, -1, 36, 7, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ff5555";
                ctx.fillRect(-22, -1.8, 44, 3.8);
                ctx.fillStyle = "#ff8888";
                ctx.beginPath();
                ctx.moveTo(-8, -5);
                ctx.lineTo(-5, -12);
                ctx.lineTo(5, -12);
                ctx.lineTo(8, -5);
                ctx.fill();
                for (var i = 0; i < 4; i++) {
                    ctx.fillStyle = "#88ccff";
                    ctx.beginPath();
                    ctx.arc(-10 + i * 8, -1, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = "#ffffff";
                    ctx.beginPath();
                    ctx.arc(-10.5 + i * 8, -1.8, 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = "#ffaa66";
                ctx.beginPath();
                ctx.ellipse(40, 0, 4.5, 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = "rgba(255, 200, 100, 0.25)";
                ctx.beginPath();
                ctx.arc(42, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                ctx.globalCompositeOperation = 'source-over';
            }
        };
        Object.setPrototypeOf(submarine, SubmarineBehavior);

        // ========== 11. 海底地形 ==========
        function drawSeafloor() {
            ctx.fillStyle = "#c8a868";
            ctx.beginPath();
            ctx.moveTo(0, h - 22);
            for (var x = 0; x <= w; x += 25) {
                var y = h - 22 + Math.sin(x * 0.008 + t * 0.08) * 2;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.fill();

            for (var i = 0; i < 50; i++) {
                ctx.fillStyle = "rgba(200, 180, 100, 0.25)";
                ctx.beginPath();
                ctx.arc((i * 35) % w, h - 14 + Math.sin(i) * 1.5, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ========== 12. 柔和雾效 ==========
        function drawSoftFog() {
            var fogGrad = ctx.createLinearGradient(0, 0, 0, h);
            fogGrad.addColorStop(0, "rgba(100, 150, 180, 0)");
            fogGrad.addColorStop(0.5, "rgba(80, 120, 150, 0.03)");
            fogGrad.addColorStop(1, "rgba(60, 100, 130, 0.06)");
            ctx.fillStyle = fogGrad;
            ctx.fillRect(0, 0, w, h);
        }

        // ========== 13. 初始化 ==========
        function initSeaweed() {
            seaweeds = [];
            for (var i = 0; i < 28; i++) {
                var x = 10 + i * 25 + Math.random() * 15;
                if (x > w - 20) break;
                var hVal = 55 + Math.random() * 35;
                var greenVal = 50 + Math.random() * 25;
                seaweeds.push(new Seaweed(x, h - 18, hVal, "rgb(45, " + greenVal + ", 50)"));
            }
        }

        function initJellyfish() {
            jellyfishList = [];
            for (var i = 0; i < 8; i++) {
                jellyfishList.push(new CandyJellyfish(
                    Math.random() * w,
                    60 + Math.random() * (h - 140),
                    10 + Math.random() * 8
                ));
            }
        }

        function init() {
            initSeaweed();
            initFish();
            initJellyfish();
            initParticles();
            initBubbles();
            shark.x = w * 0.75;
            submarine.x = w * 0.3;
            seaTurtle.x = w * 0.75;
            whale.active = false;
            whale.timer = 0;
        }

        // 监听配置变化重新加载鱼群
        var lastTotalCount = FishConfig.TOTAL_COUNT;

        // ========== 14. 主循环 ==========
        function draw() {
            if (!act()) return;
            var now = performance.now();
            if (!lastTime) lastTime = now;
            var delta = Math.min(0.033, (now - lastTime) / 1000);
            lastTime = now;
            t += delta;

            // 检测鱼群数量变化并重新加载
            if (FishConfig.TOTAL_COUNT !== lastTotalCount) {
                lastTotalCount = FishConfig.TOTAL_COUNT;
                initFish();
            }

            drawWaterAndGlitter();

            for (var i = 0; i < seaweeds.length; i++) seaweeds[i].draw(ctx, t);

            drawSeafloor();

            shark.update(delta, w, h);
            whale.update(delta, w, h);
            submarine.update(delta, w, h);
            seaTurtle.update(delta, w, h);
            for (var i = 0; i < fishSchool.length; i++) fishSchool[i].update(fishSchool, delta, w, h);
            for (var i = 0; i < jellyfishList.length; i++) jellyfishList[i].update(delta, w, h);

            whale.draw(ctx);

            fishSchool.sort(function(a, b) { return a.y - b.y; });
            for (var i = 0; i < fishSchool.length; i++) fishSchool[i].draw(ctx);

            shark.draw(ctx);

            for (var i = 0; i < jellyfishList.length; i++) jellyfishList[i].draw(ctx, t);

            seaTurtle.draw(ctx);
            submarine.draw(ctx);

            drawBubbles();
            drawParticles();
            drawSoftFog();

            requestAnimationFrame(draw);
        }

        init();
        draw();

        var resizeHandler = function() {
            setTimeout(function() { if (act()) init(); }, 100);
        };
        window.addEventListener('resize', resizeHandler);

        return function() { window.removeEventListener('resize', resizeHandler); };
    });


    // ======== [8] 落英缤纷 (sakura) ========
    EffectRegister('sakura', function(w,h,ctx,cv,act) {
        var petals = [];
        for(var i=0;i<18;i++) petals.push({x:_R()*w, y:_R()*h, r:5+_R()*4, sp:0.15+_R()*0.1, swing:_R()*5, p:_R()*_P, rotSp:(_R()-0.5)*0.015});
        function drawLeaf(ctx, r) {
            ctx.beginPath(); ctx.moveTo(0, r);
            ctx.bezierCurveTo(-r*0.9, r*0.3, -r*1.0, -r*0.4, -r*0.4, -r*0.9); ctx.lineTo(0, -r*0.55); ctx.lineTo(r*0.4, -r*0.9);
            ctx.bezierCurveTo(r*1.0, -r*0.4, r*0.9, r*0.3, 0, r); ctx.closePath();
            var g = ctx.createLinearGradient(0, r, 0, -r); g.addColorStop(0, '#ffe5ec'); g.addColorStop(0.7, '#ffb3c6'); g.addColorStop(1, '#ff8fa3');
            ctx.fillStyle = g; ctx.fill();
        }
        function draw() {
            if(!act()) return;
            _fillBg(ctx, w, h, '#140d11', '#080406');
            petals.forEach(p => {
                p.y += p.sp; p.x += _S(p.y*0.01 + p.swing)*0.15; p.p += p.rotSp;
                if(p.y > h+12) { p.y=-12; p.x=_R()*w; }
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.p); ctx.scale(_C(p.p*0.5), 1); ctx.globalAlpha = 0.45; drawLeaf(ctx, p.r); ctx.restore();
            });
            aid=requestAnimationFrame(draw);
        } draw();
    });

    // ======== [9] 暖阳和风 (sunny) ========
    EffectRegister('sunny', function(w,h,ctx,cv,act) {
        var t = 0, items = Array.from({length: 12}, () => ({ x: _R()*w, y: _R()*h, r: 2+_R()*3, sp: 0.15+_R()*0.15, p: _R()*_P }));
        function draw() {
            if(!act()) return; t += 0.005;
            _fillBg(ctx, w, h, '#1c140e', '#0f0a06');
            ctx.globalCompositeOperation = 'lighter';
            var bgG = ctx.createRadialGradient(w*0.1, 0, 10, w*0.1, 0, w*0.7);
            bgG.addColorStop(0, 'rgba(245, 170, 90, 0.15)'); bgG.addColorStop(1, 'transparent');
            ctx.fillStyle = bgG; ctx.fillRect(0,0,w,h);
            ctx.fillStyle = 'rgba(250, 215, 150, 0.3)';
            items.forEach(d => {
                d.y -= d.sp; d.x += _S(t + d.p)*0.2; if(d.y < -10) { d.y = h+10; d.x = _R()*w; }
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, _P*2); ctx.fill();
            });
            ctx.globalCompositeOperation = 'source-over'; aid = requestAnimationFrame(draw);
        } draw();
    });

    // ======== 🆕 [10] 鸿蒙黑洞 (blackHole) *视觉震撼：引力透镜动态流动扭曲 ========
    EffectRegister('blackHole', function(w, h, ctx, cv, act) {
        var t = 0;
        var cx = w * 0.5;
        var cy = h * 0.5;

        // 鸿蒙黑洞配置
        var config = {
            coreRadius: 28,
            spiralStartRadius: 140,
            spiralEndRadius: 32,
            particleCount: 120,
            lineWidth: 2.5,
            flowSpeed: 0.8
        };

        // 粒子系统
        var particles = [];

        // 鸿蒙风格弧线参数（右半圆 + 螺旋延伸）
        function getSpiralPoint(progress) {
            // progress: 0 = 外缘起点, 1 = 黑洞中心
            // 右半圆螺旋：角度从 -PI/2 到 PI/2，半径递减
            var angleStart = -Math.PI / 2;
            var angleEnd = Math.PI / 2;
            var angle = angleStart + (angleEnd - angleStart) * (1 - progress);

            var radius = config.spiralStartRadius * (1 - progress) + config.spiralEndRadius * progress;
            // 压扁效果，更优雅
            var yScale = 0.45;

            var x = cx + Math.cos(angle) * radius;
            var y = cy + Math.sin(angle) * radius * yScale;

            return { x: x, y: y, angle: angle, radius: radius };
        }

        // 初始化粒子
        function initParticles() {
            particles = [];
            for (var i = 0; i < config.particleCount; i++) {
                particles.push({
                    progress: Math.random(),  // 0-1 位置
                    speed: config.flowSpeed * (0.5 + Math.random() * 0.8),
                    size: 1.5 + Math.random() * 2.5,
                    alpha: 0.5 + Math.random() * 0.4
                });
            }
        }

        // 更新粒子（向中心流动）
        function updateParticles(delta) {
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.progress += p.speed * delta * 0.5;
                if (p.progress >= 1) {
                    p.progress = 0;
                    // 重置时稍微随机化速度
                    p.speed = config.flowSpeed * (0.5 + Math.random() * 0.8);
                }
            }
        }

        // 绘制背景
        function drawBackground() {
            var grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "#0a0a18");
            grad.addColorStop(1, "#040408");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        // 绘制丝滑螺旋曲线（鸿蒙风格）
        function drawSpiralLine() {
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#0088ff";
            ctx.globalCompositeOperation = 'lighter';

            // 主曲线
            ctx.beginPath();
            var steps = 200;
            for (var i = 0; i <= steps; i++) {
                var progress = i / steps;
                var point = getSpiralPoint(progress);
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            }

            // 曲线渐变（外缘蓝紫 -> 内缘橙红）
            var lineGrad = ctx.createLinearGradient(
                cx - 80, cy - 20,
                cx + 20, cy + 10
            );
            lineGrad.addColorStop(0, "#4488ff");
            lineGrad.addColorStop(0.5, "#aa44ff");
            lineGrad.addColorStop(1, "#ff8844");
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = config.lineWidth;
            ctx.stroke();

            // 内层光晕
            ctx.beginPath();
            for (var i = 0; i <= steps; i++) {
                var progress = i / steps;
                var point = getSpiralPoint(progress);
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            }
            ctx.strokeStyle = "rgba(100, 200, 255, 0.3)";
            ctx.lineWidth = config.lineWidth * 1.5;
            ctx.stroke();

            ctx.restore();
        }

        // 绘制流动粒子
        function drawParticles() {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                var point = getSpiralPoint(p.progress);

                // 颜色随位置变化
                var ratio = p.progress;
                var r, g, b;
                if (ratio < 0.3) {
                    r = 100 + ratio * 300;
                    g = 80 + ratio * 200;
                    b = 200;
                } else if (ratio < 0.7) {
                    r = 220;
                    g = 120 + (ratio - 0.3) * 150;
                    b = 100;
                } else {
                    r = 255;
                    g = 180 + (ratio - 0.7) * 75;
                    b = 70;
                }

                // 粒子发光
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#00aaff";
                ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + p.alpha + ")";
                ctx.beginPath();
                ctx.arc(point.x, point.y, p.size * 0.6, 0, Math.PI * 2);
                ctx.fill();

                // 粒子尾迹（小光晕）
                ctx.fillStyle = "rgba(255, 200, 100, " + p.alpha * 0.3 + ")";
                ctx.beginPath();
                ctx.arc(point.x, point.y, p.size * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // 绘制黑洞中心（半开放风格）
        function drawCore() {
            ctx.save();

            // 核心光晕
            ctx.shadowBlur = 20;
            ctx.shadowColor = "#ff6600";

            var coreGrad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, config.coreRadius);
            coreGrad.addColorStop(0, "#ffffff");
            coreGrad.addColorStop(0.2, "#ffaa44");
            coreGrad.addColorStop(0.5, "#ff4400");
            coreGrad.addColorStop(1, "#220000");
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, config.coreRadius, 0, Math.PI * 2);
            ctx.fill();

            // 核心内缘高光
            ctx.shadowBlur = 8;
            ctx.fillStyle = "rgba(255, 255, 200, 0.4)";
            ctx.beginPath();
            ctx.arc(cx - 4, cy - 4, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // 绘制额外的能量弧线（增强鸿蒙感）
        function drawEnergyArcs() {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            // 内层热环（半圆）
            ctx.beginPath();
            ctx.ellipse(cx, cy, config.coreRadius + 8, (config.coreRadius + 8) * 0.45, 0, -Math.PI / 2, Math.PI / 2);
            ctx.strokeStyle = "rgba(255, 120, 40, 0.5)";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 外层冷环
            ctx.beginPath();
            ctx.ellipse(cx, cy, config.coreRadius + 18, (config.coreRadius + 18) * 0.48, 0, -Math.PI / 2, Math.PI / 2);
            ctx.strokeStyle = "rgba(0, 150, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }

        // 主循环
        var lastTime = 0;

        function draw() {
            if (!act()) return;

            var now = performance.now();
            if (!lastTime) lastTime = now;
            var delta = Math.min(0.033, (now - lastTime) / 1000);
            lastTime = now;
            t += delta;

            drawBackground();
            drawSpiralLine();
            updateParticles(delta);
            drawParticles();
            drawEnergyArcs();
            drawCore();

            requestAnimationFrame(draw);
        }

        initParticles();
        draw();
    });

    // ======== 🆕 [11] 极光丝绸 (auroraSilk) *高级 minimalist 流体波形艺术 ========
    EffectRegister('auroraSilk', function(w,h,ctx,cv,act) {
        var t=0;
        function draw() {
            if(!act()) return; t += 0.003; // 极其慵懒、慢速、高级感
            _fillBg(ctx, w, h, '#060814', '#020307');
            ctx.globalCompositeOperation = 'lighter';

            // 绘制3重宽幅跨度无缝正弦叠加的量子艺术丝绸流体
            for(var i=0; i<3; i++) {
                var offset = i * 45;
                var g = ctx.createLinearGradient(0, 0, w, 0);
                if(i===0) { g.addColorStop(0, 'rgba(16, 185, 129, 0)'); g.addColorStop(0.5, 'rgba(20, 184, 166, 0.08)'); g.addColorStop(1, 'transparent'); }
                if(i===1) { g.addColorStop(0, 'rgba(99, 102, 241, 0)'); g.addColorStop(0.6, 'rgba(139, 92, 246, 0.06)'); g.addColorStop(1, 'transparent'); }
                if(i===2) { g.addColorStop(0, 'rgba(236, 72, 153, 0)'); g.addColorStop(0.4, 'rgba(244, 63, 94, 0.05)'); g.addColorStop(1, 'transparent'); }

                ctx.fillStyle = g;
                ctx.beginPath(); ctx.moveTo(0, h);
                // 离散高频率曲线绘制
                for(var x=0; x<=w+20; x+=30) {
                    var waveY = h*0.5 + _S(x*0.002 + t + i*1.5)*h*0.18 + _C(x*0.001 - t*1.2)*40;
                    ctx.lineTo(x, waveY);
                }
                ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
            }

            ctx.globalCompositeOperation = 'source-over';
            aid = requestAnimationFrame(draw);
        } draw();
    });

    // ======== 🆕 [12] 量子网格 (quantumMesh) *顶级全动态极简线条抽象美学 ========
    EffectRegister('quantumMesh', function(w,h,ctx,cv,act) {
        var t=0, nodes=[];
        // 动态离散网格节点阵列
        for(var i=0; i<45; i++) {
            nodes.push({ x: _R()*w, y: _R()*h, vx: (_R()-0.5)*0.3, vy: (_R()-0.5)*0.3, phase: _R()*_P*2 });
        }

        function draw() {
            if(!act()) return; t += 0.005;
            _fillBg(ctx, w, h, '#0a0a0c', '#030304'); // 极简性冷淡高级黑灰底色

            // 1. 实时节点物理位移与越界物理反弹机制
            nodes.forEach(n => {
                n.x += n.vx; n.y += n.vy;
                if(n.x<0 || n.x>w) n.vx *= -1;
                if(n.y<0 || n.y>h) n.vy *= -1;

                // 绘制轻微脉冲的节点晶格核心
                var pulse = 1.0 + 0.6 * _S(t*3 + n.phase);
                ctx.fillStyle = 'rgba(255,255,255,0.18)';
                ctx.beginPath(); ctx.arc(n.x, n.y, 1.5 * pulse, 0, _P*2); ctx.fill();
            });

            // 2. 空间距离动态欧氏度量连线判定 (高级复合拓扑结构)
            ctx.lineWidth = 0.6;
            for(var i=0; i<nodes.length; i++) {
                for(var j=i+1; j<nodes.length; j++) {
                    var dx = nodes[i].x - nodes[j].x;
                    var dy = nodes[i].y - nodes[j].y;
                    var dist = Math.sqrt(dx*dx + dy*dy);

                    // 只有空间临近在 140px 以内的晶格节点才允许产生神经网络连线
                    if(dist < 140) {
                        var alpha = (1.0 - (dist / 140)) * 0.12; // 越近线越实，越远越淡
                        ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha + ')';
                        ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
                    }
                }
            }

            aid = requestAnimationFrame(draw);
        } draw();
    });

    // 预启动极简纯白首屏
    start('plainWhite');
