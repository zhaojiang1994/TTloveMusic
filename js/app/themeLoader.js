// 主题加载器
(function() {
    const themes = {
        'classic': 'css/themes/classic.css',
        'bright': 'css/themes/bright.css',
        'dark': 'css/themes/dark.css',
        'vintage': 'css/themes/vintage.css',
        'future': 'css/themes/future.css',
        'qqmusic': 'css/themes/qqmusic.css',
        'kugou': 'css/themes/kugou.css',
        'netease': 'css/themes/netease.css',
        'qishui': 'css/themes/qishui.css',
        'sunset': 'css/themes/sunset.css',
        'forest': 'css/themes/forest.css',
        'cherry': 'css/themes/cherry.css',
        'ocean': 'css/themes/ocean.css',
        'coffee': 'css/themes/coffee.css',
        'silver': 'css/themes/silver.css',
        'parchment': 'css/themes/parchment.css',
        'purple': 'css/themes/purple.css',
        'purple-myth': 'css/themes/purple-myth.css',
        'xuanhei': 'css/themes/xuanhei.css',
        'yekong': 'css/themes/yekong.css',
        'orange': 'css/themes/orange.css',
        'chonghuizhiai': 'css/themes/chonghuizhiai.css',
        'ituneswhite': 'css/themes/ituneswhite.css',
        'yiting': 'css/themes/yiting.css',
        'qingping': 'css/themes/qingping.css',
        'ttplayer-classic': 'css/themes/ttplayer-classic.css',
        'ttplayer-dark': 'css/themes/ttplayer-dark.css',
        'xp-style': 'css/themes/xp-style.css',
        'win11-style': 'css/themes/win11-style.css',
        'ios-style': 'css/themes/ios-style.css'
    };

    let currentThemeLink = null;

    function loadTheme(themeName) {
        const themePath = themes[themeName];
        if (!themePath) return;

        if (currentThemeLink) {
            currentThemeLink.remove();
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = themePath;
        document.head.appendChild(link);
        currentThemeLink = link;

        localStorage.setItem('ttplayer-theme', themeName);
    }

    document.addEventListener('DOMContentLoaded', function() {
        const select = document.getElementById('themeSelect');
        if (select) {
            select.addEventListener('change', function() {
                loadTheme(this.value);
            });

            const savedTheme = localStorage.getItem('ttplayer-theme');
            if (savedTheme && themes[savedTheme]) {
                select.value = savedTheme;
                loadTheme(savedTheme);
            } else {
                select.value = 'classic';
                loadTheme('classic');
            }
        }
    });
})();
