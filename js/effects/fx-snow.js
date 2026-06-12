EffectRegister('snow', function(w,h,ctx,cv,act) {
        // 雪花参数：可自行调整数值
        var SNOW_COUNT = 50;          // 雪花数量
        var MIN_R = 4, MAX_R = 18;    // 雪花半径范围（4~18px）
        var MIN_SP = 0.3, MAX_SP = 1.0;  // 下落速度范围
        var MIN_ALPHA = 0.3, MAX_ALPHA = 0.8; // 透明度范围

        var flakes=[];
        for(var i=0;i<SNOW_COUNT;i++) flakes.push({
            x:_R()*w, y:_R()*h,
            r:MIN_R+_R()*(MAX_R-MIN_R),
            sp:MIN_SP+_R()*(MAX_SP-MIN_SP),
            sw:_R()*8,
            alpha:MIN_ALPHA+_R()*(MAX_ALPHA-MIN_ALPHA),
            type:_F(_R()*2)
        });
        function drawSnow(ctx, r, type) {
            var lw = Math.max(0.6, r * 0.1);
            for(var j=0; j<6; j++){
                ctx.rotate(_P/3);
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, -r);
                ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = lw; ctx.stroke();
                if(type===1) {
                    ctx.beginPath(); ctx.moveTo(0, -r*0.5);
                    ctx.lineTo(-r*0.25, -r*0.7); ctx.moveTo(0, -r*0.5);
                    ctx.lineTo(r*0.25, -r*0.7); ctx.stroke();
                }
            }
        }
        function draw() {
            if(!act()) return;
            _fillBg(ctx, w, h, '#070b12', '#121824');
            for(var i=0;i<flakes.length;i++){
                var f=flakes[i]; f.y += f.sp; f.x += _S(f.y*0.01 + f.sw)*0.3;
                if(f.y > h+15) { f.y=-15; f.x=_R()*w; }
                ctx.save(); ctx.translate(f.x, f.y); ctx.globalAlpha = f.alpha; ctx.rotate(f.y*0.005); drawSnow(ctx, f.r, f.type); ctx.restore();
            }
            ctx.globalAlpha = 1; aid=requestAnimationFrame(draw);
        } draw();
    });