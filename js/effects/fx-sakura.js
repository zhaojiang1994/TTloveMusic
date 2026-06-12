EffectRegister('sakura', function(w,h,ctx,cv,act) {
        // 花瓣参数：可自行调整数值
        var PETAL_COUNT = 30;         // 花瓣数量
        var MIN_R = 6, MAX_R = 22;    // 花瓣大小范围（6~22px）
        var MIN_SP = 0.15, MAX_SP = 0.5;  // 下落速度范围
        var MIN_ALPHA = 0.3, MAX_ALPHA = 0.6; // 透明度范围

        var petals = [];
        for(var i=0;i<PETAL_COUNT;i++) petals.push({
            x:_R()*w, y:_R()*h,
            r:MIN_R+_R()*(MAX_R-MIN_R),
            sp:MIN_SP+_R()*(MAX_SP-MIN_SP),
            swing:_R()*8,
            p:_R()*_P,
            rotSp:(_R()-0.5)*0.02,
            alpha:MIN_ALPHA+_R()*(MAX_ALPHA-MIN_ALPHA)
        });
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
                p.y += p.sp; p.x += _S(p.y*0.01 + p.swing)*0.2; p.p += p.rotSp;
                if(p.y > h+15) { p.y=-15; p.x=_R()*w; }
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.p); ctx.scale(_C(p.p*0.5), 1); ctx.globalAlpha = p.alpha; drawLeaf(ctx, p.r); ctx.restore();
            });
            aid=requestAnimationFrame(draw);
        } draw();
    });