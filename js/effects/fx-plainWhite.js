EffectRegister('plainWhite', function(w,h,ctx,cv,act) {
        function draw() {
            if(!act()) return;
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
            aid = requestAnimationFrame(draw);
        } draw();
    });