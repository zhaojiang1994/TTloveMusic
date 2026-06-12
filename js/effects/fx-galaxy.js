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