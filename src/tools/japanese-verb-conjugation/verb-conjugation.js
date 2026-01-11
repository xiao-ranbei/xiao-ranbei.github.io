// 日语动词变形核心逻辑

// 导入动词数据库
let verbData;

// 尝试从外部文件导入
if (typeof window !== 'undefined' && window.verbs) {
    verbData = window.verbs;
} else if (typeof require !== 'undefined') {
    try {
        verbData = require('./verbs.js');
    } catch (e) {
        console.error('Failed to load verbs.js:', e);
        // 如果加载失败，使用默认动词数据
        verbData = [
            { kanji: "行く", kana: "いく", type: "godan", category: "う" },
            { kanji: "食べる", kana: "たべる", type: "ichidan" },
            { kanji: "する", kana: "する", type: "saru" },
            { kanji: "来る", kana: "くる", type: "kuru" }
        ];
    }
} else {
    // 兜底默认数据
    verbData = [
        { kanji: "行く", kana: "いく", type: "godan", category: "う" },
        { kanji: "食べる", kana: "たべる", type: "ichidan" },
        { kanji: "する", kana: "する", type: "saru" },
        { kanji: "来る", kana: "くる", type: "kuru" }
    ];
}

// 变形类型
const conjugationTypes = [
    {
        id: "masu",
        name: "ます形"
    },
    {
        id: "te",
        name: "て形"
    },
    {
        id: "ta",
        name: "た形"
    },
    {
        id: "nai",
        name: "ない形"
    },
    {
        id: "ba",
        name: "ば形"
    },
    {
        id: "命令形",
        name: "命令形"
    },
    {
        id: "可能形",
        name: "可能形"
    },
    {
        id: "被动形",
        name: "被动态"
    },
    {
        id: "使役形",
        name: "使役态"
    },
    {
        id: "使役被动形",
        name: "使役被动态"
    }
];

// 五段动词变形规则
const godanConjugations = {
    // ます形
    masu: (verb) => {
        const stem = verb.kana.slice(0, -1);
        const lastChar = verb.kana.slice(-1);
        const masuEndings = {
            "う": "います",
            "く": "きます",
            "ぐ": "ぎます",
            "す": "します",
            "つ": "ちます",
            "ぬ": "にます",
            "ぶ": "びます",
            "む": "みます",
            "る": "ります"
        };
        return stem + masuEndings[lastChar] || verb.kana;
    },
    
    // て形
    te: (verb) => {
        const stem = verb.kana.slice(0, -1);
        const lastChar = verb.kana.slice(-1);
        const teEndings = {
            "う": "って",
            "く": "いて",
            "ぐ": "いで",
            "す": "して",
            "つ": "って",
            "ぬ": "んで",
            "ぶ": "んで",
            "む": "んで",
            "る": "って"
        };
        return stem + teEndings[lastChar] || verb.kana;
    },
    
    // た形
    ta: (verb) => {
        const stem = verb.kana.slice(0, -1);
        const lastChar = verb.kana.slice(-1);
        const taEndings = {
            "う": "った",
            "く": "いた",
            "ぐ": "いだ",
            "す": "した",
            "つ": "った",
            "ぬ": "んだ",
            "ぶ": "んだ",
            "む": "んだ",
            "る": "った"
        };
        return stem + taEndings[lastChar] || verb.kana;
    },
    
    // ない形
    nai: (verb) => {
        const stem = verb.kana.slice(0, -1);
        const lastChar = verb.kana.slice(-1);
        const naiEndings = {
            "う": "わない",
            "く": "かない",
            "ぐ": "がない",
            "す": "さない",
            "つ": "たない",
            "ぬ": "なない",
            "ぶ": "ばない",
            "む": "まない",
            "る": "らない"
        };
        return stem + naiEndings[lastChar] || verb.kana;
    },
    
    // ば形
    ba: (verb) => {
        const stem = verb.kana.slice(0, -1);
        const lastChar = verb.kana.slice(-1);
        const baEndings = {
            "う": "えば",
            "く": "けば",
            "ぐ": "げば",
            "す": "せば",
            "つ": "てば",
            "ぬ": "ねば",
            "ぶ": "べば",
            "む": "めば",
            "る": "れば"
        };
        return stem + baEndings[lastChar] || verb.kana;
    },
    
    // 命令形
    "命令形": (verb) => {
        const stem = verb.kana.slice(0, -1);
        const lastChar = verb.kana.slice(-1);
        const meireiEndings = {
            "う": "え",
            "く": "け",
            "ぐ": "げ",
            "す": "せ",
            "つ": "て",
            "ぬ": "ね",
            "ぶ": "べ",
            "む": "め",
            "る": "れ"
        };
        return stem + meireiEndings[lastChar] || verb.kana;
    },
    
    // 可能形
    "可能形": (verb) => {
        const stem = verb.kana.slice(0, -1);
        const lastChar = verb.kana.slice(-1);
        const kanouEndings = {
            "う": "える",
            "く": "ける",
            "ぐ": "げる",
            "す": "せる",
            "つ": "てる",
            "ぬ": "ねる",
            "ぶ": "べる",
            "む": "める",
            "る": "れる"
        };
        return stem + kanouEndings[lastChar] || verb.kana;
    },
    
    // 被动态
    "被动形": (verb) => {
        const stem = verb.kana.slice(0, -1);
        const lastChar = verb.kana.slice(-1);
        const ukemiEndings = {
            "う": "われる",
            "く": "かれる",
            "ぐ": "がれる",
            "す": "される",
            "つ": "たれる",
            "ぬ": "なれる",
            "ぶ": "ばれる",
            "む": "まれる",
            "る": "られる"
        };
        return stem + ukemiEndings[lastChar] || verb.kana;
    },
    
    // 使役态
    "使役形": (verb) => {
        const stem = verb.kana.slice(0, -1);
        const lastChar = verb.kana.slice(-1);
        const shiekiEndings = {
            "う": "わせる",
            "く": "かせる",
            "ぐ": "がせる",
            "す": "させる",
            "つ": "たせる",
            "ぬ": "なせる",
            "ぶ": "ばせる",
            "む": "ませる",
            "る": "らせる"
        };
        return stem + shiekiEndings[lastChar] || verb.kana;
    },
    
    // 使役被动态
    "使役被动形": (verb) => {
        const stem = verb.kana.slice(0, -1);
        const lastChar = verb.kana.slice(-1);
        const shiekiUkemiEndings = {
            "う": "わせられる",
            "く": "かせられる",
            "ぐ": "がせられる",
            "す": "させられる",
            "つ": "たせられる",
            "ぬ": "なせられる",
            "ぶ": "ばせられる",
            "む": "ませられる",
            "る": "らせられる"
        };
        return stem + shiekiUkemiEndings[lastChar] || verb.kana;
    }
};

// 一段动词变形规则
const ichidanConjugations = {
    // ます形
    masu: (verb) => {
        return verb.kana.slice(0, -1) + "ます";
    },
    
    // て形
    te: (verb) => {
        return verb.kana.slice(0, -1) + "て";
    },
    
    // た形
    ta: (verb) => {
        return verb.kana.slice(0, -1) + "た";
    },
    
    // ない形
    nai: (verb) => {
        return verb.kana.slice(0, -1) + "ない";
    },
    
    // ば形
    ba: (verb) => {
        return verb.kana.slice(0, -1) + "れば";
    },
    
    // 命令形
    "命令形": (verb) => {
        return verb.kana.slice(0, -1) + "ろ";
    },
    
    // 可能形
    "可能形": (verb) => {
        return verb.kana.slice(0, -1) + "られる";
    },
    
    // 被动态
    "被动形": (verb) => {
        return verb.kana.slice(0, -1) + "られる";
    },
    
    // 使役态
    "使役形": (verb) => {
        return verb.kana.slice(0, -1) + "させる";
    },
    
    // 使役被动态
    "使役被动形": (verb) => {
        return verb.kana.slice(0, -1) + "させられる";
    }
};

// サ变动词变形规则
const saruConjugations = {
    // ます形
    masu: (verb) => {
        return "します";
    },
    
    // て形
    te: (verb) => {
        return "して";
    },
    
    // た形
    ta: (verb) => {
        return "した";
    },
    
    // ない形
    nai: (verb) => {
        return "しない";
    },
    
    // ば形
    ba: (verb) => {
        return "すれば";
    },
    
    // 命令形
    "命令形": (verb) => {
        return "しろ";
    },
    
    // 可能形
    "可能形": (verb) => {
        return "できる";
    },
    
    // 被动态
    "被动形": (verb) => {
        return "される";
    },
    
    // 使役态
    "使役形": (verb) => {
        return "させる";
    },
    
    // 使役被动态
    "使役被动形": (verb) => {
        return "させられる";
    }
};

// カ变动词变形规则
const kuruConjugations = {
    // ます形
    masu: (verb) => {
        return "きます";
    },
    
    // て形
    te: (verb) => {
        return "きて";
    },
    
    // た形
    ta: (verb) => {
        return "きた";
    },
    
    // ない形
    nai: (verb) => {
        return "こない";
    },
    
    // ば形
    ba: (verb) => {
        return "くれば";
    },
    
    // 命令形
    "命令形": (verb) => {
        return "こい";
    },
    
    // 可能形
    "可能形": (verb) => {
        return "こられる";
    },
    
    // 被动态
    "被动形": (verb) => {
        return "こられる";
    },
    
    // 使役态
    "使役形": (verb) => {
        return "こさせる";
    },
    
    // 使役被动态
    "使役被动形": (verb) => {
        return "こさせられる";
    }
};

// 动词变形主函数
function conjugateVerb(verb, conjugationType) {
    switch (verb.type) {
        case "godan":
            return godanConjugations[conjugationType](verb);
        case "ichidan":
            return ichidanConjugations[conjugationType](verb);
        case "saru":
            return saruConjugations[conjugationType](verb);
        case "kuru":
            return kuruConjugations[conjugationType](verb);
        default:
            return verb.kana;
    }
}

// 随机生成练习
function generatePractice(verbType = "all", conjugationType = "all") {
    // 过滤动词
    let filteredVerbs = verbData;
    if (verbType !== "all") {
        filteredVerbs = verbData.filter(verb => verb.type === verbType);
    }
    
    // 过滤变形类型
    let filteredConjugations = conjugationTypes;
    if (conjugationType !== "all") {
        filteredConjugations = conjugationTypes.filter(type => type.id === conjugationType);
    }
    
    // 随机选择动词和变形类型
    const randomVerb = filteredVerbs[Math.floor(Math.random() * filteredVerbs.length)];
    const randomConjugation = filteredConjugations[Math.floor(Math.random() * filteredConjugations.length)];
    
    // 计算正确答案
    const correctAnswer = conjugateVerb(randomVerb, randomConjugation.id);
    
    return {
        verb: randomVerb,
        conjugationType: randomConjugation,
        correctAnswer: correctAnswer
    };
}

// 检查答案正确性
function checkAnswer(userAnswer, correctAnswer) {
    // 移除空格
    const normalizedUserAnswer = userAnswer.trim();
    const normalizedCorrectAnswer = correctAnswer.trim();
    
    // 检查是否完全匹配
    return normalizedUserAnswer === normalizedCorrectAnswer;
}

// 获取变形解析
function getConjugationExplanation(verb, conjugationType) {
    const explanations = {
        masu: `${verb.kanji}(${verb.kana}) 的ます形变形规则`,
        te: `${verb.kanji}(${verb.kana}) 的て形变形规则`,
        ta: `${verb.kanji}(${verb.kana}) 的た形变形规则`,
        nai: `${verb.kanji}(${verb.kana}) 的ない形变形规则`,
        ba: `${verb.kanji}(${verb.kana}) 的ば形变形规则`,
        "命令形": `${verb.kanji}(${verb.kana}) 的命令形变形规则`,
        "可能形": `${verb.kanji}(${verb.kana}) 的可能形变形规则`,
        "被动形": `${verb.kanji}(${verb.kana}) 的被动态变形规则`,
        "使役形": `${verb.kanji}(${verb.kana}) 的使役态变形规则`,
        "使役被动形": `${verb.kanji}(${verb.kana}) 的使役被动态变形规则`
    };
    
    return explanations[conjugationType.id] || "变形规则解析";
}

// 导出函数（如果在模块化环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        verbs: verbData,
        conjugationTypes,
        conjugateVerb,
        generatePractice,
        checkAnswer,
        getConjugationExplanation
    };
} 
// 在浏览器环境中导出到全局作用域
else if (typeof window !== 'undefined') {
    window.generatePractice = generatePractice;
    window.checkAnswer = checkAnswer;
    window.getConjugationExplanation = getConjugationExplanation;
    window.conjugateVerb = conjugateVerb;
    window.verbData = verbData;
}