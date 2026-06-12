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