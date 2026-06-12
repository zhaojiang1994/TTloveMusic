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