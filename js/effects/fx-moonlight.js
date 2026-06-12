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