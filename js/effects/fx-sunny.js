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