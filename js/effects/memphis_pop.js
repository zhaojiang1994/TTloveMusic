// ==========================================
// 主题 1：浅色系 - 莫兰迪波普几何 (memphis_pop)
// ==========================================
EffectRegister('memphis_pop', function(w, h, ctx, cv, act) {
    var t = 0;
    // 3D立方体的8个顶点坐标
    var vertices = [
        [-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1],
        [-1,-1,1], [1,-1,1], [1,1,1], [-1,1,1]
    ];
    // 连接8个顶点的12条棱
    var edges = [
        [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]
    ];

    // 混合波普元素：0-十字, 1-圆环, 2-波浪线, 3-3D立方体
    var items = Array.from({length: 24}, () => ({
        x: _R() * w, y: _R() * h, size: 20 + _R() * 25,
        vx: (-0.6 + _R() * 1.2), vy: (-0.6 + _R() * 1.2),
        rot: _R() * _P * 2, rotSp: 0.01 + _R() * 0.02,
        type: Math.floor(_R() * 4),
        color: ['#ff6b6b', '#4ecdc4', '#ffbe0b', '#a2d2ff', '#7209b7'][Math.floor(_R() * 5)]
    }));

    function draw() {
        if(!act()) return; t += 0.01;
        // 极其舒适明亮的复古浅奶杏底色
        _fillBg(ctx, w, h, '#fcfaf2', '#f2eee3');

        ctx.globalCompositeOperation = 'source-over';

        items.forEach(d => {
            // 边缘碰撞检测与弹跳物理
            d.x += d.vx; d.y += d.vy;
            d.rot += d.rotSp;
            if(d.x < -d.size || d.x > w + d.size) d.vx *= -1;
            if(d.y < -d.size || d.y > h + d.size) d.vy *= -1;

            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.lineWidth = 3;
            ctx.strokeStyle = d.color;
            ctx.fillStyle = d.color;

            if(d.type === 0) { // 核心玩法 1: 旋转十字星
                ctx.rotate(d.rot);
                ctx.beginPath();
                ctx.moveTo(-d.size/2, 0); ctx.lineTo(d.size/2, 0);
                ctx.moveTo(0, -d.size/2); ctx.lineTo(0, d.size/2);
                ctx.stroke();
            }
            else if(d.type === 1) { // 核心玩法 2: 粗线条双色同心圆
                ctx.beginPath(); ctx.arc(0, 0, d.size/2, 0, _P*2); ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(d.size/4, -d.size/4, d.size/6, 0, _P*2); ctx.fill();
                ctx.stroke();
            }
            else if(d.type === 2) { // 核心玩法 3: 带有动态蠕动感的波浪线
                ctx.rotate(d.rot);
                ctx.beginPath();
                for(var i = -d.size; i <= d.size; i += 5) {
                    var waveY = _S(i * 0.1 + t * 5) * 6;
                    if(i === -d.size) ctx.moveTo(i, waveY); else ctx.lineTo(i, waveY);
                }
                ctx.stroke();
            }
            else if(d.type === 3) { // 核心玩法 4: 复杂的纯数学投影 3D 旋转线框立方体
                var radX = d.rot, radY = d.rot * 1.3;
                var cosX = _S(radX + _P*0.5), sinX = _S(radX);
                var cosY = _S(radY + _P*0.5), sinY = _S(radY);

                // 计算3D旋转并投影到2D屏幕
                var projPoints = vertices.map(p => {
                    var x1 = p[0] * cosY - p[2] * sinY;
                    var z1 = p[0] * sinY + p[2] * cosY;
                    var y2 = p[1] * cosX - z1 * sinX;
                    var z2 = p[1] * sinX + z1 * cosX;
                    var zoom = d.size * 1.2, depth = 3;
                    return {
                        x: (x1 * zoom) / (z2 + depth),
                        y: (y2 * zoom) / (z2 + depth)
                    };
                });
                // 绘制 3D 棱线
                edges.forEach(e => {
                    ctx.beginPath();
                    ctx.moveTo(projPoints[e[0]].x, projPoints[e[0]].y);
                    ctx.lineTo(projPoints[e[1]].x, projPoints[e[1]].y);
                    ctx.stroke();
                });
            }
            ctx.restore();
        });

        aid = requestAnimationFrame(draw);
    } draw();

});