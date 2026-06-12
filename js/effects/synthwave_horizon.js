// ==========================================
// 主题 4:深色系 - 赛博朋克霓虹远景公路 (synthwave_road_view)
// 修复：车辆严格沿着纵向放射线行驶（直线轨迹，与网格线完全贴合）
// ==========================================
EffectRegister('synthwave_horizon', function(w, h, ctx, cv, act) {
    var t = 0;
    const horizon = h * 0.55;

    // 公路底部左右边界（与纵向放射线的最左、最右匹配）
    // 原放射线计算：xBot = (ratio-0.5)*(w*3.2)+w/2
    // 取 ratio=0 得左边界 ≈ -1.1w，ratio=1 得右边界 ≈ 2.1w
    // 为了对称且美观，调整为底部宽度为 2.4w（左右各1.2w）
    const roadLeftBottom = w/2 - w * 1.2;
    const roadRightBottom = w/2 + w * 1.2;

    // 星空粒子（不变）
    var stars = Array.from({length: 50}, () => ({
        x: _R() * w, y: _R() * h, sp: 0.4 + _R() * 1.3, size: 0.6 + _R() * 1.4
    }));

    // 两侧树木（不变）
    var trees = [];
    for(let i = 0; i < 6; i++){
        let dist = 0.2 + _R() * 0.7;
        trees.push({side: -1, dist, h:35+_R()*55, w:10+_R()*16});
        trees.push({side: 1, dist, h:35+_R()*55, w:10+_R()*16});
    }

    // 车辆配置（车道比例，深度，速度）
    var carColors = [
        'rgba(0, 242, 254, 0.8)',
        'rgba(255, 0, 127, 0.8)',
        'rgba(255, 235, 59, 0.8)',
        'rgba(138, 43, 226, 0.75)',
        'rgba(0, 200, 160, 0.75)'
    ];
    var cars = [];
    const laneRatios = [0.25, 0.5, 0.75];
    for(let i=0;i<6;i++){
        let lane = laneRatios[Math.floor(_R()*laneRatios.length)];
        cars.push({
            laneRatio: lane,
            depth: 0.15 + _R()*0.75,   // 初始深度（0=地平线，1=底部）
            speed: 0.002 + _R()*0.003,  // 每帧增加深度
            color: carColors[Math.floor(_R()*carColors.length)]
        });
    }

    // 楼房（不变）
    var buildColors = [
        'rgba(0, 242, 254, 0.6)',
        'rgba(255, 0, 127, 0.6)',
        'rgba(255, 235, 59, 0.55)',
        'rgba(100, 20, 160, 0.5)',
        'rgba(20, 140, 130, 0.5)'
    ];
    var buildings = [];
    for(let i=0;i<8;i++){
        let side = _R()>0.5 ? -1 : 1;
        let depth = 0.08 + _R()*0.22;
        buildings.push({
            side, depth,
            bh: 50 + _R()*90, bw:12+_R()*22,
            color: buildColors[Math.floor(_R()*buildColors.length)]
        });
    }
    for(let i=0;i<5;i++){
        let side = _R()>0.5 ? -1 : 1;
        let depth = 0.35 + _R()*0.45;
        buildings.push({
            side, depth,
            bh: 70 + _R()*110, bw:18+_R()*30,
            color: buildColors[Math.floor(_R()*buildColors.length)]
        });
    }

    function draw() {
        if(!act()) return;
        t += 0.008;

        // 深空底色（不变）
        _fillBg(ctx, w, h, '#0a0314', '#020005');

        // 1.星空（不变）
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        stars.forEach(s=>{
            s.y += s.sp;
            if(s.y>h){s.y=0;s.x=_R()*w;}
            ctx.beginPath();ctx.arc(s.x,s.y,s.size,0,_P*2);ctx.fill();
        });

        // 2.落日（不变）
        var sunR = Math.min(w, h) * 0.045;
        var sunX = w/2;
        var sunY = horizon + sunR * 0.15;
        var sunG = ctx.createLinearGradient(sunX, sunY-sunR, sunX, sunY);
        sunG.addColorStop(0, '#ff007f');
        sunG.addColorStop(0.5, '#ff5e00');
        sunG.addColorStop(1, '#ffeb3b');
        for (var y = sunY - sunR; y <= sunY; y += 2) {
            var progress = (y - (sunY - sunR)) / sunR;
            var gap = progress * progress * 4;
            if (y % 10 < gap) continue;
            var wAtY = Math.sqrt(sunR*sunR - Math.pow(y-sunY,2));
            ctx.fillStyle = sunG;
            ctx.fillRect(sunX - wAtY, y, wAtY*2, 2);
        }

        // 3.透视公路网格（保留你原有的绘制方式）
        ctx.lineWidth = 1.5;
        var gridCount = 22;
        // 纵向放射边线
        for(var i=0;i<=gridCount;i++){
            var ratio = i/gridCount;
            var xBot = (ratio-0.5)*(w*3.2)+w/2;
            var grad = ctx.createLinearGradient(w/2, horizon, xBot, h);
            grad.addColorStop(0, 'rgba(0,242,254,0)');
            grad.addColorStop(1, 'rgba(0,242,254,0.65)');
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(w/2, horizon);
            ctx.lineTo(xBot, h);
            ctx.stroke();
        }
        // 横向滚动格
        var speedOff = (t*2.5)%1;
        var hLines = 12;
        for(var i=0;i<hLines;i++){
            var pos = (i+speedOff)/hLines;
            var lineY = horizon + (h-horizon)*Math.pow(pos,3);
            var alpha = Math.pow(pos,2)*0.72;
            ctx.strokeStyle = 'rgba(255,0,127,'+alpha+')';
            ctx.beginPath();
            ctx.moveTo(0,lineY);ctx.lineTo(w,lineY);ctx.stroke();
        }

        // 4.楼房（不变）
        ctx.lineWidth = 1.2;
        buildings.forEach(b=>{
            var scale = b.depth;
            var bH = b.bh * scale;
            var bW = b.bw * scale;
            var baseY = horizon - bH;
            if(baseY > horizon || bW < 1 || bH < 3) return;
            var centerOffset = w * 0.38 * scale;
            var bx = w/2 + b.side * centerOffset;
            ctx.strokeStyle = b.color;
            ctx.strokeRect(bx - bW/2, baseY, bW, bH);
            ctx.beginPath();
            ctx.moveTo(bx - bW/2, baseY + bH*0.4);
            ctx.lineTo(bx + bW/2, baseY + bH*0.4);
            ctx.moveTo(bx, baseY);
            ctx.lineTo(bx, baseY + bH);
            ctx.stroke();
        });

        // 5.树木（不变）
        trees.forEach(tr=>{
            var scale = tr.dist;
            var tH = tr.h * scale;
            var tW = tr.w * scale;
            var yPos = horizon + (h-horizon)*Math.pow(tr.dist,3);
            var xOff = w/2 + tr.side * (w*0.45*scale);
            ctx.fillStyle = 'rgba(8,1,20,0.96)';
            ctx.fillRect(xOff - tW*0.25, yPos - tH, tW*0.5, tH);
            ctx.beginPath();
            ctx.moveTo(xOff - tW, yPos - tH);
            ctx.lineTo(xOff, yPos - tH - tH*0.6);
            ctx.lineTo(xOff + tW, yPos - tH);
            ctx.closePath();ctx.fill();
        });

        // ========== 6. 车辆：严格贴合纵向放射线（直线轨迹） ==========
        ctx.lineWidth = 1.5;
        cars.forEach(car => {
            // 深度递增（向屏幕下方移动）
            car.depth += car.speed;
            // 超出底部则重置到地平线附近
            if (car.depth >= 1.0) {
                car.depth = 0.02;      // 稍高于地平线，避免出现太突兀
                // 可选：重置时随机更换车道，增加变化
                car.laneRatio = laneRatios[Math.floor(Math.random() * laneRatios.length)];
            }
            let scale = car.depth;      // 0~1

            // 关键修正1：Y坐标采用线性插值（与纵向放射线一致）
            let carY = horizon + (h - horizon) * scale;

            // 关键修正2：根据线性插值计算当前深度的道路左右边界（与放射线一致）
            let leftX = w/2 + (roadLeftBottom - w/2) * scale;
            let rightX = w/2 + (roadRightBottom - w/2) * scale;
            // 按车道比例计算X
            let carX = leftX + (rightX - leftX) * car.laneRatio;

            // 车身尺寸随深度线性缩放
            let cW = 22 * scale;
            let cH = 10 * scale;
            if (cW < 2 || cH < 2) return; // 太小不画

            ctx.strokeStyle = car.color;
            // 轿车轮廓
            ctx.beginPath();
            ctx.moveTo(carX - cW/2, carY - cH * 0.7);
            ctx.lineTo(carX - cW/4, carY - cH);
            ctx.lineTo(carX + cW/4, carY - cH);
            ctx.lineTo(carX + cW/2, carY - cH * 0.7);
            ctx.lineTo(carX + cW/2, carY - cH * 0.2);
            ctx.lineTo(carX - cW/2, carY - cH * 0.2);
            ctx.closePath();
            ctx.stroke();
            // 车轮
            ctx.beginPath();
            ctx.arc(carX - cW/3, carY - cH*0.2, cH*0.15, 0, _P*2);
            ctx.arc(carX + cW/3, carY - cH*0.2, cH*0.15, 0, _P*2);
            ctx.stroke();
        });

        // 地平线极光光晕（不变）
        var horizG = ctx.createLinearGradient(0, horizon - 2, 0, horizon + 18);
        horizG.addColorStop(0, 'rgba(255, 235, 59, 0.42)');
        horizG.addColorStop(0.22, 'rgba(0, 242, 254, 0.32)');
        horizG.addColorStop(1, 'transparent');
        ctx.fillStyle = horizG;
        ctx.fillRect(0, horizon - 2, w, 22);

        ctx.globalCompositeOperation = 'source-over';
        aid = requestAnimationFrame(draw);
    }
    draw();
});