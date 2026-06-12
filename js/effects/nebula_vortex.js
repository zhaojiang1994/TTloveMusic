// ==========================================
// 主题 3：深色系 - 星云漩涡 (nebula_vortex)
// ==========================================
EffectRegister('nebula_vortex', function(w, h, ctx, cv, act) {
    var t = 0;
    var cx = w / 2, cy = h / 2;
    var stars = Array.from({length: 85}, () => ({
        a: _R() * _P * 2, r: 30 + _R() * (Math.max(w, h) * 0.6),
        sp: 0.003 + _R() * 0.007, size: 1 + _R() * 2.5,
        type: _R() > 0.45 ? 0 : 1 // 两种色彩倾向的粒子
    }));
    var meteors = Array.from({length: 3}, () => ({
        x: _R() * w, y: _R() * h * 0.4, len: 50 + _R() * 60, spX: 6 + _R() * 6, spY: 2 + _R() * 3
    }));
    function draw() {
        if(!act()) return; t += 0.005;
        cx = w / 2; cy = h / 2; // 实时自适应视口中心
        // 极深邃的宇宙幽紫基底
        _fillBg(ctx, w, h, '#060312', '#010006');

        ctx.globalCompositeOperation = 'screen';

        // 叠加层 1：偏心动态星云核心 A (魅惑紫)
        var nAx = cx + _S(t * 0.6) * 70;
        var nAy = cy + _S(t * 1.2) * 40;
        var gA = ctx.createRadialGradient(nAx, nAy, 10, nAx, nAy, w * 0.5);
        gA.addColorStop(0, 'rgba(123, 31, 162, 0.28)');
        gA.addColorStop(0.6, 'rgba(49, 27, 146, 0.06)');
        gA.addColorStop(1, 'transparent');
        ctx.fillStyle = gA; ctx.fillRect(0, 0, w, h);

        // 叠加层 2：反向偏心星云核心 B (荧光青)
        var nBx = cx - _S(t * 0.8) * 60;
        var nBy = cy - _S(t * 1.4) * 30;
        var gB = ctx.createRadialGradient(nBx, nBy, 20, nBx, nBy, w * 0.38);
        gB.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
        gB.addColorStop(0.5, 'rgba(0, 150, 136, 0.04)');
        gB.addColorStop(1, 'transparent');
        ctx.fillStyle = gB; ctx.fillRect(0, 0, w, h);

        // 叠加层 3：引力坍缩漩涡粒子系统 (带伪3D视差与运动模糊尾迹)
        stars.forEach(s => {
            s.a -= s.sp; // 角度自增实现旋转
            s.r -= 0.3;  // 向中心坍缩的引力模拟
            if(s.r < 12) { // 湮灭再生机制
                s.r = Math.max(w, h) * 0.55 + _R() * 50;
                s.a = _R() * _P * 2;
            }

            // 极坐标转换：_S(s.a + _P*0.5) 巧妙代替 Math.cos(s.a) 确保纯框架语法兼容
            var x = cx + _S(s.a + _P * 0.5) * s.r;
            var y = cy + _S(s.a) * s.r;

            // 闪烁与近大远小的透视计算
            var baseAlpha = 0.35 + 0.55 * _S(t * 4 + s.r * 0.04);
            if (s.r < 60) baseAlpha *= (s.r / 60); // 越接近奇点越黯淡直至湮灭

            var colorStr = s.type === 0 ? 'rgba(0, 255, 210, ' : 'rgba(245, 0, 87, ';
            var currentSize = s.size * (0.7 + s.r / w); // 离中心越远粒子越大，形成向深处内缩的视差

            ctx.fillStyle = colorStr + baseAlpha + ')';
            ctx.beginPath(); ctx.arc(x, y, currentSize, 0, _P * 2); ctx.fill();

            // 粒子的高级动感尾迹处理（利用微小延迟坐标再画一个淡色粒子）
            ctx.fillStyle = colorStr + (baseAlpha * 0.25) + ')';
            ctx.beginPath();
            ctx.arc(cx + _S(s.a + s.sp + _P * 0.5) * (s.r + 0.3), cy + _S(s.a + s.sp) * (s.r + 0.3), currentSize * 0.7, 0, _P * 2);
            ctx.fill();
        });

        // 叠加层 4：瞬间划过的流星特效
        meteors.forEach(m => {
            m.x += m.spX; m.y += m.spY;
            if(m.x > w + 120 || m.y > h + 120) { // 越界重置
                m.x = -120 - _R() * 200; m.y = _R() * h * 0.4;
                m.len = 50 + _R() * 60; m.spX = 6 + _R() * 6; m.spY = 2 + _R() * 3;
            }
            var metG = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len * 0.35);
            metG.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
            metG.addColorStop(0.3, 'rgba(0, 229, 255, 0.25)');
            metG.addColorStop(1, 'transparent');
            ctx.strokeStyle = metG;
            ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.len, m.y - m.len * 0.35); ctx.stroke();
        });

        ctx.globalCompositeOperation = 'source-over'; aid = requestAnimationFrame(draw);
    } draw();
});