// 日语动词变形练习工具应用逻辑

// 全局变量
let currentPractice = null;
let practiceStats = {
    total: 0,
    correct: 0,
    accuracy: 0
};

// 初始化应用
function initApp() {
    // 加载练习统计
    loadPracticeStats();
    
    // 生成第一个练习
    generateNewPractice();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 更新统计显示
    updateStatsDisplay();
}

// 绑定事件监听器
function bindEventListeners() {
    // 提交答案按钮
    document.getElementById('submit-btn').addEventListener('click', handleSubmitAnswer);
    
    // 下一题按钮
    document.getElementById('next-btn').addEventListener('click', generateNewPractice);
    
    // 重置练习按钮
    document.getElementById('reset-btn').addEventListener('click', resetPractice);
    
    // 查看统计按钮
    document.getElementById('stats-btn').addEventListener('click', showStats);
    
    // 回车键提交答案
    document.getElementById('answer-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSubmitAnswer();
        }
    });
    
    // 练习设置变化
    document.getElementById('verb-type').addEventListener('change', generateNewPractice);
    document.getElementById('conjugation-type').addEventListener('change', generateNewPractice);
}

// 生成新练习
function generateNewPractice() {
    // 获取练习设置
    const verbType = document.getElementById('verb-type').value;
    const conjugationType = document.getElementById('conjugation-type').value;
    
    // 生成练习
    currentPractice = generatePractice(verbType, conjugationType);
    
    // 更新界面
    updatePracticeDisplay();
    
    // 重置输入和反馈
    resetInputAndFeedback();
}

// 更新练习显示
function updatePracticeDisplay() {
    if (!currentPractice) return;
    
    // 更新动词显示
    document.getElementById('verb-display').textContent = currentPractice.verb.kanji + '(' + currentPractice.verb.kana + ')';
    
    // 更新变形要求
    document.getElementById('conjugation-requirement').textContent = currentPractice.conjugationType.name;
}

// 重置输入和反馈
function resetInputAndFeedback() {
    // 清空输入
    document.getElementById('answer-input').value = '';
    
    // 隐藏反馈
    document.getElementById('feedback-area').classList.add('hidden');
    document.getElementById('correct-feedback').classList.add('hidden');
    document.getElementById('incorrect-feedback').classList.add('hidden');
    
    // 聚焦输入框
    document.getElementById('answer-input').focus();
}

// 处理提交答案
function handleSubmitAnswer() {
    if (!currentPractice) return;
    
    // 获取用户输入
    const userAnswer = document.getElementById('answer-input').value;
    
    // 检查答案
    const isCorrect = checkAnswer(userAnswer, currentPractice.correctAnswer);
    
    // 显示反馈
    showFeedback(isCorrect);
    
    // 更新统计
    updateStats(isCorrect);
}

// 显示反馈
function showFeedback(isCorrect) {
    // 显示反馈区域
    document.getElementById('feedback-area').classList.remove('hidden');
    
    if (isCorrect) {
        // 显示正确反馈
        document.getElementById('correct-feedback').classList.remove('hidden');
        document.getElementById('incorrect-feedback').classList.add('hidden');
    } else {
        // 显示错误反馈
        document.getElementById('incorrect-feedback').classList.remove('hidden');
        document.getElementById('correct-feedback').classList.add('hidden');
        
        // 显示正确答案和解析
        document.getElementById('correct-answer').textContent = currentPractice.correctAnswer;
        document.getElementById('explanation').textContent = getConjugationExplanation(currentPractice.verb, currentPractice.conjugationType);
    }
}

// 更新统计
function updateStats(isCorrect) {
    // 增加总练习次数
    practiceStats.total++;
    
    // 如果正确，增加正确次数
    if (isCorrect) {
        practiceStats.correct++;
    }
    
    // 计算正确率
    practiceStats.accuracy = practiceStats.total > 0 ? Math.round((practiceStats.correct / practiceStats.total) * 100) : 0;
    
    // 保存统计
    savePracticeStats();
    
    // 更新显示
    updateStatsDisplay();
}

// 更新统计显示
function updateStatsDisplay() {
    document.getElementById('total-practices').textContent = practiceStats.total;
    document.getElementById('correct-count').textContent = practiceStats.correct;
    document.getElementById('accuracy-rate').textContent = practiceStats.accuracy + '%';
}

// 保存练习统计到本地存储
function savePracticeStats() {
    localStorage.setItem('japaneseVerbPracticeStats', JSON.stringify(practiceStats));
}

// 从本地存储加载练习统计
function loadPracticeStats() {
    const savedStats = localStorage.getItem('japaneseVerbPracticeStats');
    if (savedStats) {
        practiceStats = JSON.parse(savedStats);
    }
}

// 重置练习
function resetPractice() {
    // 重置统计
    practiceStats = {
        total: 0,
        correct: 0,
        accuracy: 0
    };
    
    // 保存重置后的统计
    savePracticeStats();
    
    // 更新显示
    updateStatsDisplay();
    
    // 生成新练习
    generateNewPractice();
}

// 显示统计
function showStats() {
    alert(`练习统计：
总练习次数：${practiceStats.total}
正确次数：${practiceStats.correct}
正确率：${practiceStats.accuracy}%`);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);