// KK 文字效果切换
let currentEffect = 1;
const totalEffects = 3;

function switchEffect() {
    const effects = document.querySelectorAll('.kk-effect');
    effects.forEach(effect => {
        effect.classList.add('opacity-0');
    });
    
    currentEffect = currentEffect % totalEffects + 1;
    document.getElementById(`kk-effect-${currentEffect}`).classList.remove('opacity-0');
}

// 每5秒切换一次效果
setInterval(switchEffect, 5000);