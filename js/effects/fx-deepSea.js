EffectRegister('deepSea', function(w, h, ctx, cv, act) {
        var t = 0;
        var lastTime = 0;

        // ========== 鱼群配置（可自由调节）==========
        var FishConfig = {
            TOTAL_COUNT: 45,                    // 鱼群总数
            SMALL_RATIO: 0.60,                  // 小鱼比例 60%
            MEDIUM_RATIO: 0.20,                // 中鱼比例 20%
            LARGE_RATIO: 0.20,                 // 大鱼比例 20%
            SMALL_SIZE: 0.65,                  // 小鱼大小乘数
            MEDIUM_SIZE: 0.85,                 // 中鱼大小乘数
            LARGE_SIZE: 1.15,                  // 大鱼大小乘数
            CLOWN_RATIO: 0.55,                 // 小丑鱼比例
            // Boid参数（调低防止抖动）
            SEPARATION_DIST: 28,               // 分离距离（增大让鱼更松散）
            ALIGNMENT_DIST: 65,               // 对齐距离
            COHESION_DIST: 90,                // 聚集距离
            SEPARATION_FORCE: 0.06,           // 分离力（降低防抖）
            ALIGNMENT_FORCE: 0.03,            // 对齐力
            COHESION_FORCE: 0.004,            // 聚集力（降低防抖）
            MAX_SPEED: 0.9,                   // 最大速度
            MAX_FORCE: 0.05                   // 最大转向力
        };

        // ========== 1. 波光粼粼的海面（不是直射光柱）==========
        function drawWaterAndGlitter() {
            // 深海渐变
            var waterGrad = ctx.createLinearGradient(0, 0, 0, h);
            waterGrad.addColorStop(0, "#4ab8d8");
            waterGrad.addColorStop(0.3, "#3aa0c0");
            waterGrad.addColorStop(0.6, "#2a80a0");
            waterGrad.addColorStop(0.85, "#1a6080");
            waterGrad.addColorStop(1, "#0a4868");
            ctx.fillStyle = waterGrad;
            ctx.fillRect(0, 0, w, h);

            // 波光粼粼效果（大量闪烁光斑，不是直射光柱）
            ctx.globalCompositeOperation = 'lighter';
            for (var i = 0; i < 80; i++) {
                var x = (i * 73 + t * 45) % (w + 150) - 75;
                var y = 15 + Math.sin(i * 0.5 + t * 4) * 12 + Math.cos(i * 0.3) * 8;
                var size = 2 + Math.sin(i * 0.8 + t * 6) * 1.5;
                var alpha = 0.08 + Math.sin(i * 0.6 + t * 5) * 0.06;
                ctx.fillStyle = "rgba(255, 245, 200, " + alpha + ")";
                ctx.beginPath();
                ctx.ellipse(x, y, size, size * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // 第二层细碎光斑
            for (var i = 0; i < 120; i++) {
                var x = (i * 131 + t * 28) % (w + 200) - 100;
                var y = 25 + Math.sin(i * 0.8 + t * 3.5) * 15;
                ctx.fillStyle = "rgba(255, 255, 210, 0.06)";
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        // ========== 2. 漂浮粒子 ==========
        var particles = [];
        function initParticles() {
            particles = [];
            for (var i = 0; i < 180; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.05,
                    vy: (Math.random() - 0.5) * 0.03 - 0.01,
                    size: 0.5 + Math.random() * 1.2,
                    alpha: 0.04 + Math.random() * 0.1,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
        function drawParticles() {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                if (p.x > w + 30) p.x = -20;
                if (p.x < -30) p.x = w + 20;
                if (p.y > h + 30) p.y = -20;
                if (p.y < -30) p.y = h + 20;
                var flicker = 0.6 + 0.4 * Math.sin(t * 1.5 + p.phase);
                ctx.fillStyle = "rgba(180, 210, 240, " + (p.alpha * flicker) + ")";
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.6 * flicker, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // ========== 3. 气泡 ==========
        var bubbles = [];
        function initBubbles() {
            bubbles = [];
            for (var i = 0; i < 40; i++) {
                bubbles.push({
                    x: Math.random() * w,
                    y: h - Math.random() * 80,
                    size: 1 + Math.random() * 2.5,
                    vy: -0.15 - Math.random() * 0.25,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: 0.3 + Math.random() * 0.6
                });
            }
        }
        function drawBubbles() {
            for (var i = 0; i < bubbles.length; i++) {
                var b = bubbles[i];
                b.y += b.vy;
                b.x += Math.sin(t * b.wobbleSpeed + b.wobble) * 0.15;
                if (b.y < 10) {
                    b.y = h - 20;
                    b.x = Math.random() * w;
                }
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(180, 210, 240, 0.4)";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(220, 235, 255, 0.6)";
                ctx.fill();
            }
        }

        // ========== 4. 高挑海草（数量少但高）==========
        var seaweeds = [];
        function Seaweed(x, baseY, height, color) {
            this.x = x;
            this.baseY = baseY;
            this.height = height;
            this.color = color;
            this.phase = Math.random() * Math.PI * 2;
            this.freq = 0.7 + Math.random() * 0.5;
        }
        Seaweed.prototype.draw = function(ctx, time) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, this.baseY);
            var steps = 20;
            var segH = this.height / steps;
            for (var i = 1; i <= steps; i++) {
                var r = i / steps;
                var y = this.baseY - r * this.height;
                var offsetX = 5 * Math.sin(time * this.freq + this.phase + r * Math.PI * 2);
                var cp1x = this.x + offsetX * 0.35;
                var cp1y = y + segH * 0.35;
                var cp2x = this.x + offsetX * 0.7;
                var cp2y = y + segH * 0.7;
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, this.x + offsetX, y);
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.stroke();
            ctx.restore();
        };

        // ========== 5. 鱼群（大小可配置，不抖动）==========
        var fishSchool = [];

        function getFishSize() {
            var rand = Math.random();
            if (rand < FishConfig.SMALL_RATIO) return FishConfig.SMALL_SIZE;
            if (rand < FishConfig.SMALL_RATIO + FishConfig.MEDIUM_RATIO) return FishConfig.MEDIUM_SIZE;
            return FishConfig.LARGE_SIZE;
        }

        function MiniFish(x, y, vx, vy, type) {
            this.x = x;
            this.y = y;
            this.vx = (vx === undefined || vx === 0) ? 0.5 : vx;
            this.vy = (vy === undefined) ? 0 : vy;
            this.type = type || (Math.random() < FishConfig.CLOWN_RATIO ? "clown" : "yellow");
            this.tailPhase = Math.random() * Math.PI * 2;
            this.bodyWave = Math.random() * Math.PI * 2;
            this.waveSpeed = 3 + Math.random() * 3;
            this.size = getFishSize();
        }

        MiniFish.prototype.update = function(fishList, delta, w, h) {
            var ax = 0, ay = 0;
            var neighborCount = 0;
            var centerX = 0, centerY = 0;
            var avgVx = 0, avgVy = 0;

            for (var i = 0; i < fishList.length; i++) {
                var other = fishList[i];
                if (other === this) continue;

                var dx = this.x - other.x;
                var dy = this.y - other.y;
                var dist = Math.hypot(dx, dy);

                if (dist < FishConfig.SEPARATION_DIST && dist > 0.01) {
                    ax += (dx / dist) * FishConfig.SEPARATION_FORCE;
                    ay += (dy / dist) * FishConfig.SEPARATION_FORCE;
                }

                if (dist < FishConfig.ALIGNMENT_DIST) {
                    avgVx += other.vx;
                    avgVy += other.vy;
                    centerX += other.x;
                    centerY += other.y;
                    neighborCount++;
                }
            }

            if (neighborCount > 0) {
                avgVx /= neighborCount;
                avgVy /= neighborCount;
                ax += (avgVx - this.vx) * FishConfig.ALIGNMENT_FORCE;
                ay += (avgVy - this.vy) * FishConfig.ALIGNMENT_FORCE;

                centerX /= neighborCount;
                centerY /= neighborCount;
                var towardX = centerX - this.x;
                var towardY = centerY - this.y;
                var distToCenter = Math.hypot(towardX, towardY);
                if (distToCenter > 0.01) {
                    ax += (towardX / distToCenter) * FishConfig.COHESION_FORCE;
                    ay += (towardY / distToCenter) * FishConfig.COHESION_FORCE;
                }
            }

            var forceMag = Math.hypot(ax, ay);
            if (forceMag > FishConfig.MAX_FORCE) {
                ax = ax / forceMag * FishConfig.MAX_FORCE;
                ay = ay / forceMag * FishConfig.MAX_FORCE;
            }

            this.vx += ax;
            this.vy += ay;

            var speed = Math.hypot(this.vx, this.vy);
            if (speed > FishConfig.MAX_SPEED) {
                this.vx = this.vx / speed * FishConfig.MAX_SPEED;
                this.vy = this.vy / speed * FishConfig.MAX_SPEED;
            }
            if (speed < 0.2 && neighborCount > 3) {
                this.vx += (Math.random() - 0.5) * 0.02;
                this.vy += (Math.random() - 0.5) * 0.01;
            }

            this.x += this.vx * delta * 30;
            this.y += this.vy * delta * 30;
            this.bodyWave += this.waveSpeed * delta;

            // 边界环绕
            if (this.x > w + 40) this.x = -30;
            if (this.x < -40) this.x = w + 30;
            if (this.y > h - 45) this.y = h - 50;
            if (this.y < 75) this.y = 80;

            this.tailPhase += 8 * delta;
        };

        MiniFish.prototype.draw = function(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            var dir = this.vx > 0 ? 1 : -1;
            ctx.scale(dir, 1);
            var waveOffset = Math.sin(this.bodyWave) * 0.4;
            var s = this.size;

            if (this.type === "clown") {
                ctx.fillStyle = "#ff7800";
                ctx.beginPath();
                ctx.ellipse((0 + waveOffset * 0.2) * s, 0, 6.5 * s, 3.8 * s, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.ellipse((-1.5 + waveOffset * 0.15) * s, 0, 1.6 * s, 3 * s, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse((2 + waveOffset * 0.1) * s, 0, 1.3 * s, 2.6 * s, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = "#ffcc44";
                ctx.beginPath();
                ctx.ellipse((0 + waveOffset * 0.2) * s, 0, 6 * s, 3.5 * s, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffaa22";
                ctx.beginPath();
                ctx.ellipse((0 + waveOffset * 0.15) * s, -1.5 * s, 2.5 * s, 2 * s, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc((2.8 + waveOffset * 0.12) * s, -1.2 * s, 1.1 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#222222";
            ctx.beginPath();
            ctx.arc((3.1 + waveOffset * 0.12) * s, -1.4 * s, 0.6 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc((3.3 + waveOffset * 0.12) * s, -1.7 * s, 0.25 * s, 0, Math.PI * 2);
            ctx.fill();

            var tailAng = Math.sin(this.tailPhase) * 0.5;
            ctx.save();
            ctx.translate((-5.5 + waveOffset * 0.1) * s, 0);
            ctx.rotate(tailAng);
            ctx.fillStyle = this.type === "clown" ? "#ff7800" : "#ffcc44";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-3 * s, -2 * s);
            ctx.lineTo(-1.5 * s, 0);
            ctx.lineTo(-3 * s, 2 * s);
            ctx.fill();
            ctx.restore();
            ctx.restore();
        };

        // ========== 重新加载鱼群 ==========
        function initFish() {
            fishSchool = [];
            for (var i = 0; i < FishConfig.TOTAL_COUNT; i++) {
                var x = 50 + Math.random() * (w - 100);
                var y = 100 + Math.random() * (h - 180);
                var angle = Math.random() * Math.PI * 2;
                var speed = 0.35 + Math.random() * 0.5;
                fishSchool.push(new MiniFish(
                    x, y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed * 0.3,
                    null
                ));
            }
        }

        // ========== 6. 呆萌鲨鱼 ==========
        var shark = { x: w * 0.7, y: h * 0.55, vx: -0.25, vy: 0 };
        SharkBehavior = {
            update: function(delta, w, h) {
                this.x += this.vx * delta * 12;
                if (this.x < -100) this.x = w + 90;
                if (this.x > w + 110) this.x = -90;
                this.y += Math.sin(t * 0.18) * 0.25 * delta * 10;
                this.y = Math.min(h - 60, Math.max(90, this.y));
            },
            draw: function(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                var dir = this.vx > 0 ? 1 : -1;
                ctx.scale(dir, 1);
                ctx.fillStyle = "#6a8aaa";
                ctx.beginPath();
                ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#8aaac8";
                ctx.beginPath();
                ctx.ellipse(0, -1.5, 19, 6.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#b8d0e0";
                ctx.beginPath();
                ctx.ellipse(0, 2.5, 18, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(13, -2.5, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#4a6a8a";
                ctx.beginPath();
                ctx.arc(14, -3, 1.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(15, -3.8, 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(10, 1, 3.8, 0.1, Math.PI - 0.1);
                ctx.strokeStyle = "#5a7a9a";
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.fillStyle = "#6a8aaa";
                ctx.beginPath();
                ctx.moveTo(2, -8);
                ctx.lineTo(7, -11);
                ctx.lineTo(12, -7);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-20, 0);
                ctx.lineTo(-24, -3);
                ctx.lineTo(-22, 0);
                ctx.lineTo(-24, 3);
                ctx.fill();
                ctx.restore();
            }
        };
        Object.setPrototypeOf(shark, SharkBehavior);

        // ========== 7. 梦幻鲸鱼 ==========
        var whale = {
            active: false,
            x: -200,
            y: h * 0.4,
            vx: 0.45,
            timer: 0,
            interval: 35,
            rainbowTimer: 0
        };
        WhaleBehavior = {
            update: function(delta, w, h) {
                if (!this.active) {
                    this.timer += delta;
                    if (this.timer >= this.interval) {
                        this.active = true;
                        this.timer = 0;
                        this.x = -150;
                        this.y = h * 0.38 + Math.random() * 15;
                    }
                } else {
                    this.x += this.vx * delta * 18;
                    this.y += Math.sin(t * 0.24) * 0.25 * delta * 8;
                    this.rainbowTimer += delta;
                    if (this.rainbowTimer > 0.12) this.rainbowTimer = 0;
                    if (this.x > w + 180) this.active = false;
                }
            },
            draw: function(ctx) {
                if (!this.active) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.fillStyle = "#a898d8";
                ctx.beginPath();
                ctx.ellipse(0, 0, 55, 21, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#c8b8e8";
                ctx.beginPath();
                ctx.ellipse(0, -2.5, 50, 16, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#e0d8f8";
                ctx.beginPath();
                ctx.ellipse(0, 5, 45, 11, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(38, -5, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#6a5a8a";
                ctx.beginPath();
                ctx.arc(39.5, -6, 1.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(33, 0.5, 5, 0.1, Math.PI - 0.1);
                ctx.strokeStyle = "#8a7aaa";
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.fillStyle = "#b8a8d8";
                ctx.beginPath();
                ctx.moveTo(22, 5);
                ctx.quadraticCurveTo(34, 14, 42, 10);
                ctx.lineTo(30, 3);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-52, 0);
                ctx.quadraticCurveTo(-59, -8, -62, -5);
                ctx.lineTo(-57, 0);
                ctx.lineTo(-62, 5);
                ctx.quadraticCurveTo(-59, 8, -52, 0);
                ctx.fill();
                if (this.rainbowTimer < 0.1) {
                    for (var r = 0; r < 4; r++) {
                        ctx.fillStyle = ["#ff8888", "#ffbb88", "#ffee88", "#88ff88"][r];
                        ctx.beginPath();
                        ctx.ellipse(42 + r * 2 - this.rainbowTimer * 14, -18 - r * 2, 2 - r * 0.3, 1.5 - r * 0.2, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }
        };
        Object.setPrototypeOf(whale, WhaleBehavior);

        // ========== 8. 糖果水母 ==========
        var jellyfishList = [];
        function CandyJellyfish(x, y, size) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.15 - 0.06;
            this.pulse = Math.random() * Math.PI * 2;
            this.tentaclePhase = Math.random() * Math.PI * 2;
        }
        CandyJellyfish.prototype.update = function(delta, w, h) {
            this.pulse += delta * 1.4;
            var contract = 0.75 + 0.25 * Math.sin(this.pulse);
            var speedMult = 0.85 + contract * 0.4;
            this.x += this.vx * delta * 9 * speedMult;
            this.y += this.vy * delta * 7 * speedMult;
            if (this.x < 20) this.x = 25;
            if (this.x > w - 20) this.x = w - 25;
            if (this.y < 40) this.y = 45;
            if (this.y > h - 65) this.y = h - 70;
            this.tentaclePhase += delta * 0.9;
        };
        CandyJellyfish.prototype.draw = function(ctx, time) {
            ctx.save();
            var contract = 0.75 + 0.25 * Math.sin(this.pulse);
            var r = this.size * 0.45 * contract;
            ctx.shadowBlur = 6;
            ctx.shadowColor = "rgba(200, 100, 180, 0.2)";
            var grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
            grad.addColorStop(0, "#ff88cc");
            grad.addColorStop(0.7, "#ff66aa");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, r, r * 0.48, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(255, 200, 220, 0.45)";
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, r * 0.28, r * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 0.7;
            for (var i = 0; i < 7; i++) {
                var ang = (i / 7) * Math.PI * 2;
                var offX = Math.cos(ang) * r * 0.6;
                var offY = Math.sin(ang) * r * 0.38;
                var len = 10 + Math.sin(time * 1.2 + this.tentaclePhase + i) * 3.5;
                var hue = (i * 50 + time * 45) % 360;
                ctx.beginPath();
                ctx.moveTo(this.x + offX, this.y + offY);
                ctx.quadraticCurveTo(
                    this.x + offX * 1.05 + Math.sin(time * 0.9 + i) * 1,
                    this.y + offY + len * 0.5,
                    this.x + offX * 0.85,
                    this.y + offY + len
                );
                ctx.strokeStyle = "hsl(" + hue + ", 70%, 58%)";
                ctx.stroke();
            }
            ctx.restore();
        };

        // ========== 精美版海龟 ==========
        var seaTurtle = {
            x: w * 0.7,
            y: h * 0.48,
            vx: -0.22,
            legPhase: 0,
            headBob: 0
        };

        TurtleBehavior = {
            update: function(delta, w, h) {
                this.x += this.vx * delta * 12;
                if (this.x < -120) this.x = w + 110;
                if (this.x > w + 130) this.x = -110;
                this.y = h * 0.5 + Math.sin(t * 0.2) * 2.5;
                this.legPhase += 1.2 * delta;
                this.headBob += 1.5 * delta;
            },
            draw: function(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                var dir = this.vx > 0 ? 1 : -1;
                ctx.scale(dir, 1);

                // === 1. 龟壳阴影 ===
                ctx.shadowBlur = 8;
                ctx.shadowColor = "rgba(0,0,0,0.2)";

                // === 2. 龟壳主体（立体渐变）===
                var shellGrad = ctx.createLinearGradient(-15, -15, 15, 10);
                shellGrad.addColorStop(0, "#7acc7a");
                shellGrad.addColorStop(0.5, "#5ab85a");
                shellGrad.addColorStop(1, "#3a9840");
                ctx.fillStyle = shellGrad;
                ctx.beginPath();
                ctx.ellipse(0, 0, 34, 26, 0, 0, Math.PI * 2);
                ctx.fill();

                // === 3. 龟壳高光（立体感）===
                ctx.fillStyle = "rgba(150, 220, 150, 0.5)";
                ctx.beginPath();
                ctx.ellipse(-6, -6, 18, 12, 0, 0, Math.PI * 2);
                ctx.fill();

                // === 4. 龟壳精致花纹 ===
                ctx.strokeStyle = "#2a7830";
                ctx.lineWidth = 1.2;
                ctx.shadowBlur = 2;

                // 中央主脊
                ctx.beginPath();
                ctx.moveTo(0, -18);
                ctx.quadraticCurveTo(0, 0, 0, 18);
                ctx.stroke();

                // 放射状花纹
                for (var i = 0; i < 10; i++) {
                    var angle = -Math.PI / 2 + (i / 10) * Math.PI;
                    var x1 = Math.cos(angle) * 8;
                    var y1 = Math.sin(angle) * 10;
                    var x2 = Math.cos(angle) * 18;
                    var y2 = Math.sin(angle) * 16;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }

                // 边缘小圆点装饰
                ctx.fillStyle = "#3a9840";
                for (var i = 0; i < 16; i++) {
                    var angle = (i / 16) * Math.PI * 2;
                    var x = Math.cos(angle) * 30;
                    var y = Math.sin(angle) * 22;
                    ctx.beginPath();
                    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // === 5. 头部（精致立体）===
                var headYaw = Math.sin(this.headBob) * 1.5;
                ctx.fillStyle = "#5aae5a";
                ctx.beginPath();
                ctx.ellipse(34 + headYaw * 0.3, -3 + Math.sin(this.headBob) * 1, 13, 11, 0.15, 0, Math.PI * 2);
                ctx.fill();

                // 头部高光
                ctx.fillStyle = "#7acc7a";
                ctx.beginPath();
                ctx.ellipse(36 + headYaw * 0.2, -6, 5, 4, 0, 0, Math.PI * 2);
                ctx.fill();

                // 头部斑点
                ctx.fillStyle = "#3a8830";
                for (var i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.arc(30 + i * 2 + headYaw * 0.2, -1, 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }

                // === 6. 大眼睛（精致有神）===
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(40 + headYaw * 0.2, -6.5, 3.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#1a2a1a";
                ctx.beginPath();
                ctx.arc(41 + headYaw * 0.15, -7, 1.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(42 + headYaw * 0.1, -8, 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(40, -5.5, 0.5, 0, Math.PI * 2);
                ctx.fill();

                // 眼睑线条
                ctx.beginPath();
                ctx.ellipse(41 + headYaw * 0.15, -7.5, 2, 1.2, 0.1, 0, Math.PI * 2);
                ctx.strokeStyle = "#3a7830";
                ctx.lineWidth = 0.6;
                ctx.stroke();

                // === 7. 精致嘴巴 ===
                ctx.beginPath();
                ctx.moveTo(44 + headYaw * 0.2, -3);
                ctx.quadraticCurveTo(47 + headYaw * 0.2, -4.5, 48 + headYaw * 0.2, -2.5);
                ctx.strokeStyle = "#2a6830";
                ctx.lineWidth = 0.8;
                ctx.stroke();

                // 微笑弧度
                ctx.beginPath();
                ctx.arc(39 + headYaw * 0.15, -1, 4, 0.05, Math.PI - 0.15);
                ctx.stroke();

                // 鼻孔
                ctx.fillStyle = "#2a6830";
                ctx.beginPath();
                ctx.arc(44 + headYaw * 0.2, -8.5, 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(46 + headYaw * 0.2, -8.5, 0.7, 0, Math.PI * 2);
                ctx.fill();

                // === 8. 前腿（精致桨状）===
                var legAngle = Math.sin(this.legPhase) * 0.45;
                ctx.shadowBlur = 3;

                ctx.save();
                ctx.translate(18, 14);
                ctx.rotate(legAngle);
                ctx.fillStyle = "#5aae5a";
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(7, -6, 16, -3);
                ctx.lineTo(14, 2);
                ctx.quadraticCurveTo(6, 1, 0, 2);
                ctx.fill();
                // 前腿纹路
                ctx.strokeStyle = "#3a8830";
                ctx.lineWidth = 0.6;
                for (var i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(6 + i * 3, -1);
                    ctx.lineTo(5 + i * 3, 1);
                    ctx.stroke();
                }
                ctx.restore();

                // === 9. 后腿 ===
                ctx.save();
                ctx.translate(-16, 15);
                ctx.rotate(-legAngle * 0.6);
                ctx.fillStyle = "#5aae5a";
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(6, -4, 13, -1);
                ctx.lineTo(11, 3);
                ctx.quadraticCurveTo(4, 2, 0, 2);
                ctx.fill();
                ctx.restore();

                // === 10. 精致尾巴 ===
                ctx.fillStyle = "#4a9e4a";
                ctx.beginPath();
                ctx.moveTo(-32, 2);
                ctx.quadraticCurveTo(-38, 0, -36, 5);
                ctx.quadraticCurveTo(-34, 4, -32, 3);
                ctx.fill();

                // === 11. 龟壳边缘金色镶边 ===
                ctx.beginPath();
                ctx.ellipse(0, 0, 34, 26, 0, 0, Math.PI * 2);
                ctx.strokeStyle = "#d4aa50";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // 边缘内侧细线
                ctx.beginPath();
                ctx.ellipse(0, 0, 31, 23, 0, 0, Math.PI * 2);
                ctx.strokeStyle = "#c49840";
                ctx.lineWidth = 0.8;
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.restore();
            }
        };
        Object.setPrototypeOf(seaTurtle, TurtleBehavior);
        // ========== 10. 玩具潜艇 ==========
        var submarine = {
            x: w * 0.3,
            y: h * 0.6,
            vx: 0.4,
            active: true
        };
        SubmarineBehavior = {
            update: function(delta, w, h) {
                this.x += this.vx * delta * 13;
                if (this.x > w + 100) this.x = -90;
                if (this.x < -100) this.x = w + 90;
                this.y += Math.sin(t * 0.16) * 0.25 * delta * 9;
            },
            draw: function(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                var dir = this.vx > 0 ? 1 : -1;
                ctx.scale(dir, 1);
                ctx.fillStyle = "#ffcc44";
                ctx.beginPath();
                ctx.ellipse(0, 0, 40, 9, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ffaa22";
                ctx.beginPath();
                ctx.ellipse(0, -1, 36, 7, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#ff5555";
                ctx.fillRect(-22, -1.8, 44, 3.8);
                ctx.fillStyle = "#ff8888";
                ctx.beginPath();
                ctx.moveTo(-8, -5);
                ctx.lineTo(-5, -12);
                ctx.lineTo(5, -12);
                ctx.lineTo(8, -5);
                ctx.fill();
                for (var i = 0; i < 4; i++) {
                    ctx.fillStyle = "#88ccff";
                    ctx.beginPath();
                    ctx.arc(-10 + i * 8, -1, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = "#ffffff";
                    ctx.beginPath();
                    ctx.arc(-10.5 + i * 8, -1.8, 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = "#ffaa66";
                ctx.beginPath();
                ctx.ellipse(40, 0, 4.5, 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = "rgba(255, 200, 100, 0.25)";
                ctx.beginPath();
                ctx.arc(42, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                ctx.globalCompositeOperation = 'source-over';
            }
        };
        Object.setPrototypeOf(submarine, SubmarineBehavior);

        // ========== 11. 海底地形 ==========
        function drawSeafloor() {
            ctx.fillStyle = "#c8a868";
            ctx.beginPath();
            ctx.moveTo(0, h - 22);
            for (var x = 0; x <= w; x += 25) {
                var y = h - 22 + Math.sin(x * 0.008 + t * 0.08) * 2;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.fill();

            for (var i = 0; i < 50; i++) {
                ctx.fillStyle = "rgba(200, 180, 100, 0.25)";
                ctx.beginPath();
                ctx.arc((i * 35) % w, h - 14 + Math.sin(i) * 1.5, 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ========== 12. 柔和雾效 ==========
        function drawSoftFog() {
            var fogGrad = ctx.createLinearGradient(0, 0, 0, h);
            fogGrad.addColorStop(0, "rgba(100, 150, 180, 0)");
            fogGrad.addColorStop(0.5, "rgba(80, 120, 150, 0.03)");
            fogGrad.addColorStop(1, "rgba(60, 100, 130, 0.06)");
            ctx.fillStyle = fogGrad;
            ctx.fillRect(0, 0, w, h);
        }

        // ========== 13. 初始化 ==========
        function initSeaweed() {
            seaweeds = [];
            for (var i = 0; i < 28; i++) {
                var x = 10 + i * 25 + Math.random() * 15;
                if (x > w - 20) break;
                var hVal = 55 + Math.random() * 35;
                var greenVal = 50 + Math.random() * 25;
                seaweeds.push(new Seaweed(x, h - 18, hVal, "rgb(45, " + greenVal + ", 50)"));
            }
        }

        function initJellyfish() {
            jellyfishList = [];
            for (var i = 0; i < 8; i++) {
                jellyfishList.push(new CandyJellyfish(
                    Math.random() * w,
                    60 + Math.random() * (h - 140),
                    10 + Math.random() * 8
                ));
            }
        }

        function init() {
            initSeaweed();
            initFish();
            initJellyfish();
            initParticles();
            initBubbles();
            shark.x = w * 0.75;
            submarine.x = w * 0.3;
            seaTurtle.x = w * 0.75;
            whale.active = false;
            whale.timer = 0;
        }

        // 监听配置变化重新加载鱼群
        var lastTotalCount = FishConfig.TOTAL_COUNT;

        // ========== 14. 主循环 ==========
        function draw() {
            if (!act()) return;
            var now = performance.now();
            if (!lastTime) lastTime = now;
            var delta = Math.min(0.033, (now - lastTime) / 1000);
            lastTime = now;
            t += delta;

            // 检测鱼群数量变化并重新加载
            if (FishConfig.TOTAL_COUNT !== lastTotalCount) {
                lastTotalCount = FishConfig.TOTAL_COUNT;
                initFish();
            }

            drawWaterAndGlitter();

            for (var i = 0; i < seaweeds.length; i++) seaweeds[i].draw(ctx, t);

            drawSeafloor();

            shark.update(delta, w, h);
            whale.update(delta, w, h);
            submarine.update(delta, w, h);
            seaTurtle.update(delta, w, h);
            for (var i = 0; i < fishSchool.length; i++) fishSchool[i].update(fishSchool, delta, w, h);
            for (var i = 0; i < jellyfishList.length; i++) jellyfishList[i].update(delta, w, h);

            whale.draw(ctx);

            fishSchool.sort(function(a, b) { return a.y - b.y; });
            for (var i = 0; i < fishSchool.length; i++) fishSchool[i].draw(ctx);

            shark.draw(ctx);

            for (var i = 0; i < jellyfishList.length; i++) jellyfishList[i].draw(ctx, t);

            seaTurtle.draw(ctx);
            submarine.draw(ctx);

            drawBubbles();
            drawParticles();
            drawSoftFog();

            requestAnimationFrame(draw);
        }

        init();
        draw();

        var resizeHandler = function() {
            setTimeout(function() { if (act()) init(); }, 100);
        };
        window.addEventListener('resize', resizeHandler);

        return function() { window.removeEventListener('resize', resizeHandler); };
    });