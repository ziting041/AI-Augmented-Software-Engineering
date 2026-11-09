import type { QuizDraft } from "./types"

/** 範例測驗：供管理員一鍵匯入，以及本機模式的預設資料 */
export function createSampleQuiz(): QuizDraft {
  return {
    title: "你是哪一種森林動物？",
    description:
      "透過 6 道生活情境題，看看你在人群中最像哪一種森林動物。結果僅供娛樂參考。",
    published: true,
    results: [
      {
        id: "owl",
        title: "貓頭鷹：冷靜的思考者",
        description:
          "你習慣先觀察、再行動，重視邏輯與細節。朋友遇到難題時，常會第一個想到請教你。記得偶爾放下分析，也享受當下的感受。",
      },
      {
        id: "dolphin",
        title: "海豚：熱情的連結者",
        description:
          "你天生擅長與人相處，總能炒熱氣氛、讓身邊的人感到自在。你的能量來自人群，但也別忘了留點時間給自己充電。",
      },
      {
        id: "lion",
        title: "獅子：果斷的領導者",
        description:
          "你目標明確、行動力強，面對挑戰時不輕易退縮。大家很自然地跟隨你的腳步。試著多聽聽不同的聲音，團隊會更有力量。",
      },
      {
        id: "koala",
        title: "無尾熊：溫柔的守護者",
        description:
          "你重視穩定與和諧，是朋友心中最可靠的依靠。你擅長傾聽，也很能體察別人的情緒。記得也要照顧好自己的需求。",
      },
    ],
    questions: [
      {
        id: "q1",
        text: "難得的週末，你最想怎麼度過？",
        type: "single",
        options: [
          { id: "q1a", text: "在家看書或研究有興趣的主題", scores: { owl: 2 } },
          { id: "q1b", text: "約一群朋友出去聚餐", scores: { dolphin: 2 } },
          { id: "q1c", text: "安排一場有挑戰性的登山行程", scores: { lion: 2 } },
          { id: "q1d", text: "窩在沙發上好好休息", scores: { koala: 2 } },
        ],
      },
      {
        id: "q2",
        text: "團隊專案遇到瓶頸時，你通常會……",
        type: "single",
        options: [
          { id: "q2a", text: "整理資料，找出問題的根本原因", scores: { owl: 2 } },
          { id: "q2b", text: "召集大家聊聊，激盪新點子", scores: { dolphin: 2 } },
          { id: "q2c", text: "直接分配任務，先動起來再說", scores: { lion: 2 } },
          { id: "q2d", text: "關心成員狀況，穩定團隊情緒", scores: { koala: 2 } },
        ],
      },
      {
        id: "q3",
        text: "以下哪些形容詞，朋友常用來描述你？（可複選）",
        type: "multiple",
        options: [
          { id: "q3a", text: "理性", scores: { owl: 1 } },
          { id: "q3b", text: "幽默", scores: { dolphin: 1 } },
          { id: "q3c", text: "有主見", scores: { lion: 1 } },
          { id: "q3d", text: "體貼", scores: { koala: 1 } },
          { id: "q3e", text: "好奇心旺盛", scores: { owl: 1, dolphin: 1 } },
        ],
      },
      {
        id: "q4",
        text: "走進一場沒有認識的人的派對，你會？",
        type: "single",
        options: [
          { id: "q4a", text: "找個角落，先觀察現場氣氛", scores: { owl: 2 } },
          { id: "q4b", text: "主動找人攀談，很快就混熟了", scores: { dolphin: 2 } },
          { id: "q4c", text: "找到主辦人，順便認識重要人物", scores: { lion: 2 } },
          { id: "q4d", text: "陪在同樣落單的人身邊聊天", scores: { koala: 2 } },
        ],
      },
      {
        id: "q5",
        text: "做重要決定時，你最依賴什麼？",
        type: "single",
        options: [
          { id: "q5a", text: "數據與優缺點分析", scores: { owl: 2 } },
          { id: "q5b", text: "身邊朋友的意見", scores: { dolphin: 1, koala: 1 } },
          { id: "q5c", text: "自己的直覺與目標", scores: { lion: 2 } },
          { id: "q5d", text: "這個決定會不會讓人受傷", scores: { koala: 2 } },
        ],
      },
      {
        id: "q6",
        text: "哪些事情最能讓你感到充實？（可複選）",
        type: "multiple",
        options: [
          { id: "q6a", text: "學會一項新知識", scores: { owl: 1 } },
          { id: "q6b", text: "認識有趣的新朋友", scores: { dolphin: 1 } },
          { id: "q6c", text: "完成一個困難的目標", scores: { lion: 1 } },
          { id: "q6d", text: "幫助別人度過難關", scores: { koala: 1 } },
        ],
      },
    ],
  }
}
