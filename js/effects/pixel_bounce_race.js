// ==========================================
// 主题 5：森林之夜 – 静谧萤火虫森林 (forest_calm)
// ==========================================
EffectRegister('pixel_bounce_race', function(w, h, ctx, cv, act) {
    var t = 0;

    // 星空背景（远星）
    var stars = Array.from({length: 80}, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.6,
        size: 1 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7
    }));

    // 树木数据（近景、中景两层，产生纵深感）
    var trees = [];
    // 中景树（稍远，小一些）
    for (var i = 0; i < 30; i++) {
        trees.push({
            x: Math.random() * w,
            depth: 0.3 + Math.random() * 0.3,  // 纵深比 0~1, 0为地平线
            height: 40 + Math.random() * 60,
            width: 12 + Math.random() * 15,
            trunkColor: `rgba(40, 30, 20, ${0.6 + Math.random() * 0.3})`,
            foliageColor: `rgba(20, 60, 30, ${0.7 + Math.random() * 0.3})`
        });
    }
    // 近景树（大，靠近屏幕底部）
    for (var i = 0; i < 15; i++) {
        trees.push({
            x: Math.random() * w,
            depth: 0.7 + Math.random() * 0.3,
            height: 80 + Math.random() * 100,
            width: 20 + Math.random() * 30,
            trunkColor: `rgba(30, 20, 10, 0.9)`,
            foliageColor: `rgba(15, 50, 25, 0.9)`
        });
    }

    // 萤火虫粒子
    var fireflies = Array.from({length: 60}, () => ({
        x: Math.random() * w,
        y: h * 0.4 + Math.random() * h * 0.5,
        size: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        color: `hsl(${50 + Math.random() * 20}, 90%, 65%)`
    }));

    // 地面雾气层（渐变）
    function drawGroundFog() {
        var fogGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
        fogGrad.addColorStop(0, 'rgba(20, 40, 30, 0)');
        fogGrad.addColorStop(0.4, 'rgba(30, 60, 40, 0.2)');
        fogGrad.addColorStop(1, 'rgba(10, 25, 15, 0.6)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 0, w, h);
    }

    // 绘制一棵树（简单剪影）
    function drawTree(x, yBase, treeHeight, treeWidth, trunkCol, foliageCol) {
        var trunkH = treeHeight * 0.3;
        var trunkW = treeWidth * 0.3;
        var foliageH = treeHeight - trunkH;

        // 树干
        ctx.fillStyle = trunkCol;
        ctx.fillRect(x - trunkW/2, yBase - trunkH, trunkW, trunkH);

        // 树叶（三层三角形或椭圆形，使用圆弧）
        ctx.fillStyle = foliageCol;
        var foliageY = yBase - trunkH;
        // 下层树冠
        ctx.beginPath();
        ctx.ellipse(x, foliageY - foliageH*0.2, treeWidth*0.5, foliageH*0.4, 0, 0, Math.PI*2);
        ctx.fill();
        // 中层
        ctx.beginPath();
        ctx.ellipse(x, foliageY - foliageH*0.5, treeWidth*0.4, foliageH*0.35, 0, 0, Math.PI*2);
        ctx.fill();
        // 上层
        ctx.beginPath();
        ctx.ellipse(x, foliageY - foliageH*0.8, treeWidth*0.3, foliageH*0.3, 0, 0, Math.PI*2);
        ctx.fill();
    }

    function draw() {
        if (!act()) return;
        t += 0.02;

        // 清空并设置夜空渐变
        var skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
        skyGrad.addColorStop(0, '#030318');
        skyGrad.addColorStop(1, '#142c1f');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // 绘制星空（闪烁）
        stars.forEach(s => {
            var twinkle = 0.5 + 0.5 * Math.sin(t * 0.8 + s.x * 0.01);
            ctx.fillStyle = `rgba(255, 240, 200, ${s.alpha * twinkle})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        });

        // 月亮（朦胧）
        var moonX = w * 0.8, moonY = h * 0.15;
        ctx.fillStyle = 'rgba(220, 210, 170, 0.4)';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 35, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 245, 200, 0.6)';
        ctx.beginPath();
        ctx.arc(moonX-2, moonY-2, 30, 0, Math.PI*2);
        ctx.fill();

        // 排序树木（按深度从远到近，远先画）
        var sortedTrees = [...trees];
        sortedTrees.sort((a,b) => a.depth - b.depth);
        sortedTrees.forEach(tree => {
            // 根据深度计算Y底部位置（深度越大，Y越靠下）
            var yBase = h * 0.55 + tree.depth * h * 0.45;
            var scale = 0.4 + tree.depth * 0.8; // 近大远小
            var height = tree.height * scale;
            var width = tree.width * scale;
            drawTree(tree.x, yBase, height, width, tree.trunkColor, tree.foliageColor);
        });

        // 萤火虫（动态飞舞）
        fireflies.forEach(f => {
            // 移动
            f.x += f.speedX;
            f.y += f.speedY + Math.sin(t + f.phase) * 0.2;
            // 边界反弹
            if (f.x < 0) f.x = w;
            if (f.x > w) f.x = 0;
            if (f.y < h * 0.3) f.y = h * 0.3;
            if (f.y > h * 0.9) f.y = h * 0.9;

            var glow = 0.4 + 0.6 * (Math.sin(t * 3 + f.phase) * 0.5 + 0.5);
            ctx.shadowBlur = 8;
            ctx.shadowColor = f.color;
            ctx.fillStyle = f.color;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size * glow, 0, Math.PI * 2);
            ctx.fill();
            // 内层光晕
            ctx.fillStyle = 'rgba(255, 230, 150, 0.8)';
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size * glow * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;

        // 地面雾气
        drawGroundFog();

        // 偶尔飘落的树叶（少许粒子）
        if (Math.random() < 0.05 && fireflies.length < 80) {
            fireflies.push({
                x: Math.random() * w,
                y: -5,
                size: 2,
                speedX: (Math.random() - 0.5) * 0.2,
                speedY: 0.8 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
                color: `hsl(${80 + Math.random() * 20}, 70%, 50%)`
            });
        }
        // 限制粒子数量
        if (fireflies.length > 100) fireflies.shift();

        aid = requestAnimationFrame(draw);
    }
    draw();
});