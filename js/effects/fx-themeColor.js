// 主题色：canvas 完全透明，让主题 CSS 背景透出
// 注意：部分主题（明亮系）背景色浅，靠 .lyrics-container 的深色半透明底色保证可读
EffectRegister('themeColor', function(w,h,ctx,cv,act) {
    // 不画任何粒子，canvas 保持纯黑（{alpha:false} 默认），但隐藏让它不可见
    cv.style.opacity = '0';
    return function() { cv.style.opacity = ''; };
});
