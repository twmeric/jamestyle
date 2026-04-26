export interface Slide {
  id: number;
  img: string;
  caption: { tc: string; sc: string };
  insight: { tc: string; sc: string };
  act: number; // 0-3
  emoji: string;
  reactions: { heart: number; like: number; share: number };
}

export const ACT_NAMES = {
  tc: ['扎心共鳴', '溫柔療癒', '人生態度', '品牌個性'],
  sc: ['扎心共鸣', '温柔疗愈', '人生态度', '品牌个性'],
};

export const ACT_EMOJIS = ['💔', '🌸', '🎯', '🔥'];

export const SLIDES: Slide[] = [
  {
    id: 1, img: '/images/01.jpeg', act: 0, emoji: '💩',
    caption: { tc: '人生…就像大便一樣，有軟有硬，有順有不順！', sc: '人生…就像大便一样，有软有硬，有顺有不顺！' },
    insight: { tc: '阿占講緊我哋每日嘅焦慮——但佢用大便講，你就笑咗。', sc: '阿占讲紧我们每日嘅焦虑——但佢用大便讲，你就笑了。' },
    reactions: { heart: 192, like: 284, share: 145 },
  },
  {
    id: 2, img: '/images/02.jpg', act: 0, emoji: '✌️',
    caption: { tc: '生活給了我一個巴掌，但我出剪刀！', sc: '生活给了我一个巴掌，但我出剪刀！' },
    insight: { tc: '輸咗唔緊要，最緊要輸得型。', sc: '输了不要紧，最紧要输得型。' },
    reactions: { heart: 210, like: 320, share: 189 },
  },
  {
    id: 3, img: '/images/03.jpg', act: 0, emoji: '📱',
    caption: { tc: '現代人怕錯過訊息，從口袋掏出手機的速度，往往比拔鎗更快！', sc: '现代人怕错过讯息，从口袋掏出手机的速度，往往比拔枪更快！' },
    insight: { tc: '阿占唔係批判，係想我哋停一停。', sc: '阿占唔系批判，系想我们停一停。' },
    reactions: { heart: 134, like: 195, share: 98 },
  },
  {
    id: 4, img: '/images/04.jpeg', act: 1, emoji: '😢',
    caption: { tc: '即使有一千個理由讓你哭，也要找一個理由令自己笑！', sc: '即使有一千个理由让你哭，也要找一个理由令自己笑！' },
    insight: { tc: '阿占唔係叫你唔好喊，係叫你自己揀幾時笑。', sc: '阿占唔系叫你唔好喊，系叫你自己拣几时笑。' },
    reactions: { heart: 345, like: 234, share: 210 },
  },
  {
    id: 5, img: '/images/05.jpg', act: 1, emoji: '😌',
    caption: { tc: '保持快樂的秘訣，其實只是五個字～不要太用力！', sc: '保持快乐的秘诀，其实只是五个字～不要太用力！' },
    insight: { tc: '香港人太識用力，阿占教我哋鬆一鬆。', sc: '香港人太识用力，阿占教我们松一松。' },
    reactions: { heart: 287, like: 410, share: 321 },
  },
  {
    id: 6, img: '/images/06.jpg', act: 1, emoji: '🧠',
    caption: { tc: '能讓別人快樂的人一定很善良，能讓自己快樂的人一定很聰明！', sc: '能让别人快乐的人一定很善良，能让自己快乐的人一定很聪明！' },
    insight: { tc: '先識令自己快樂，先有力幫人。', sc: '先识令自己快乐，先有力帮人。' },
    reactions: { heart: 398, like: 187, share: 256 },
  },
  {
    id: 7, img: '/images/07.jpeg', act: 2, emoji: '🃏',
    caption: { tc: '每個人都會摸到爛牌，把手上的爛牌打好，是生命裡唯一能做的事！', sc: '每个人都会摸到烂牌，把手上的烂牌打好，是生命里唯一能做的事！' },
    insight: { tc: '阿占唔信命，信牌技——爛牌哲學，逆局王牌。', sc: '阿占唔信命，信牌技——烂牌哲学，逆局王牌。' },
    reactions: { heart: 234, like: 523, share: 432 },
  },
  {
    id: 8, img: '/images/08.jpeg', act: 2, emoji: '😉',
    caption: { tc: '學會隻眼開隻眼閉，你可以輕鬆面對身處高峰或谷底！', sc: '学会隻眼开隻眼闭，你可以轻松面对身处高峰或谷底！' },
    insight: { tc: '有選擇性專注，睇清邊啲值得睇。', sc: '有选择性专注，睇清边啲值得睇。' },
    reactions: { heart: 187, like: 210, share: 198 },
  },
  {
    id: 9, img: '/images/09.jpg', act: 2, emoji: '🎬',
    caption: { tc: '與其在別人的劇本裡客串路人甲，不如在自己的戲中擔當主角！', sc: '与其在别人的剧本里客串路人甲，不如在自己的戏中担当主角！' },
    insight: { tc: '你嘅人生，你寫劇本。', sc: '你嘅人生，你写剧本。' },
    reactions: { heart: 298, like: 387, share: 456 },
  },
  {
    id: 10, img: '/images/10.jpeg', act: 3, emoji: '🍵',
    caption: { tc: '人生就是用你僅有的一二分甜，去沖淡八九分的苦！', sc: '人生就是用你仅有的一二分甜，去冲淡八九分的苦！' },
    insight: { tc: '唔係無苦，係識調味。', sc: '唔系无苦，系识调味。' },
    reactions: { heart: 345, like: 256, share: 210 },
  },
  {
    id: 11, img: '/images/11.jpeg', act: 3, emoji: '🍺',
    caption: { tc: '人生不過三萬天，何不暢飲醉百年！', sc: '人生不过三万天，何不畅饮醉百年！' },
    insight: { tc: '三萬日倒數，今日係第幾日？', sc: '三万日倒数，今日系第几日？' },
    reactions: { heart: 189, like: 432, share: 345 },
  },
  {
    id: 12, img: '/images/12.jpeg', act: 3, emoji: '🍱',
    caption: { tc: '愛情同燒味飯一樣，全部都係整定！', sc: '爱情同烧味饭一样，全部都系整定！' },
    insight: { tc: '阿占係香港人，用燒味飯講緣份。', sc: '阿占系香港人，用烧味饭讲缘份。' },
    reactions: { heart: 456, like: 198, share: 123 },
  },
  {
    id: 13, img: '/images/13.jpeg', act: 3, emoji: '😎',
    caption: { tc: '我能百分之九十七的確定你不喜歡我，但我百分之百肯定我不在乎！', sc: '我能百分之九十七的确定你不喜欢我，但我百分之百肯定我不在乎！' },
    insight: { tc: '自信唔係因為被人鍾意，係因為接受自己。', sc: '自信唔系因为被人钟意，系因为接受自己。' },
    reactions: { heart: 234, like: 567, share: 489 },
  },
  {
    id: 14, img: '/images/14.jpeg', act: 3, emoji: '☂️',
    caption: { tc: '你不為別人擋風遮雨，誰會把你舉在頭上！', sc: '你不为别人挡风遮雨，谁会把你举在头上！' },
    insight: { tc: '付出先係最高級嘅得到。', sc: '付出先系最高级嘅得到。' },
    reactions: { heart: 432, like: 321, share: 287 },
  },
  {
    id: 15, img: '/images/15.jpg', act: 3, emoji: '🥋',
    caption: { tc: '可怕的不是練出一萬招的敵人，而是一招練一萬次的對手！', sc: '可怕的不是练出一万招的敌人，而是一招练一万次的对手！' },
    insight: { tc: '15張作品，同一個風格，練到極致。', sc: '15张作品，同一个风格，练到极致。' },
    reactions: { heart: 345, like: 678, share: 567 },
  },
];

export const QUIZ_RESULTS = {
  tc: [
    { type: '扎心幽默王', desc: '你是派對裡最會讓人笑中帶淚的人。毒舌但溫柔，幽默但深刻。', emoji: '😏' },
    { type: '溫柔治癒師', desc: '你用溫暖的方式提醒身邊的人：放鬆啲，唔好太用力。', emoji: '🌸' },
    { type: '人生哲學家', desc: '你總能在平凡中看到不凡，每句話都是一堂人生課。', emoji: '🎯' },
    { type: '品牌個性派', desc: '你就是你，獨一無二。在自己的戲裡做主角，活出態度。', emoji: '🔥' },
  ],
  sc: [
    { type: '扎心幽默王', desc: '你是派对里最会让人笑中带泪的人。毒舌但温柔，幽默但深刻。', emoji: '😏' },
    { type: '温柔治愈师', desc: '你用温暖的方式提醒身边的人：放松些，不要太用力。', emoji: '🌸' },
    { type: '人生哲学家', desc: '你总能在平凡中看到不凡，每句话都是一堂人生课。', emoji: '🎯' },
    { type: '品牌个性派', desc: '你就是你，独一无二。在自己的戏里做主角，活出态度。', emoji: '🔥' },
  ],
};
