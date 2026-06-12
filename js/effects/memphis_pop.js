// ==========================================
// 主题 1：浅色系 - 莫兰迪波普几何 (memphis_pop)
// ==========================================
EffectRegister('memphis_pop', function(w, h, ctx, cv, act) {
    var t = 0;

    // --- 3D 几何体数据字典 ---
    // v: 顶点(Vertices), f: 面(Faces, 顶点索引按逆时针顺序包裹以计算正确的朝向)
    var geomCube = {
        v: [[-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1], [-1,-1,1], [1,-1,1], [1,1,1], [-1,1,1]],
        f: [[0,3,2,1], [1,2,6,5], [5,6,7,4], [4,7,3,0], [3,7,6,2], [4,0,1,5]]
    };
    var geomPyr = {
        v: [[-1,1,-1], [1,1,-1], [1,1,1], [-1,1,1], [0,-1.2,0]], // 索引 4 是塔尖
        f: [[0,1,4], [1,2,4], [2,3,4], [3,0,4], [3,2,1,0]]
    };

    // 混合波普元素：0-十字, 1-圆环, 2-波浪线, 3-实体3D立方体, 4-实体3D金字塔
    var items = Array.from({length: 25}, () => ({
        x: _R() * w, y: _R() * h, size: 18 + _R() * 22,
        vx: (-0.6 + _R() * 1.2), vy: (-0.6 + _R() * 1.2),
        rot: _R() * Math.PI * 2, rotSp: 0.01 + _R() * 0.02,
        type: Math.floor(_R() * 5), // 扩展到 5 种形态
        color: ['#ff6b6b', '#4ecdc4', '#ffbe0b', '#a2d2ff', '#7209b7'][Math.floor(_R() * 5)]
    }));

    // 专属 3D 渲染函数 (包含透视、剔除与光影着色)
    function drawSolid3D(geom, d) {
        var rotX = d.rot, rotY = d.rot * 1.3;
        var depth = 8, zoom = d.size * 3.5;
        // 光源向量 (假设光从左上前方照过来)
        var lx = -0.57, ly = -0.57, lz = -0.57;

        var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        var cosX = Math.cos(rotX), sinX = Math.sin(rotX);

        // 1. 计算三维旋转
        var pts = geom.v.map(v => {
            var x1 = v[0] * cosY - v[2] * sinY;
            var z1 = v[0] * sinY + v[2] * cosY;
            var y2 = v[1] * cosX - z1 * sinX;
            var z2 = v[1] * sinX + z1 * cosX;
            return { x: x1, y: y2, z: z2 };
        });

        // 2. 构建多边形面并计算法向量
        var faces = geom.f.map(faceInds => {
            var fpts = faceInds.map(i => pts[i]);
            var v0 = fpts[0], v1 = fpts[1], v2 = fpts[2];
            // 叉乘计算法向量
            var ax = v1.x - v0.x, ay = v1.y - v0.y, az = v1.z - v0.z;
            var bx = v2.x - v0.x, by = v2.y - v0.y, bz = v2.z - v0.z;
            var nx = ay * bz - az * by;
            var ny = az * bx - ax * bz;
            var nz = ax * by - ay * bx;
            // 计算 Z 轴中心深度用于画家算法
            var zCenter = fpts.reduce((s, p) => s + p.z, 0) / fpts.length;
            return { fpts, nx, ny, nz, zCenter };
        });

        // 3. 画家算法：从远到近排序
        faces.sort((a, b) => b.zCenter - a.zCenter);

        faces.forEach(f => {
            // 4. 背面剔除：法向量 Z 值大于 0 代表背对屏幕，不予绘制
            if (f.nz > 0) return;

            // 计算面与光照的点积 (0~1)
            var len = Math.sqrt(f.nx*f.nx + f.ny*f.ny + f.nz*f.nz) || 1;
            var dot = (f.nx/len * lx) + (f.ny/len * ly) + (f.nz/len * lz);

            // 投影到 2D 坐标系
            ctx.beginPath();
            f.fpts.forEach((p, i) => {
                var px = (p.x * zoom) / (p.z + depth);
                var py = (p.y * zoom) / (p.z + depth);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.closePath();

            // 填充莫兰迪底色
            ctx.fillStyle = d.color;
            ctx.fill();

            // 叠加伪 3D 明暗光影层
            if (dot > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${dot * 0.45})`; // 亮面
            } else {
                ctx.fillStyle = `rgba(0, 0, 0, ${-dot * 0.3})`; // 暗面
            }
            ctx.fill();

            // 孟菲斯波普标志性的深色粗描边
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#2d3436';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        });
    }

    function draw() {
        if(!act()) return; t += 0.01;
        // 舒适明亮的复古浅奶杏底色
        _fillBg(ctx, w, h, '#fcfaf2', '#f2eee3');

        ctx.globalCompositeOperation = 'source-over';

        items.forEach(d => {
            // 边缘碰撞弹跳
            d.x += d.vx; d.y += d.vy;
            d.rot += d.rotSp;
            if(d.x < -d.size || d.x > w + d.size) d.vx *= -1;
            if(d.y < -d.size || d.y > h + d.size) d.vy *= -1;

            ctx.save();
            ctx.translate(d.x, d.y);

            // 绘制纯 2D 元素
            if(d.type < 3) {
                ctx.lineWidth = 3.5;
                ctx.strokeStyle = d.color;
                ctx.fillStyle = d.color;

                if(d.type === 0) {
                    // 十字星
                    ctx.rotate(d.rot);
                    ctx.beginPath();
                    ctx.moveTo(-d.size/2, 0); ctx.lineTo(d.size/2, 0);
                    ctx.moveTo(0, -d.size/2); ctx.lineTo(0, d.size/2);
                    ctx.stroke();
                }
                else if(d.type === 1) {
                    // 双色同心圆
                    ctx.beginPath(); ctx.arc(0, 0, d.size/2, 0, Math.PI*2); ctx.stroke();
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.arc(0, 0, d.size/4, 0, Math.PI*2); ctx.fill();
                    ctx.stroke();
                }
                else if(d.type === 2) {
                    // 蠕动波浪线
                    ctx.rotate(d.rot);
                    ctx.beginPath();
                    for(var i = -d.size; i <= d.size; i += 5) {
                        var waveY = Math.sin(i * 0.1 + t * 5) * 6;
                        if(i === -d.size) ctx.moveTo(i, waveY); else ctx.lineTo(i, waveY);
                    }
                    ctx.stroke();
                }
            }
            // 绘制实体 3D 元素
            else {
                if (d.type === 3) {
                    drawSolid3D(geomCube, d); // 实体 3D 立方体
                } else if (d.type === 4) {
                    drawSolid3D(geomPyr, d);  // 实体 3D 金字塔
                }
            }
            ctx.restore();
        });

        aid = requestAnimationFrame(draw);
    }
    draw();
});