// player.js - 完整版
let isDraggingProgress = false;
let spectrumAnimationId = null;
let spectrumCanvasCtx = null;

function formatTime(sec) { 
    if (isNaN(sec)) return '00:00';
    let m = Math.floor(sec / 60), s = Math.floor(sec % 60); 
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; 
}

function initPlayerControls(audio, playPauseBtn, prevBtn, nextBtn, progressBar, currentTimeSpan, durationSpan, volumeCtrl, onPlayNext) {
    // 初始化进度条颜色填充和位置
    if (progressBar) {
        progressBar.value = 0;
        progressBar.style.setProperty('--pct', '0%');
        progressBar.style.setProperty('--bufpct', '0%');
    }
    if (playPauseBtn) {
        playPauseBtn.onclick = () => {
            // 如果音频未加载但有当前歌曲（如刷新后恢复的 AList 歌曲），重新播放
            if ((!audio.src || audio.src === '') && typeof window.playSongByIndex === 'function') {
                window.playSongByIndex(window.currentIndex || 0);
                return;
            }
            if (!audio.src || audio.src === '') return;
            if (window.isPlaying) { audio.pause(); window.isPlaying = false; updatePlayButton(playPauseBtn, false); }
            else { audio.play().catch(function() {}); window.isPlaying = true; updatePlayButton(playPauseBtn, true); }
        };
    }
    
    if (prevBtn) prevBtn.onclick = () => onPlayNext('prev');
    if (nextBtn) nextBtn.onclick = () => onPlayNext('next');
    
    // 自动下一首（锁屏/后台兼容：先试 play，后台则等用户回来）
    audio.addEventListener('ended', function() {
        if (typeof window._bgPlayNext === 'function') {
            window._bgPlayNext();
        } else {
            setTimeout(function() { onPlayNext('next'); }, 100);
        }
    });
    
    if (progressBar) {
        progressBar.addEventListener('mousedown', () => { isDraggingProgress = true; });
        progressBar.addEventListener('mouseup', () => { isDraggingProgress = false; });
        progressBar.addEventListener('input', (e) => {
            if (audio.duration && isFinite(audio.duration)) {
                var pct = parseFloat(e.target.value);
                var target = pct * audio.duration;
                // 颜色始终跟随圆球位置
                progressBar.style.setProperty('--pct', (pct * 100) + '%');
                if (currentTimeSpan) currentTimeSpan.textContent = formatTime(target);
                // 检查目标时间是否在已缓冲范围内
                var canSeek = false;
                try {
                    for (var i = 0; i < audio.buffered.length; i++) {
                        if (target >= audio.buffered.start(i) - 0.5 && target <= audio.buffered.end(i) + 0.5) {
                            canSeek = true; break;
                        }
                    }
                    var totalBuf = 0;
                    for (var i = 0; i < audio.buffered.length; i++) totalBuf += audio.buffered.end(i) - audio.buffered.start(i);
                    if (totalBuf / audio.duration > 0.95) canSeek = true;
                } catch(e) { canSeek = true; }
                if (canSeek) {
                    audio.currentTime = target;
                }
            }
        });
    }
    
    // 缓冲进度：基于 audio.buffered（浏览器真实下载进度）
    // pct 可选参数：从 timeupdate 传入时复用已有值，避免重读 DOM
    function updateBufferProgress(pct) {
        if (!progressBar || !audio) return;
        try {
            var bufPct = 0;
            if (audio.duration && isFinite(audio.duration) && audio.buffered.length > 0) {
                var bufEnd = audio.buffered.end(audio.buffered.length - 1);
                bufPct = Math.min(100, (bufEnd / audio.duration) * 100);
            }
            var curPct = pct !== undefined ? (pct * 100) : (parseFloat(progressBar.style.getPropertyValue('--pct')) || 0);
            if (bufPct < curPct) bufPct = curPct;
            progressBar.style.setProperty('--bufpct', Math.min(100, bufPct) + '%');
        } catch(e) {}
    }

    audio.addEventListener('timeupdate', () => {
        if (audio.duration && isFinite(audio.duration) && !isDraggingProgress && progressBar) {
            var pct = audio.currentTime / audio.duration;
            progressBar.value = pct;
            progressBar.style.setProperty('--pct', (pct * 100) + '%');
            if (currentTimeSpan) currentTimeSpan.textContent = formatTime(audio.currentTime);
            updateBufferProgress(pct);
        } else {
            updateBufferProgress();
        }
    });

    // progress 事件：浏览器在加载更多数据时触发，反映缓冲状态
    audio.addEventListener('progress', updateBufferProgress);
    
    audio.addEventListener('loadedmetadata', () => {
        if (durationSpan) durationSpan.textContent = formatTime(audio.duration);
        if (progressBar) {
            progressBar.value = 0;
            progressBar.style.setProperty('--pct', '0%');
            progressBar.style.setProperty('--bufpct', '0%');
        }
    });
    
    if (volumeCtrl) {
        // 用滑块的当前值初始化，确保颜色与滑块位置一致
        var initVol = parseFloat(volumeCtrl.value) || 0.7;
        audio.volume = Math.max(0, Math.min(1, initVol));
        volumeCtrl.style.setProperty('--vpct', (initVol * 100) + '%');

        volumeCtrl.addEventListener('input', (e) => {
            var v = parseFloat(e.target.value);
            audio.volume = v;
            volumeCtrl.style.setProperty('--vpct', (v * 100) + '%');
        });
    }
}

function initFontControl(fontSlider, fontVal, lyricsBox) {
    if (fontSlider) {
        fontSlider.oninput = () => { 
            lyricsBox.style.fontSize = fontSlider.value + 'px'; 
            fontVal.innerText = fontSlider.value + 'px'; 
        };
    }
}