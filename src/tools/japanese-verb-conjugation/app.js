// 日语动词变形练习工具应用逻辑

// 全局变量
let currentPractice = null;
let practiceStats = {
    total: 0,
    correct: 0,
    accuracy: 0
};
let uploadedFileData = null;

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
    
    // 导入数据按钮
    document.getElementById('import-btn').addEventListener('click', handleImportData);
    
    // 文件上传变化
    document.getElementById('verbs-file').addEventListener('change', handleFileChange);
    
    // 折叠/展开功能
    document.getElementById('data-management-header').addEventListener('click', toggleDataManagement);
    
    // 导出数据按钮
    document.getElementById('export-btn').addEventListener('click', handleExportData);
}

// 生成新练习
function generateNewPractice() {
    // 获取练习设置
    const verbType = document.getElementById('verb-type').value;
    const conjugationType = document.getElementById('conjugation-type').value;
    
    try {
        // 生成练习
        currentPractice = window.generatePractice(verbType, conjugationType);
        
        // 更新界面
        updatePracticeDisplay();
        
        // 重置输入和反馈
        resetInputAndFeedback();
    } catch (error) {
        console.error('Error generating practice:', error);
        alert('生成练习时出错，请刷新页面重试');
    }
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
    
    try {
        // 检查答案
        const isCorrect = window.checkAnswer(userAnswer, currentPractice.correctAnswer);
        
        // 显示反馈
        showFeedback(isCorrect);
        
        // 更新统计
        updateStats(isCorrect);
    } catch (error) {
        console.error('Error checking answer:', error);
        alert('检查答案时出错，请刷新页面重试');
    }
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
        try {
            document.getElementById('explanation').textContent = window.getConjugationExplanation(currentPractice.verb, currentPractice.conjugationType);
        } catch (error) {
            console.error('Error getting explanation:', error);
            document.getElementById('explanation').textContent = '解析获取失败';
        }
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

// 处理文件上传
function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            uploadedFileData = data;
            document.getElementById('import-status').textContent = `文件已加载: ${file.name}`;
            document.getElementById('import-status').className = 'text-green-600';
            
            // 显示文件内容到文本区域
            document.getElementById('verbs-data').value = JSON.stringify(data, null, 2);
        } catch (error) {
            document.getElementById('import-status').textContent = '文件格式错误: 请确保是有效的JSON格式';
            document.getElementById('import-status').className = 'text-red-600';
            uploadedFileData = null;
        }
    };
    reader.onerror = function() {
        document.getElementById('import-status').textContent = '文件读取失败';
        document.getElementById('import-status').className = 'text-red-600';
        uploadedFileData = null;
    };
    reader.readAsText(file);
}

// 验证动词数据
function validateVerbData(verbData) {
    const errors = [];

    // 检查是否为数组
    if (!Array.isArray(verbData)) {
        errors.push('动词数据必须是一个数组');
        return { valid: false, errors };
    }

    // 检查每个动词对象
    verbData.forEach((verb, index) => {
        // 检查必需字段
        if (!verb.kanji) {
            errors.push(`第 ${index + 1} 个动词缺少 kanji 字段`);
        }
        if (!verb.kana) {
            errors.push(`第 ${index + 1} 个动词缺少 kana 字段`);
        }
        if (!verb.type) {
            errors.push(`第 ${index + 1} 个动词缺少 type 字段`);
        }

        // 检查 type 字段值
        const validTypes = ['godan', 'ichidan', 'saru', 'kuru'];
        if (verb.type && !validTypes.includes(verb.type)) {
            errors.push(`第 ${index + 1} 个动词的 type 字段值无效，必须是 godan, ichidan, saru 或 kuru 之一`);
        }

        // 检查五段动词是否有 category 字段
        if (verb.type === 'godan' && !verb.category) {
            errors.push(`第 ${index + 1} 个动词是五段动词，缺少 category 字段`);
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}

// 处理数据导入
function handleImportData() {
    // 获取数据来源
    let verbData;
    
    // 优先使用文件上传的数据
    if (uploadedFileData) {
        verbData = uploadedFileData;
    } 
    // 否则使用文本区域的数据
    else {
        const textAreaData = document.getElementById('verbs-data').value;
        try {
            verbData = JSON.parse(textAreaData);
        } catch (error) {
            document.getElementById('import-status').textContent = '文本区域中的数据格式错误: 请确保是有效的JSON格式';
            document.getElementById('import-status').className = 'text-red-600';
            return;
        }
    }

    // 验证数据
    const validationResult = validateVerbData(verbData);
    if (!validationResult.valid) {
        document.getElementById('import-status').textContent = `数据验证失败: ${validationResult.errors.join('; ')}`;
        document.getElementById('import-status').className = 'text-red-600';
        return;
    }

    // 更新全局动词数据
    if (typeof window !== 'undefined') {
        window.verbs = verbData;
        // 重新导入到 verb-conjugation 模块
        if (typeof verbs !== 'undefined') {
            verbs = verbData;
        }
    }

    // 显示导入成功消息
    document.getElementById('import-status').textContent = `成功导入 ${verbData.length} 个动词`;
    document.getElementById('import-status').className = 'text-green-600';

    // 生成新练习以使用新数据
    generateNewPractice();
}

// 切换数据管理面板的折叠/展开状态
function toggleDataManagement() {
    const content = document.getElementById('data-management-content');
    const toggleButton = document.getElementById('toggle-collapse');
    
    // 切换内容显示状态
    content.classList.toggle('hidden');
    
    // 更新箭头图标
    if (content.classList.contains('hidden')) {
        toggleButton.innerHTML = '<i class="fa fa-chevron-down"></i>';
    } else {
        toggleButton.innerHTML = '<i class="fa fa-chevron-up"></i>';
    }
}

// 处理数据导出
function handleExportData() {
    // 获取动词数据
    let verbData;
    if (typeof window !== 'undefined' && window.verbs) {
        verbData = window.verbs;
    } else {
        verbData = [
            { kanji: "行く", kana: "いく", type: "godan", category: "う" },
            { kanji: "食べる", kana: "たべる", type: "ichidan" },
            { kanji: "する", kana: "する", type: "saru" },
            { kanji: "来る", kana: "くる", type: "kuru" }
        ];
    }
    
    // 准备导出数据（添加注释说明）
    const exportData = {
        // 数据说明
        "// 格式说明": "每个动词对象包含以下字段：",
        "// kanji": "动词汉字形式",
        "// kana": "动词假名形式",
        "// type": "动词类型 (godan: 五段动词, ichidan: 一段动词, saru: サ变动词, kuru: カ变动词)",
        "// category": "五段动词的词尾分类（仅五段动词需要）",
        "// 示例": "以下是几个常见动词的示例：",
        "verbs": verbData
    };
    
    // 转换为格式化的JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'japanese-verbs-template.json';
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // 释放URL对象
    URL.revokeObjectURL(url);
    
    // 显示导出成功消息
    document.getElementById('import-status').textContent = '动词数据导出成功！请查看下载的JSON文件。';
    document.getElementById('import-status').className = 'text-green-600';
}