EffectRegister('quantumMesh', function(w,h,ctx,cv,act) {
        var t=0, nodes=[];
        // 动态离散网格节点阵列（数量从 45 → 35，减少密集度让节点更清晰）
        for(var i=0; i<35; i++) {
            nodes.push({ x: _R()*w, y: _R()*h, vx: (_R()-0.5)*0.4, vy: (_R()-0.5)*0.4, phase: _R()*_P*2 });
        }

        function draw() {
            if(!act()) return; t += 0.008;
            _fillBg(ctx, w, h, '#181820', '#0c0c14'); // 调亮底色，提高对比度

            // 1. 实时节点物理位移与越界物理反弹机制
            nodes.forEach(n => {
                n.x += n.vx; n.y += n.vy;
                if(n.x<0 || n.x>w) n.vx *= -1;
                if(n.y<0 || n.y>h) n.vy *= -1;

                // 绘制节点晶格核心（加大、加亮）
                var pulse = 1.0 + 0.5 * _S(t*3 + n.phase);
                ctx.fillStyle = 'rgba(180, 220, 255, 0.45)';
                ctx.beginPath(); ctx.arc(n.x, n.y, 2.8 * pulse, 0, _P*2); ctx.fill();
            });

            // 2. 空间距离动态欧氏度量连线判定
            ctx.lineWidth = 1.2;
            for(var i=0; i<nodes.length; i++) {
                for(var j=i+1; j<nodes.length; j++) {
                    var dx = nodes[i].x - nodes[j].x;
                    var dy = nodes[i].y - nodes[j].y;
                    var dist = Math.sqrt(dx*dx + dy*dy);

                    // 连接距离从 140px → 200px，连线更丰富
                    if(dist < 200) {
                        var alpha = (1.0 - (dist / 200)) * 0.25; // 亮度提升 2 倍
                        ctx.strokeStyle = 'rgba(150, 210, 255, ' + alpha + ')';
                        ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
                    }
                }
            }

            aid = requestAnimationFrame(draw);
        } draw();
    });