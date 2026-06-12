// ==========================================
// 主题 5：森林之夜 – 静谧萤火虫森林 (forest_calm)
// ==========================================
    EffectRegister('pixel_bounce_race', function(w, h, ctx, cv, act) {
        var t = 0;

        // 1. 星空背景（远星）
        var stars = Array.from({length: 80}, () => ({
            x: Math.random() * w,
            y: Math.random() * h * 0.6,
            size: 1 + Math.random() * 2,
            alpha: 0.3 + Math.random() * 0.7
        }));

        // 2. 树木数据（近景、中景两层，产生纵深感）
        var trees = [];
        for (var i = 0; i < 30; i++) {
            trees.push({
                x: Math.random() * w,
                depth: 0.3 + Math.random() * 0.3,
                height: 40 + Math.random() * 60,
                width: 12 + Math.random() * 15,
                trunkColor: `rgba(40, 30, 20, ${0.6 + Math.random() * 0.3})`,
                foliageColor: `rgba(20, 60, 30, ${0.7 + Math.random() * 0.3})`
            });
        }
        for (var i = 0; i < 15; i++) {
            trees.push({
                x: Math.random() * w,
                depth: 0.7 + Math.random() * 0.3,
                height: 80 + Math.random() * 100,
                width: 20 + Math.random() * 30,
                trunkColor: `rgba(30, 20, 10, 0.9)`,
                foliageColor: `rgba(15, 50, 25, 0.9)`
            });
        }

        // 3. 萤火虫粒子（优化：引入速度向量和游荡逻辑）
        var fireflies = Array.from({length: 60}, () => ({
            x: Math.random() * w,
            y: h * 0.4 + Math.random() * h * 0.5,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: 1.5 + Math.random() * 2.5,
            phase: Math.random() * Math.PI * 2,
            color: `hsl(${50 + Math.random() * 20}, 90%, 65%)`
        }));

        // 4. 落叶粒子（优化：完全独立的数组和物理逻辑）
        var leaves = [];

        // 绘制地面雾气层（渐变）
        function drawGroundFog() {
            var fogGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
            fogGrad.addColorStop(0, 'rgba(20, 40, 30, 0)');
            fogGrad.addColorStop(0.4, 'rgba(30, 60, 40, 0.2)');
            fogGrad.addColorStop(1, 'rgba(10, 25, 15, 0.6)');
            ctx.fillStyle = fogGrad;
            ctx.fillRect(0, 0, w, h);
        }

        // 绘制一棵树（简单剪影）
        function drawTree(x, yBase, treeHeight, treeWidth, trunkCol, foliageCol) {
            var trunkH = treeHeight * 0.3;
            var trunkW = treeWidth * 0.3;
            var foliageH = treeHeight - trunkH;

            ctx.fillStyle = trunkCol;
            ctx.fillRect(x - trunkW/2, yBase - trunkH, trunkW, trunkH);

            ctx.fillStyle = foliageCol;
            var foliageY = yBase - trunkH;
            ctx.beginPath();
            ctx.ellipse(x, foliageY - foliageH*0.2, treeWidth*0.5, foliageH*0.4, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x, foliageY - foliageH*0.5, treeWidth*0.4, foliageH*0.35, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x, foliageY - foliageH*0.8, treeWidth*0.3, foliageH*0.3, 0, 0, Math.PI*2);
            ctx.fill();
        }

        function draw() {
            if (!act()) return;
            t += 0.02;

            // 清空并设置夜空渐变
            var skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
            skyGrad.addColorStop(0, '#030318');
            skyGrad.addColorStop(1, '#142c1f');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, w, h);

            // 星空与月亮
            stars.forEach(s => {
                var twinkle = 0.5 + 0.5 * Math.sin(t * 0.8 + s.x * 0.01);
                ctx.fillStyle = `rgba(255, 240, 200, ${s.alpha * twinkle})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
            });

            var moonX = w * 0.8, moonY = h * 0.15;
            ctx.fillStyle = 'rgba(220, 210, 170, 0.4)';
            ctx.beginPath();
            ctx.arc(moonX, moonY, 35, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 245, 200, 0.6)';
            ctx.beginPath();
            ctx.arc(moonX-2, moonY-2, 30, 0, Math.PI*2);
            ctx.fill();

            // 排序并绘制树木
            var sortedTrees = [...trees];
            sortedTrees.sort((a,b) => a.depth - b.depth);
            sortedTrees.forEach(tree => {
                var yBase = h * 0.55 + tree.depth * h * 0.45;
                var scale = 0.4 + tree.depth * 0.8;
                var height = tree.height * scale;
                var width = tree.width * scale;
                drawTree(tree.x, yBase, height, width, tree.trunkColor, tree.foliageColor);
            });

            // ================= 优化点 1：萤火虫运动轨迹 =================
            fireflies.forEach(f => {
                // 加入微小的随机加速度（类布朗运动）
                f.vx += (Math.random() - 0.5) * 0.08;
                f.vy += (Math.random() - 0.5) * 0.08;

                // 限制最大速度
                var maxSpeed = 1.0;
                f.vx = Math.max(-maxSpeed, Math.min(maxSpeed, f.vx));
                f.vy = Math.max(-maxSpeed, Math.min(maxSpeed, f.vy));

                // 软边界：当靠近边缘时，给予反向加速度，使其自然回头，而不是生硬地卡在边缘
                if (f.y < h * 0.4) f.vy += 0.05;
                if (f.y > h * 0.85) f.vy -= 0.05;

                // 应用速度与振翅效果
                f.x += f.vx;
                f.y += f.vy + Math.sin(t * 5 + f.phase) * 0.3; // 振翅的频率加快一点更逼真

                // 左右边界无缝穿梭
                if (f.x < -20) f.x = w + 20;
                if (f.x > w + 20) f.x = -20;

                // 绘制发光效果
                var glow = 0.4 + 0.6 * (Math.sin(t * 3 + f.phase) * 0.5 + 0.5);
                ctx.shadowBlur = 10;
                ctx.shadowColor = f.color;
                ctx.fillStyle = f.color;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.size * glow, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // 中心白点更亮
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.size * glow * 0.3, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.shadowBlur = 0; // 重置阴影

            // 地面雾气
            drawGroundFog();

            // ================= 优化点 2：独立的落叶逻辑 =================
            if (Math.random() < 0.02 && leaves.length < 20) {
                leaves.push({
                    x: Math.random() * w,
                    y: -20, // 从屏幕上方外侧开始下落
                    size: 3 + Math.random() * 4,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: 0.5 + Math.random() * 1.5,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.1,
                    // 暗绿/暗褐色，不发光，表现实体剪影
                    color: `rgba(${20 + Math.random() * 30}, ${30 + Math.random() * 30}, 15, 0.8)`
                });
            }

            for (let i = leaves.length - 1; i >= 0; i--) {
                let l = leaves[i];
                // 叠加风的横向扰动
                l.vx += Math.sin(t + l.y * 0.02) * 0.05;
                l.x += l.vx;
                l.y += l.vy;
                l.rotation += l.rotSpeed;

                // 绘制叶子
                ctx.save();
                ctx.translate(l.x, l.y);
                ctx.rotate(l.rotation);
                ctx.fillStyle = l.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, l.size, l.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // 超出边界后移除
                if (l.y > h + 20 || l.x < -50 || l.x > w + 50) {
                    leaves.splice(i, 1);
                }
            }

            requestAnimationFrame(draw);
        }
        draw();
    });