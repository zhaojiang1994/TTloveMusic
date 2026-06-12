// TTplayer 移动版入口
(function() {
    if (!document.querySelector('.mobile-app')) return;

    var audio = document.getElementById('mobileAudio');
    var playBtn = document.getElementById('mobilePlayBtn');
    var prevBtn = document.getElementById('mobilePrevBtn');
    var nextBtn = document.getElementById('mobileNextBtn');
    var songTitle = document.getElementById('mobileSongTitle');
    var songArtist = document.getElementById('mobileSongArtist');
    var progressFill = document.getElementById('mobileProgressFill');
    var progressThumb = document.getElementById('mobileProgressThumb');
    var progressTrack = document.getElementById('mobileProgressTrack');
    var currentTimeSpan = document.getElementById('mobileCurTime');
    var durationSpan = document.getElementById('mobileDur');
    var listContainer = document.getElementById('mobileListContainer');
    var searchInput = document.getElementById('mobileSearchInput');
    var lyricsBox = document.getElementById('lyricsBox');
    var themeSelect = document.getElementById('mobileThemeSelect');
    var effectSelect = document.getElementById('mobileEffectSelect');

    var allSongs = [];
    var currentIndex = 0;
    window.isPlaying = false;
    window.favoriteSet = new Set();
    try { JSON.parse(localStorage.getItem('ttplayer-fav') || '[]').forEach(function(s) { window.favoriteSet.add(s); }); } catch(e) {}
    var favSet = window.favoriteSet;

    function toggleFav(src) {
        if (favSet.has(src)) favSet.delete(src);
        else favSet.add(src);
        localStorage.setItem('ttplayer-fav', JSON.stringify(Array.from(favSet)));
        window.favoriteSet = favSet;
        renderList(allSongs);
    }

    // ===== 初始化 =====
    function init() {
        try {
            var saved = localStorage.getItem('MUSIC_LIBRARY_CACHE');
            if (saved) allSongs = JSON.parse(saved);
            if (allSongs.length > 0) renderList(allSongs);
        } catch(e) {}

        if (typeof window.initLibrary === 'function' && allSongs.length === 0) {
            window.initLibrary().then(function(songs) {
                if (songs && songs.length) {
                    allSongs = songs;
                    renderList(allSongs);
                }
            }).catch(function() {});
        }

        if (effectSelect && window.EFFECT_MANIFEST) {
            effectSelect.innerHTML = EFFECT_MANIFEST.map(function(m) {
                return '<option value="' + m.id + '">' + m.label + '</option>';
            }).join('');
        }

        if (typeof window.initEffects === 'function') {
            window.initEffects(effectSelect, document.getElementById('lyricsBgEffect'));
        }

        // 设置默认音量
        if (audio) audio.volume = 0.7;
    }

    // ===== 渲染列表 =====
    function renderList(songs) {
        if (!listContainer) return;
        var searchText = searchInput ? searchInput.value.toLowerCase() : '';
        var filtered = songs;
        if (searchText) {
            filtered = songs.filter(function(s) {
                return (s.name && s.name.toLowerCase().includes(searchText)) ||
                       (s.artist && s.artist.toLowerCase().includes(searchText));
            });
        }
        filtered.sort(function(a, b) {
            var af = favSet.has(a.src) ? 0 : 1;
            var bf = favSet.has(b.src) ? 0 : 1;
            return af - bf;
        });
        listContainer.innerHTML = filtered.map(function(s) {
            var isFav = favSet.has(s.src);
            return '<div class="mobile-song-item song-item" data-src="' + s.src + '">' +
                '<span class="mobile-fav"><i class="' + (isFav ? 'fas' : 'far') + ' fa-heart"></i></span>' +
                '<div class="mobile-song-display">' +
                '<span class="mobile-song-name">' + escapeHtml(s.name) + '</span>' +
                '<span class="mobile-song-artist-sm artist-text">' + escapeHtml(s.artist || '未知') + '</span>' +
                '</div>' +
                '<span class="mobile-song-duration song-duration">' + (s.duration && s.duration !== '--:--' ? s.duration : '') + '</span>' +
                '</div>';
        }).join('');

        listContainer.querySelectorAll('.mobile-fav').forEach(function(el) {
            el.onclick = function(e) {
                e.stopPropagation();
                var item = this.closest('.mobile-song-item');
                if (!item) return;
                toggleFav(item.dataset.src);
            };
        });

        listContainer.querySelectorAll('.mobile-song-item').forEach(function(item) {
            item.onclick = function(e) {
                if (e.target.closest('.mobile-fav')) return;
                var src = this.dataset.src;
                for (var i = 0; i < allSongs.length; i++) {
                    if (allSongs[i].src === src) { playSong(i); break; }
                }
            };
        });
    }

    // ===== 播放 =====
    function playSong(idx) {
        if (idx < 0 || idx >= allSongs.length) return;
        currentIndex = idx;
        var song = allSongs[idx];
        songTitle.innerText = song.name;
        songArtist.innerText = song.artist || '未知歌手';

        if (typeof loadSongLyrics === 'function') {
            loadSongLyrics(song, lyricsBox, audio);
        }

        audio.src = song.src;
        audio.load();
        audio.play().then(function() {
            window.isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }).catch(function(e) {
            console.error('播放失败:', e);
        });
    }

    // ===== 控制按钮 =====
    playBtn.onclick = function() {
        if (audio.paused) {
            if (!audio.src) return;
            audio.play();
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            window.isPlaying = true;
        } else {
            audio.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            window.isPlaying = false;
        }
    };
    prevBtn.onclick = function() { playSong(currentIndex - 1); };
    nextBtn.onclick = function() { playSong(currentIndex + 1); };

    // ===== 音量 =====
    var volCtrl = document.getElementById('mobileVolumeCtrl');
    var volIcon = document.getElementById('mobileVolumeIcon');
    if (volCtrl) {
        volCtrl.addEventListener('input', function() {
            audio.volume = this.value;
            if (volIcon) {
                volIcon.className = this.value == 0 ? 'fas fa-volume-off' :
                    this.value < 0.3 ? 'fas fa-volume-down' : 'fas fa-volume-up';
            }
        });
        volIcon.onclick = function() {
            if (audio.volume > 0) {
                audio._savedVol = audio.volume;
                audio.volume = 0;
                volCtrl.value = 0;
            } else {
                audio.volume = audio._savedVol || 0.7;
                volCtrl.value = audio.volume;
            }
        };
    }

    // ===== 进度 =====
    audio.addEventListener('timeupdate', function() {
        var ct = audio.currentTime;
        var dur = audio.duration || 0;
        currentTimeSpan.innerText = formatTime(ct);
        if (dur > 0) {
            var pct = (ct / dur * 100);
            progressFill.style.width = pct + '%';
            progressThumb.style.left = pct + '%';
        }
    });
    audio.addEventListener('durationchange', function() {
        durationSpan.innerText = formatTime(audio.duration);
    });
    progressTrack.addEventListener('click', function(e) {
        var rect = this.getBoundingClientRect();
        var pct = (e.clientX - rect.left) / rect.width;
        if (audio.duration) audio.currentTime = pct * audio.duration;
    });

    // ===== 搜索 =====
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderList(allSongs);
        });
    }

    // ===== 主题 =====
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            if (typeof loadTheme === 'function') loadTheme(this.value);
        });
    }

    // ===== 标签切换 =====
    document.querySelectorAll('.mobile-tab').forEach(function(tab) {
        tab.onclick = function() {
            var viewId = this.dataset.view;
            if (!viewId) return;
            document.querySelectorAll('.mobile-tab').forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            document.querySelectorAll('.mobile-view').forEach(function(v) { v.style.display = 'none'; });
            var target = document.getElementById(viewId);
            if (target) target.style.display = 'flex';
        };
    });

    // ===== 键盘 =====
    document.addEventListener('keydown', function(e) {
        if (e.key === ' ') { e.preventDefault(); playBtn.click(); }
    });

    // ===== 添加来源 =====
    var addBtn = document.getElementById('mobileAddSourceBtn');
    if (addBtn) {
        addBtn.onclick = function() {
            if (typeof showAddSourceDialog === 'function') {
                showAddSourceDialog();
            } else {
                var name = prompt('来源名称：') || '';
                var url = prompt('输入音乐文件夹地址：\n（HTTP 地址，如 http://192.168.x.x/music/）');
                if (!url) return;
                if (typeof addMusicSource === 'function') {
                    addMusicSource(url, name || url.split('/').pop());
                    init();
                }
            }
        };
    }

    // ===== 扫描库 =====
    if (typeof getMusicSources === 'function' && typeof fetchRealMusicLibrary === 'function') {
        var sources = getMusicSources();
        if (sources.length > 0 && allSongs.length === 0) {
            fetchRealMusicLibrary().then(function(songs) {
                if (songs && songs.length) {
                    allSongs = songs;
                    renderList(allSongs);
                    localStorage.setItem('MUSIC_LIBRARY_CACHE', JSON.stringify(songs));
                }
            }).catch(function() {});
        }
    }

    init();
})();
