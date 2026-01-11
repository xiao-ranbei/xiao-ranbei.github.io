/**
 * 日语动词数据库
 * 格式说明：
 * - kanji: 动词汉字形式
 * - kana: 动词假名形式
 * - type: 动词类型 (godan: 五段动词, ichidan: 一段动词, saru: サ变动词, kuru: カ变动词)
 * - category: 五段动词的词尾分类（仅五段动词需要）
 */

const verbs = [
    // 五段动词
    {
        kanji: "行く",
        kana: "いく",
        type: "godan",
        category: "う"
    },
    {
        kanji: "書く",
        kana: "かく",
        type: "godan",
        category: "く"
    },
    {
        kanji: "読む",
        kana: "よむ",
        type: "godan",
        category: "む"
    },
    {
        kanji: "話す",
        kana: "はなす",
        type: "godan",
        category: "す"
    },
    {
        kanji: "聞く",
        kana: "きく",
        type: "godan",
        category: "く"
    },
    {
        kanji: "買う",
        kana: "かう",
        type: "godan",
        category: "う"
    },
    {
        kanji: "話す",
        kana: "はなす",
        type: "godan",
        category: "す"
    },
    {
        kanji: "立つ",
        kana: "たつ",
        type: "godan",
        category: "つ"
    },
    {
        kanji: "死ぬ",
        kana: "しぬ",
        type: "godan",
        category: "ぬ"
    },
    {
        kanji: "呼ぶ",
        kana: "よぶ",
        type: "godan",
        category: "ぶ"
    },
    
    // 一段动词
    {
        kanji: "食べる",
        kana: "たべる",
        type: "ichidan"
    },
    {
        kanji: "見る",
        kana: "みる",
        type: "ichidan"
    },
    {
        kanji: "教える",
        kana: "おしえる",
        type: "ichidan"
    },
    {
        kanji: "寝る",
        kana: "ねる",
        type: "ichidan"
    },
    {
        kanji: "起きる",
        kana: "おきる",
        type: "ichidan"
    },
    
    // サ变动词
    {
        kanji: "する",
        kana: "する",
        type: "saru"
    },
    {
        kanji: "勉強する",
        kana: "べんきょうする",
        type: "saru"
    },
    {
        kanji: "練習する",
        kana: "れんしゅうする",
        type: "saru"
    },
    
    // カ变动词
    {
        kanji: "来る",
        kana: "くる",
        type: "kuru"
    }
];

// 导出动词数据库
if (typeof module !== 'undefined' && module.exports) {
    module.exports = verbs;
} else if (typeof window !== 'undefined') {
    window.verbs = verbs;
}