// ==================== 频谱核心引擎 ====================
(function() {
    let audioContext = null;
    let source = null;
    let analyser = null;
    let animationId = null;
    let isReady = false;

    let spectrumCanvas = null;
    let spectrumCtx = null;

    let currentHeights = [];
    let targetHeights = [];
    let waveY = [];
    let _dataArray = null;  // 持久化数组，避免每帧 GC 分配

    const params = {
        barCount: 64,
        smoothing: 0.42,
        minHeight: 4,
        useLogScale: true  // 使用对数刻度
    };

    function setCanvas(canvas) {
        spectrumCanvas = canvas;
        spectrumCtx = canvas.getContext('2d');
        initArrays();
    }

    function initArrays() {
        const h = spectrumCanvas.height;
        const bc = params.barCount;
        currentHeights = new Array(bc).fill(0);
        targetHeights = new Array(bc).fill(0);
        waveY = new Array(bc).fill(h / 2);
    }

    function initAudio(audioElement) {
        if (isReady) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;  // 增大到512，获取更多频率数据
            analyser.smoothingTimeConstant = 0.3;
            source = audioContext.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            isReady = true;
        } catch(e) {
            console.error('音频初始化失败:', e);
        }
    }

    // 对数映射：让高频也有数据
    function getMappedIndex(i, bc, maxIndex) {
        if (!params.useLogScale) {
            return Math.floor(i * maxIndex / bc);
        }
        // 对数曲线：低频分配更多索引，高频分配更少但保证有数据
        const t = i / bc;  // 0-1
        // 使用平方根曲线，让高频段也能映射到数据
        const mappedT = Math.sqrt(t);
        return Math.min(maxIndex - 1, Math.floor(mappedT * maxIndex));
    }

    var _fallbackTime = 0;
    function getTargetHeights(audioElement) {
        if (!isReady || !analyser || audioElement.paused) {
            _fallbackTime += 0.005;
            for(var i = 0; i < params.barCount; i++) {
                targetHeights[i] = Math.sin(_fallbackTime + i * 0.1) * 20 + 30;
            }
            return;
        }

        if (!_dataArray || _dataArray.length !== analyser.frequencyBinCount) {
            _dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(_dataArray);

        const bc = params.barCount;
        const h = spectrumCanvas.height;
        const dataLength = _dataArray.length;

        for(let i = 0; i < bc; i++) {
            // 使用对数映射获取索引
            const index = getMappedIndex(i, bc, dataLength);
            const value = _dataArray[index] / 255;
            targetHeights[i] = Math.max(params.minHeight, value * h * 0.8);
        }
    }

    function smoothHeights() {
        for(let i = 0; i < params.barCount; i++) {
            currentHeights[i] = currentHeights[i] * params.smoothing + targetHeights[i] * (1 - params.smoothing);
        }
    }

    function updateWaveY() {
        for(let i = 0; i < params.barCount; i++) {
            const targetY = spectrumCanvas.height - currentHeights[i];
            waveY[i] = waveY[i] * 0.8 + targetY * 0.2;
        }
    }

    // 切歌时重置音频分析节点
    function resetAudio() {
        if (isReady && analyser) {
            if (_dataArray) analyser.getByteFrequencyData(_dataArray);
            _fallbackTime = 0;
        }
        // 恢复音频上下文（可能被浏览器挂起）
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().catch(function() {});
        }
    }

    window.SpectrumCore = {
        setCanvas,
        initAudio,
        resetAudio,
        getTargetHeights,
        smoothHeights,
        updateWaveY,
        initArrays,
        get spectrumCanvas() { return spectrumCanvas; },
        get spectrumCtx() { return spectrumCtx; },
        get currentHeights() { return currentHeights; },
        get targetHeights() { return targetHeights; },
        get waveY() { return waveY; },
        get params() { return params; },
        get isReady() { return isReady; },
        get analyser() { return analyser; },
        get audioContext() { return audioContext; },
        get animationId() { return animationId; },
        set animationId(id) { animationId = id; }
    };
})();