// 範例測驗集：管理員可一鍵匯入；本機模式也以此作為預設資料。
// 每份測驗的第 i 個選項都對應第 i 個結果類型，確保每種結果都有機會出現（見 seeds.test.ts）。
import { createSampleQuiz } from "./sample"
import type { QuizDraft } from "./types"

function dreamColorQuiz(): QuizDraft {
  return {
    title: "你的夢境是什麼顏色？",
    category: "潛意識探索",
    description: "閉上眼睛，回想最近一個還記得的夢。用 5 道題目，找出你潛意識的主色調。",
    published: true,
    results: [
      {
        id: "mist",
        title: "晨霧藍：溫柔的觀察者",
        description:
          "你的內心像清晨的霧，安靜而細膩。你總能察覺別人沒注意到的小細節，也容易被一首歌、一段光影打動。請相信你的敏感是一種天賦，而不是負擔。",
      },
      {
        id: "mint",
        title: "薄荷綠：自在的療癒者",
        description:
          "你帶著讓人放鬆的氣場，和你相處就像打開窗戶讓風吹進來。你重視平衡與舒適，懂得在忙碌中替自己留一塊空白。",
      },
      {
        id: "amber",
        title: "琥珀橙：熱烈的冒險家",
        description:
          "你的夢裡總有遠方。你對新鮮事充滿好奇，說走就走的行動力讓人羨慕。偶爾停下腳步回頭看看，會發現一路上的風景同樣精彩。",
      },
      {
        id: "violet",
        title: "夜空紫：神祕的想像家",
        description:
          "你腦中住著一整座宇宙，總能把平凡的日常想像成故事。你喜歡獨特、不隨波逐流，別人看不懂的時候，正是你最閃耀的時候。",
      },
    ],
    questions: [
      {
        id: "d1",
        text: "夢裡，你最常出現在什麼地方？",
        type: "single",
        options: [
          { id: "d1a", text: "清晨無人的海邊", scores: { mist: 2 } },
          { id: "d1b", text: "長滿植物的溫室", scores: { mint: 2 } },
          { id: "d1c", text: "陌生城市的夜市", scores: { amber: 2 } },
          { id: "d1d", text: "漂浮在星空中的房間", scores: { violet: 2 } },
        ],
      },
      {
        id: "d2",
        text: "醒來後，你通常會怎麼面對剛剛的夢？",
        type: "single",
        options: [
          { id: "d2a", text: "靜靜回味夢裡的情緒", scores: { mist: 2 } },
          { id: "d2b", text: "伸個懶腰，讓它自然散去", scores: { mint: 2 } },
          { id: "d2c", text: "迫不及待跟朋友分享", scores: { amber: 2 } },
          { id: "d2d", text: "記下來，想著它代表什麼", scores: { violet: 2 } },
        ],
      },
      {
        id: "d3",
        text: "如果夢裡可以帶一樣東西，你會帶？",
        type: "single",
        options: [
          { id: "d3a", text: "一台底片相機", scores: { mist: 2 } },
          { id: "d3b", text: "一杯溫熱的花草茶", scores: { mint: 2 } },
          { id: "d3c", text: "一張沒有終點的車票", scores: { amber: 2 } },
          { id: "d3d", text: "一本會自己寫字的筆記本", scores: { violet: 1, mist: 1 } },
        ],
      },
      {
        id: "d4",
        text: "哪些聲音最容易讓你放鬆？（可複選）",
        type: "multiple",
        options: [
          { id: "d4a", text: "雨滴打在窗上", scores: { mist: 1 } },
          { id: "d4b", text: "風吹過樹葉", scores: { mint: 1 } },
          { id: "d4c", text: "遠方的火車聲", scores: { amber: 1 } },
          { id: "d4d", text: "深夜的電台音樂", scores: { violet: 1 } },
        ],
      },
      {
        id: "d5",
        text: "夢的結尾，你最希望是？",
        type: "single",
        options: [
          { id: "d5a", text: "看見一場安靜的日出", scores: { mist: 2 } },
          { id: "d5b", text: "在草地上睡個好覺", scores: { mint: 2 } },
          { id: "d5c", text: "抵達一個從沒去過的國度", scores: { amber: 2 } },
          { id: "d5d", text: "發現這一切原來是另一個夢", scores: { violet: 2 } },
        ],
      },
    ],
  }
}

function weatherQuiz(): QuizDraft {
  return {
    title: "你在朋友圈裡是哪一種天氣？",
    category: "人際關係",
    description: "每個人都是朋友生活裡的一種天氣。看看你帶給身邊的人什麼樣的感覺。",
    published: true,
    results: [
      {
        id: "sunny",
        title: "晴天：大家的開心果",
        description:
          "有你在的地方就有笑聲。你擅長發現生活中的樂趣，也很願意把快樂分給別人。記得在需要的時候，也讓朋友成為你的晴天。",
      },
      {
        id: "breeze",
        title: "微風：舒服的陪伴者",
        description:
          "你不搶鋒頭，卻總在剛剛好的時候出現。和你相處不需要刻意找話題，沉默也很自在，是朋友心中最舒服的存在。",
      },
      {
        id: "storm",
        title: "雷陣雨：真性情的直球派",
        description:
          "你愛恨分明、說話直接，情緒來得快也去得快。正因為真誠，朋友知道從你口中聽到的永遠是真心話。",
      },
      {
        id: "moon",
        title: "月光：安靜的傾聽者",
        description:
          "深夜想找人說話時，大家第一個想到的就是你。你善於傾聽、懂得保守秘密，用溫柔的方式照亮別人。",
      },
    ],
    questions: [
      {
        id: "w1",
        text: "朋友聚會時，你通常扮演什麼角色？",
        type: "single",
        options: [
          { id: "w1a", text: "負責炒熱氣氛、說笑話", scores: { sunny: 2 } },
          { id: "w1b", text: "幫大家點餐、顧好細節", scores: { breeze: 2 } },
          { id: "w1c", text: "直接提出想去哪裡玩", scores: { storm: 2 } },
          { id: "w1d", text: "聽大家聊天，偶爾補一句", scores: { moon: 2 } },
        ],
      },
      {
        id: "w2",
        text: "朋友傳來一則「在嗎？」，你的第一反應是？",
        type: "single",
        options: [
          { id: "w2a", text: "「在！怎麼啦～」秒回", scores: { sunny: 2 } },
          { id: "w2b", text: "看到就回，不急也不慢", scores: { breeze: 2 } },
          { id: "w2c", text: "「有事直接說」", scores: { storm: 2 } },
          { id: "w2d", text: "猜到對方可能心情不好，直接打電話", scores: { moon: 2 } },
        ],
      },
      {
        id: "w3",
        text: "和朋友意見不合時，你會？",
        type: "single",
        options: [
          { id: "w3a", text: "開個玩笑化解尷尬", scores: { sunny: 2 } },
          { id: "w3b", text: "找一個雙方都能接受的方案", scores: { breeze: 2 } },
          { id: "w3c", text: "把話說清楚，吵完就沒事", scores: { storm: 2 } },
          { id: "w3d", text: "先聽完對方的想法再說", scores: { moon: 2 } },
        ],
      },
      {
        id: "w4",
        text: "朋友最常因為什麼事情找你？（可複選）",
        type: "multiple",
        options: [
          { id: "w4a", text: "揪團出去玩", scores: { sunny: 1 } },
          { id: "w4b", text: "幫忙安排或處理事情", scores: { breeze: 1 } },
          { id: "w4c", text: "需要有人說真話", scores: { storm: 1 } },
          { id: "w4d", text: "深夜心事談", scores: { moon: 1 } },
        ],
      },
      {
        id: "w5",
        text: "如果用一個場景形容理想的週末，你會選？",
        type: "single",
        options: [
          { id: "w5a", text: "陽光下的野餐派對", scores: { sunny: 2 } },
          { id: "w5b", text: "河堤邊慢慢散步", scores: { breeze: 2 } },
          { id: "w5c", text: "看一場熱血的球賽", scores: { storm: 2 } },
          { id: "w5d", text: "和一個好朋友在陽台聊到半夜", scores: { moon: 2 } },
        ],
      },
    ],
  }
}

function rechargeQuiz(): QuizDraft {
  return {
    title: "你的心靈充電方式是？",
    category: "生活風格",
    description: "累了的時候，每個人恢復能量的方式都不一樣。找到最適合你的充電插座。",
    published: true,
    results: [
      {
        id: "solo",
        title: "獨處型：安靜的充電座",
        description:
          "對你來說，一個人的時間不是孤單，而是重新整理自己的必要儀式。關上門、放首喜歡的歌，你就能慢慢回到滿電狀態。",
      },
      {
        id: "social",
        title: "連結型：人群裡的發電機",
        description:
          "和喜歡的人在一起，就是你最好的充電方式。一頓好飯、一段長聊，都能讓你重新找回能量。",
      },
      {
        id: "explore",
        title: "探索型：在路上充電",
        description:
          "新的風景、新的體驗會讓你瞬間滿血復活。就算只是走一條沒走過的路，也能讓你感覺生活又有了新鮮感。",
      },
      {
        id: "create",
        title: "創作型：動手就有電",
        description:
          "畫畫、寫字、做料理，當你專注地創造某樣東西時，煩惱就會自動退場。完成作品的那一刻，就是你最滿足的時候。",
      },
    ],
    questions: [
      {
        id: "r1",
        text: "忙了一整週，終於到週五晚上，你最想？",
        type: "single",
        options: [
          { id: "r1a", text: "回家洗個熱水澡，誰都不見", scores: { solo: 2 } },
          { id: "r1b", text: "約好朋友吃頓好的", scores: { social: 2 } },
          { id: "r1c", text: "臨時訂票去鄰近城市", scores: { explore: 2 } },
          { id: "r1d", text: "開始那個一直想做的手作計畫", scores: { create: 2 } },
        ],
      },
      {
        id: "r2",
        text: "手機快沒電時，你會優先保留給？",
        type: "single",
        options: [
          { id: "r2a", text: "聽音樂或 Podcast", scores: { solo: 2 } },
          { id: "r2b", text: "回覆朋友的訊息", scores: { social: 2 } },
          { id: "r2c", text: "開地圖導航", scores: { explore: 2 } },
          { id: "r2d", text: "拍下突然出現的靈感", scores: { create: 2 } },
        ],
      },
      {
        id: "r3",
        text: "心情低落時，什麼最能讓你好起來？",
        type: "single",
        options: [
          { id: "r3a", text: "好好睡一覺", scores: { solo: 2 } },
          { id: "r3b", text: "有人陪著說說話", scores: { social: 2 } },
          { id: "r3c", text: "出門走走、換個環境", scores: { explore: 2 } },
          { id: "r3d", text: "把心情寫下來或畫出來", scores: { create: 2 } },
        ],
      },
      {
        id: "r4",
        text: "以下哪些活動會讓你覺得「這才是生活」？（可複選）",
        type: "multiple",
        options: [
          { id: "r4a", text: "一個人的咖啡廳時光", scores: { solo: 1 } },
          { id: "r4b", text: "熱鬧的家庭聚餐", scores: { social: 1 } },
          { id: "r4c", text: "在陌生的巷弄迷路", scores: { explore: 1 } },
          { id: "r4d", text: "從零做出一道料理", scores: { create: 1, social: 1 } },
        ],
      },
      {
        id: "r5",
        text: "如果有一整天的自由時間，你會怎麼安排？",
        type: "single",
        options: [
          { id: "r5a", text: "什麼都不排，隨心所欲", scores: { solo: 2 } },
          { id: "r5b", text: "排滿和不同朋友的約", scores: { social: 2 } },
          { id: "r5c", text: "去一個一直想去的地方", scores: { explore: 2 } },
          { id: "r5d", text: "上一堂沒學過的手作課", scores: { create: 2 } },
        ],
      },
    ],
  }
}

/** 全部範例測驗（第一份為原本的「森林動物」測驗） */
export function createSeedQuizzes(): QuizDraft[] {
  return [createSampleQuiz(), dreamColorQuiz(), weatherQuiz(), rechargeQuiz()]
}

/** 尚未匯入的範例測驗（以標題判斷），重複匯入時不會產生重複資料 */
export function missingSeedQuizzes(existing: readonly { title: string }[]): QuizDraft[] {
  const titles = new Set(existing.map((q) => q.title.trim()))
  return createSeedQuizzes().filter((q) => !titles.has(q.title))
}
