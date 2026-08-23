-- Migration: Create quotes table and seed data
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  insight TEXT NOT NULL,
  image TEXT NOT NULL,
  today_insight TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  order_id INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quote_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_code TEXT NOT NULL,
  reaction_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Seed 133 quotes
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('9fz0', '直播人生', '人生沒有綵排，每天都是直播！', '沒有劇本，沒有重來。每一秒都是首演，觀眾多少不重要，演好自己才是正事。', 'gallery-images/9fz0.jpeg', 1);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('7xc7', '夢與行動', '你可以躺著做一個夢，或是起來完成它！', '夢是免費的，但實現它要付學費。躺著構思，站著執行，兩者缺一不可。', 'gallery-images/7xc7.jpeg', 2);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('qt2b', '四境自處', '在繁華中自律，在低谷中自勵，在傷痛中自癒，在塵埃中自強！', '人在順境要收斂，逆境要沉潛。四種境界，四種修行，都是生命的必修課。', 'gallery-images/qt2b.jpeg', 3);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('s3jl', '乘風破浪', '如果無法一帆風順，那就努力乘風破浪！', '等風來不如追風去。沒有順水的時候，就自己成為那股推力。', 'gallery-images/s3jl.jpeg', 4);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('6lbc', '困難包裝', '上天在送你一份大禮物時，都會用重重困難來包裝！', '最珍貴的禮物，往往包在最難拆的包裝裡。耐心拆下去，總有驚喜。', 'gallery-images/6lbc.jpeg', 5);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('kcg9', '接受大便', '人生就是夾雜苦澀與甜美，有時很糟糕但又很值得紀念，你就是要學會接受這些大便！', '花需要肥料，人需要經歷。那些看似糟糕的東西，往往是成長最好的養分。', 'gallery-images/kcg9.jpeg', 6);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('7otv', '真朋友', '真正的朋友絕不在乎你成不成功厲不厲害，只在乎何時出來一齊食飯！', '真正的朋友不看你的光環，只看你的靈魂。一起吃飯的溫度，勝過千言萬語。', 'gallery-images/7otv.jpeg', 7);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('k14q', '無所謂', '壞消息是你沒辦法讓所有人喜歡你，理解你，接受你，好消息是這都無所謂！', '被理解是緣分，不被理解是常態。放下被人喜歡的執念，才拿得起真正的自由。', 'gallery-images/k14q.jpeg', 8);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('zrkm', '無遺憾', '如果你年輕時只顧吃喝玩樂，等你老了你就會發現，你的人生基本上已經沒有遺憾了！', '盡情活過的人，不會後悔。所謂遺憾，從來不是做了什麼，而是沒做什麼。', 'gallery-images/zrkm.jpeg', 9);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('zylg', '夾硬嚟', '世上無難事，只要夾硬嚟！', '膽子比能力更重要。很多奇蹟，不過是普通人硬著頭皮走出第一步。', 'gallery-images/zylg.jpeg', 10);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('m85a', '停止鼓掌', '人人都愛掌聲，但要學會當人們停止鼓掌時，仍然不放棄自己！', '掌聲是錦上添花，不是雪中送炭。沒人喝彩的日子，更要為自己鼓掌。', 'gallery-images/m85a.jpeg', 11);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('766w', '舒適圈', '希望大家都能走出舒適圈，讓我進去！', '舒適圈之所以舒適，是因為它適合你。強行離開未必是成長，留下來也不一定墮落。', 'gallery-images/766w.jpeg', 12);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('dmgs', '天才真相', '所謂天才，只不過是把別人喝咖啡的時間，都用在了工作上！', '沒有横空出世的奇蹟，只有不為人知的努力。你看到的輕鬆，都是別人練過的沉重。', 'gallery-images/dmgs.jpeg', 13);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('sm4h', '不在乎', '我能百分之九十七的確定你不喜歡我，但我百分之百肯定我不在乎！', '別人的不喜歡是他們的功課，你的不在乎才是你的修行。內心強大，從不討好開始。', 'gallery-images/sm4h.jpeg', 14);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('htgz', '偷不走', '有些東西是別人拿不走的，一是心裏的夢想，二是讀進腦內的書！', '房子會被收走，錢會被花光，但裝進腦袋的東西和刻在心底的夢，誰也奪不走。', 'gallery-images/htgz.jpeg', 15);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('u2zf', '悠長假期', '生命不必每分每秒都衝刺，低潮時，就當是放一個悠長假期！', '生命不是馬拉松，不需要全程衝刺。低潮時休息，是為了更高處的出發。', 'gallery-images/u2zf.jpeg', 16);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('rkyy', '四季有空', '想和你吃飯的人，酸甜苦辣都愛吃，想和你見面的人，春夏秋冬都有空！', '想見你的人，風雨無阻。時間從來不是問題，心意才是唯一的距離。', 'gallery-images/rkyy.jpeg', 17);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('pkfx', '胃口', '即使一無所有，也不能沒有胃口！', '只要還懂得餓，就還有活下去的渴望。胃口是本能，也是希望的證明。', 'gallery-images/pkfx.jpeg', 18);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('qqmh', '七秒記憶', '希望我們能夠像金魚一樣，把所有不開心的事情，只保留七秒鐘的記憶！', '記得太清楚是負擔，忘得太徹底是遺憾。學會選擇性遺忘，是給靈魂減重。', 'gallery-images/qqmh.jpeg', 19);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('ik8n', '放下', '生命中有些問題，不是要你解決，而是要你放下！', '有些結解不開，是因為它本來就不是結，是裝飾。學會分辨，需要比解決更大的智慧。', 'gallery-images/ik8n.jpeg', 20);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('1w96', '開眼閉眼', '學會隻眼開隻眼閉，你可以輕鬆面對身處高峰或谷底！', '看得太清是痛苦，適當糊塗是智慧。知道什麼該認真，什麼該放過，是一輩子的學問。', 'gallery-images/1w96.jpeg', 21);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('yf67', '前度活該', '皇帝死了叫駕崩，和尚死了叫圓寂，前度死了叫活該！', '有些離開是劫後餘生，不是遺憾。把前任當成歷史課本，翻過就好，不用複習。', 'gallery-images/yf67.jpeg', 22);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('dqmk', '今朝醉', '今朝有酒今朝醉，明天更肥明天愁！', '今天的酒今天的歡，明天的憂明天的愁。活在當下不是逃避，是對此刻最大的尊重。', 'gallery-images/dqmk.jpeg', 23);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('ycr5', '夠飽', '愛你的人不會介意你肥不肥，只會擔心你夠不夠飽！', '愛到深處，外貌是浮雲，溫飽是實在。擔心你餓不餓的人，比稱讚你美的人更懂愛。', 'gallery-images/ycr5.jpeg', 24);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('wcfb', '品德湯底', '一個人的品德，跟火鍋的湯底一樣，非常十分的重要！', '品格是一個人的底色。再華麗的擺盤，也掩蓋不了變質的湯底。做人亦然。', 'gallery-images/wcfb.jpeg', 25);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('iz6t', '裝可愛', '阿占忠告各位：為免做成大家尷尬，緊記可愛的人才適合裝可愛！', '真實比完美更動人，自然比刻意更持久。勉強來的東西，終究會露出破綻。', 'gallery-images/iz6t.jpeg', 26);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('jygn', '工作悖論', '人生最痛苦的兩件事：工作和沒工作！', '有是牢籠，無是荒原。人生總在兩難中徘徊，學會與矛盾共處，才是成熟的開始。', 'gallery-images/jygn.jpeg', 27);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('zrrl', '一萬次', '可怕的不是練出一萬招的敵人，而是一招練一萬次的對手！', '廣度讓你見多識廣，深度讓你無可取代。一萬次的重複，是通往極致的唯一捷徑。', 'gallery-images/zrrl.jpeg', 28);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('nuyy', '燒味飯', '愛情同燒味飯一樣，全部都係整定！', '緣分就像燒味飯，賣什麼由天定，吃不吃得開心由你定。接受安排，但不放棄滋味。', 'gallery-images/nuyy.jpeg', 29);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('dapa', '酒難飲', '點解酒好飲？因為酒難飲！', '苦盡甘來不是比喻，是體驗。那些難以下嚥的時刻，往往是後來最懷念的滋味。', 'gallery-images/dapa.jpeg', 30);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('va29', '其實勇善', '其實勇善的武士， 不過是極度專注的普通人', '專注不是天賦，是選擇。當你把所有能量匯聚於一點，平凡也能變得不凡。', 'gallery-images/va29.jpeg', 31);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('8a8w', '人生中努力過', '人生中努力過的事情，沒有一件是白費的！', '努力從不白費，它只是換了個形式回來。那些看似徒勞的堅持，終將在某處開花。', 'gallery-images/8a8w.jpeg', 32);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('gc50', '人生四大言：', '人生四大言： 得間飲茶，轉變就到， 今晚早，開始減肥', '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。', 'gallery-images/gc50.jpeg', 33);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('o3fy', '雖然人生是苦', '雖然人生是苦，別忘了往裡加一點甜！', '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。', 'gallery-images/o3fy.jpeg', 34);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('bhpj', '沒有白費的努力', '沒有白費的努力，更有碰巧的成功！', '努力從不白費，它只是換了個形式回來。那些看似徒勞的堅持，終將在某處開花。', 'gallery-images/bhpj.jpeg', 35);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('07fv', '守住心之所向', '守自己的心之所向， 才可望造你的獨有磁場', '人生最長的關係，是與自己的關係。善待內心那個孩子，他陪你走了一輩子。', 'gallery-images/07fv.jpeg', 36);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('072v', '人生就如馬拉松', '人生就如馬拉松，沒有捷徑，只有努力經營。', '努力從不白費，它只是換了個形式回來。那些看似徒勞的堅持，終將在某處開花。', 'gallery-images/072v.jpeg', 37);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('fpz4', '突破需要嘗試', '突破需要靠嘗試，成功一定要堅持。', '成功不是終點，而是一連串微小堅持的累積。重要的不是結果，是你從未放棄的過程。', 'gallery-images/fpz4.jpeg', 38);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('scro', '有無機會拍拖', '有無機會拍拖同見鬼一樣， 都是要講緣份的', '緣分不可強求，但可以珍惜。來了歡迎，走了祝福，這就是灑脫。', 'gallery-images/scro.jpeg', 39);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('rule', '萬一怪獸打不完 你', '萬一怪獸打不完， 你會不會陪我留在地球？', '成長就是從被怪獸追，到與怪獸共舞。最後發現，怪獸不過是放大的恐懼。', 'gallery-images/rule.jpeg', 40);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('94t7', '風格是一種', '風格是一種不用話， 無需解繹， 就能表達自己的方法', '人生最長的關係，是與自己的關係。善待內心那個孩子，他陪你走了一輩子。', 'gallery-images/94t7.jpeg', 41);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('m81h', '人生不過萬天', '人生不過萬天，何不飲醉有年！', '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。', 'gallery-images/m81h.jpeg', 42);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('pv8f', '人生迷路時 ', '人生迷路時 有兩種最好的指引， 一個是夢想，一個是愛', '夢想不會自己實現，但它會指引方向。追夢的路上，每一步都算數。', 'gallery-images/pv8f.jpeg', 43);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('c5th', '真正的順其自', '真正的順其自然， 其實是竭所能 之後的不強求！', '真正的順其自然，是盡全力後的釋懷。不是無所作為，而是接納所有可能。', 'gallery-images/c5th.jpeg', 44);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('2j28', '藝術的美好', '藝術是在美好的年代提醒人們醜陋的一面，在悲慘的年代去安慰人心。', '藝術是靈魂的鏡子，照見我們不敢直視的真相。它讓苦難有了形狀，也讓希望有了顏色。', 'gallery-images/2j28.jpeg', 45);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('3kse', '我們都在溝裡', '我們都在溝裹， 但有些人仍在仰望星空', '有些話聽起來輕描淡寫，細想卻重如千鈞。這就是生活智慧的份量。', 'gallery-images/3kse.jpeg', 46);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('d2vt', '生活不是等待', '生活不是等待暴風雨過去， 而是學會在雨中翩翩起舞', '生活不在遠方，在當下這一口呼吸裡。學會在平凡中品出滋味，就是最大的智慧。', 'gallery-images/d2vt.jpeg', 47);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('s48d', '你不為人遮風擋雨', '你不為人遮風擋雨，誰會在你頭上撐傘。', '真理往往藏在玩笑裡。笑過之後，留下的是回味與頓悟。', 'gallery-images/s48d.jpeg', 48);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('0rrz', '念念不忘 必', '念念不忘，必有迴響。', '人生沒有標準答案，但這句話提供了一個溫柔的視角。換個角度看，海闊天空。', 'gallery-images/0rrz.jpeg', 49);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('jasv', '若感動過若燦爛過', '若感動過，若燦過， 不枉過', '有些話聽起來輕描淡寫，細想卻重如千鈞。這就是生活智慧的份量。', 'gallery-images/jasv.jpeg', 50);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('zs5u', '要生活得漂亮 需', '要生活得漂亮，需要付出極大忍耐，一不抱怨，二不解釋！', '生活不在遠方，在當下這一口呼吸裡。學會在平凡中品出滋味，就是最大的智慧。', 'gallery-images/zs5u.jpeg', 51);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('d8qr', '人生就是不斷的選擇', '人生就是不斷的選擇，選擇了就不要後悔。', '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。', 'gallery-images/d8qr.jpeg', 52);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('chc4', '歲月教會了我', '月教會了我， 除了等外，都不必等', '有些話聽起來輕描淡寫，細想卻重如千鈞。這就是生活智慧的份量。', 'gallery-images/chc4.jpeg', 53);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('ni9y', '想都是問題做才有答案', '想都是問題， 做才有答案', '想都是問題，做才是答案。行動是打破焦慮的唯一武器。', 'gallery-images/ni9y.jpeg', 54);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('f8am', '人生大錯覺：', '人生大錯覺： 手機振動，有人敲門， 他很愛我', '愛是世間最簡單也最複雜的事。給出去，它就流動起來，最終回到你身上。', 'gallery-images/f8am.jpeg', 55);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('nwxk', '人人都愛掌聲但要學會堅持', '人人都愛掌聲，但要學會當人們停止鼓掌時，仍然不放棄自己！', '愛是世間最簡單也最複雜的事。給出去，它就流動起來，最終回到你身上。', 'gallery-images/nwxk.jpeg', 56);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('tulz', '你讀過的書', '你讀過的書，走過的路， 和曾經努力過的事， 全都刻在你的氣質上', '努力從不白費，它只是換了個形式回來。那些看似徒勞的堅持，終將在某處開花。', 'gallery-images/tulz.jpeg', 57);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('r4v1', '希望每天吃', '希望每天吃的熱量，能轉化成正能量！', '吃是生存，也是生活。對食物的熱愛，是對生命最樸素的致敬。', 'gallery-images/r4v1.jpeg', 58);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('9nr8', '夢想不會逃走 逃走', '夢想不會逃走， 逃走的往往只是自己', '夢想不會自己實現，但它會指引方向。追夢的路上，每一步都算數。', 'gallery-images/9nr8.jpeg', 59);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('v08e', '越是關鍵的時刻越要從容', '越是關鍵的時刻，越是要從容。', '有時候一句話的價值，不在於它說了什麼，而在於它讓你想起了什誰。', 'gallery-images/v08e.jpeg', 60);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('n28i', '厄運不會太久', '厄運不會太久，等候多兩秒吧，天會隨時逆轉所有錯。', '厄運不會太久，因為它不屬於你。撐住，天總會亮。', 'gallery-images/n28i.jpeg', 61);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('oxuh', '習武之人必有三見', '習武之人必有三個階段，見自己，見天地，見眾生。', '人生最長的關係，是與自己的關係。善待內心那個孩子，他陪你走了一輩子。', 'gallery-images/oxuh.jpeg', 62);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('la94', '請不要放棄', '請不要放棄，十年後，所有難過都只是下酒的菜。', '酒是放大鏡，放大了歡樂，也放大了悲傷。適量是詩，過量是傷。', 'gallery-images/la94.jpeg', 63);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('yxbw', '人有很多種 ', '人有很多種， 有些人跟牛扒一樣， 還是不要太熟比好', '人與人的距離，就像牛扒的熟度。太近會膩，適當留白才美味。', 'gallery-images/yxbw.jpeg', 64);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('04gb', '被以外的地方都', '床以外的地方都是遠方！', '遠方不在地圖上，在心裡。當你感到被困，也許只是視角需要調整。', 'gallery-images/04gb.jpeg', 65);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('aeyb', '人生要不是大冒險', '人生要不是大冒險，便是一無所獲。', '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。', 'gallery-images/aeyb.jpeg', 66);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('ixob', '有很多事情一覺就沒事', '有很多事情，一覺起來就會沒事的了。', '人生百態，這句話捕捉了其中一種微妙的平衡。品一品，別有滋味。', 'gallery-images/ixob.jpeg', 67);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('vf6f', '人間有情', '人間有情： 感人有親情，醉人是愛情， 人人怕疫情', '愛是世間最簡單也最複雜的事。給出去，它就流動起來，最終回到你身上。', 'gallery-images/vf6f.jpeg', 68);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('4t3i', '生活中有件重要', '生活中有件重要的事情： 第一件是吃， 剩下的兩件我自前還未發現！', '生活不在遠方，在當下這一口呼吸裡。學會在平凡中品出滋味，就是最大的智慧。', 'gallery-images/4t3i.jpeg', 69);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('4l1g', '成年人都', '成年人都是過期的小朋友', '真正的朋友不在數量，而在質量。能在低谷時陪你吃飯的人，勝過無數點讚。', 'gallery-images/4l1g.jpeg', 70);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('fb3z', '我的愛好動靜', '我的愛好動靜皆宙， 靜態是睡覺，動態是轉身', '愛是世間最簡單也最複雜的事。給出去，它就流動起來，最終回到你身上。', 'gallery-images/fb3z.jpeg', 71);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('gkhk', '接納每一次失去', '接納每一次失去，擁抱每一場相遇。', '每一次失去都是為了更好的相遇。抱緊當下，因為此刻轉瞬即逝。', 'gallery-images/gkhk.jpeg', 72);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('imqf', '隨著時代進步', '隨著時代進步， 阿占的腹肌， 現已改為宇宙', '外表會老，靈魂不會。與其糾結腹肌，不如豐富內在。', 'gallery-images/imqf.jpeg', 73);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('osj8', '醉過方知酒濃', '醉過方知酒濃， 肥過方知肉重', '酒是放大鏡，放大了歡樂，也放大了悲傷。適量是詩，過量是傷。', 'gallery-images/osj8.jpeg', 74);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('srro', '人生就像大便', '人生就像大便一樣，有軟有硬，有順有不順。', '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。', 'gallery-images/srro.jpeg', 75);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('1cz5', '不用強裝作強', '不用強裝作強，偶爾像個孩子也很好！', '童心不是幼稚，是歷經滄桑後仍保有好奇。大人只是過期的小孩，別忘了初心。', 'gallery-images/1cz5.jpeg', 76);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('5jcl', '小時候飲支可', '小時候飲支可樂已經好開心， 長大後飲支牌酒才那難過', '酒是放大鏡，放大了歡樂，也放大了悲傷。適量是詩，過量是傷。', 'gallery-images/5jcl.jpeg', 77);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('98qn', '人的眼睛有5.76億像素', '人的眼睛有5.76億像素，但始終看不懂人心。', '眼睛看見表象，心才能觸及本質。最難的不是認識世界，是認識人心。', 'gallery-images/98qn.jpeg', 78);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('5919', '小時候總愛幻想', '小時候總愛幻想自己能拯救世界，現在希望生活能放過自己。', '愛是世間最簡單也最複雜的事。給出去，它就流動起來，最終回到你身上。', 'gallery-images/5919.jpeg', 79);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('avf6', '活著大吃大喝也是尊重', '活著大吃大喝， 也是對生命的尊重', '吃是生存，也是生活。對食物的熱愛，是對生命最樸素的致敬。', 'gallery-images/avf6.jpeg', 80);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('gset', '只有苦七十二變 ', '只有苦七十二變， 才能笑對八十一難', '唯一不變的是變化本身。擁抱變化，就是擁抱生命。', 'gallery-images/gset.jpeg', 81);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('4cvk', '成長就是不被追打', '成長就是一個 不被怪獸追打的過程', '成長是痛苦的，因為它在打破舊有的自己。但每一次破碎，都是為了更好的重組。', 'gallery-images/4cvk.jpeg', 82);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('no30', '如果想身心健康', '如果想身心健康， 大人每天起碼要有1分鐘， 真地當小孩', '大人每天需要十五分鐘當小孩，這不是逃避，是給靈魂放假。', 'gallery-images/no30.jpeg', 83);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('infm', '藝術的美好', '藝術的美好就是無論怎樣，它仍然給我們力量走過苦難。', '藝術是靈魂的鏡子，照見我們不敢直視的真相。它讓苦難有了形狀，也讓希望有了顏色。', 'gallery-images/infm.jpeg', 84);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('9v7i', '人生就', '人生就是用你懂有的一二分甜， 去冲淡八九分的苦！', '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。', 'gallery-images/9v7i.jpeg', 85);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('oko2', '後天的努力比什都重', '後天的努力比什麼都重要，所以今天和明天我先休息。', '努力從不白費，它只是換了個形式回來。那些看似徒勞的堅持，終將在某處開花。', 'gallery-images/oko2.jpeg', 86);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('6pzp', '人各有志 ', '人各有志， 在人選生兒生女中， 我選了生牌', '人生選擇千千萬，選自己開心的那個，就對了。', 'gallery-images/6pzp.jpeg', 87);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('2m0h', '人生己多風霜', '人生己多風霜， 何妨大醉一場', '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。', 'gallery-images/2m0h.jpeg', 88);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('3edt', '世上沒有完美的人', '世上沒有完美的人，完美的人只存在於墓裡，當你遇到麻煩，那就證明你還好好活著。', '在紛擾的世界裡，這句話像一盞小燈，照亮腳下一步的路。', 'gallery-images/3edt.jpeg', 89);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('6jzm', '當你想放棄的時候', '當你想放棄的時候，請記住，可口可樂第一年只賣了25瓶！', '快樂變難了，不是世界變了，是我們變複雜了。偶爾回到簡單，就是療癒。', 'gallery-images/6jzm.jpeg', 90);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('mofk', '對於不會話', '對於不會說話的人，衣服是一種語言！', '人生百態，這句話捕捉了其中一種微妙的平衡。品一品，別有滋味。', 'gallery-images/mofk.jpeg', 91);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('c1zw', '人生最大的風險', '人生最大的風險，是不敢去冒險！', '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。', 'gallery-images/c1zw.jpeg', 92);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('hamk', '即使不能光芒', '即使不能光芒萬丈， 也要活得溫暖有光', '人生百態，這句話捕捉了其中一種微妙的平衡。品一品，別有滋味。', 'gallery-images/hamk.jpeg', 93);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('orpw', '你不可能十全十美 ', '你不可能十全十美， 但你能獨一無二', '有些話聽起來輕描淡寫，細想卻重如千鈞。這就是生活智慧的份量。', 'gallery-images/orpw.jpeg', 94);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('ehaq', '勇氣是什麼', '勇氣是什麼？勇氣就是明知道會胖，我還是要吃。', '勇氣不是不害怕，是害怕仍然前行。每一次硬著頭皮的出發，都是成長的印記。', 'gallery-images/ehaq.jpeg', 95);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('h9r6', '能讓人快樂', '能讓人快樂的人一定很善良，能讓自己快樂的人一定很聰明。', '人生最長的關係，是與自己的關係。善待內心那個孩子，他陪你走了一輩子。', 'gallery-images/h9r6.jpeg', 96);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('ounb', '話的藝術', '話的藝術，就是當你要說關你屁事的時候，改成謝謝你的建議。', '藝術是靈魂的鏡子，照見我們不敢直視的真相。它讓苦難有了形狀，也讓希望有了顏色。', 'gallery-images/ounb.jpeg', 97);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('cl7h', '以前打風愛打牌', '以前打風愛打牌，現在打風睡周公！', '愛是世間最簡單也最複雜的事。給出去，它就流動起來，最終回到你身上。', 'gallery-images/cl7h.jpeg', 98);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('cjp6', '沒有太晚的開始', '沒有太晚的開始，只有過多的疑慮！', '不需要太多解釋，這句話本身就是答案。懂的人，自然會心一笑。', 'gallery-images/cjp6.jpeg', 99);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('wn9e', '請好好打扮自己', '請好好打扮自己， 你的衣著品味就是你行走的名片', '人生最長的關係，是與自己的關係。善待內心那個孩子，他陪你走了一輩子。', 'gallery-images/wn9e.jpeg', 100);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('9b26', '人生如粽 經', '人生如粽， 經得起熱水沸騰， 耐得住冷藏冰凍', '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。', 'gallery-images/9b26.jpeg', 101);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('g5tm', '辨識一個人', '辨識一個人，不是看他說了什麼，而是看他做了什麼！', '想都是問題，做才是答案。行動是打破焦慮的唯一武器。', 'gallery-images/g5tm.jpeg', 102);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('62mx', '心無所求', '心無所求，才可以滿載而歸', '有些話聽起來輕描淡寫，細想卻重如千鈞。這就是生活智慧的份量。', 'gallery-images/62mx.jpeg', 103);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('jrpv', '少研究人多塑', '少研究人，多塑造自己！', '人生最長的關係，是與自己的關係。善待內心那個孩子，他陪你走了一輩子。', 'gallery-images/jrpv.jpeg', 104);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('y8pc', '如果你到了三十歲', '如果你到了三十歲，才去買你十八歲喜歡的東西，其實已經沒有什麼意義了。', '人生沒有標準答案，但這句話提供了一個溫柔的視角。換個角度看，海闊天空。', 'gallery-images/y8pc.jpeg', 105);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('w1ht', '世界不變唯有熱誠', '世界不變，唯有熱誠永恒，抓住你喜愛的事，全力以赴去完成它！', '愛是世間最簡單也最複雜的事。給出去，它就流動起來，最終回到你身上。', 'gallery-images/w1ht.jpeg', 106);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('4rgw', '長大後夢想越', '長大後夢想越來越微弱，但我不會讓它消失。', '夢想不會自己實現，但它會指引方向。追夢的路上，每一步都算數。', 'gallery-images/4rgw.jpeg', 107);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('g4lm', '只要不停步永遠', '只要不停步，永遠有出路， 只要不放，終點等待你', '等待是種修行。有些東西，時間到了自然會來，急不來。', 'gallery-images/g4lm.jpeg', 108);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('xeec', '活了大半輩子', '活了大半輩子，我最離不開的，就是早上溫暖的被窩。', '不需要太多解釋，這句話本身就是答案。懂的人，自然會心一笑。', 'gallery-images/xeec.jpeg', 109);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('fsqz', '過去已過去 ', '過去已過去， 未來還未來， 活在當下最實在', '過去是影子，未來是霧，只有當下是實在。活在此刻，就是對生命最大的誠意。', 'gallery-images/fsqz.jpeg', 110);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('f3x1', '你買的不只', '你買的不只是玩具， 是現代人的孤單解藥', '買玩具治癒的不是孤單，是內心那個長不大的孩子。偶爾寵溺自己，無可厚非。', 'gallery-images/f3x1.jpeg', 111);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('o3ct', '勇敢是明知難', '勇敢是明知難， 仍然力前行！', '勇敢是明知艱難，仍然前行。這不是魯莽，是對生命最深情的回應。', 'gallery-images/o3ct.jpeg', 112);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('p5og', '值得溫柔對待的', '值得溫柔對待的，除了女人之外，一定係食物！', '溫柔不是軟弱，是力量的一種形式。對人溫柔，對食物也溫柔，這就是生活美學。', 'gallery-images/p5og.jpeg', 113);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('ws02', '品味品味 ', '品味，品味， 有品先有味', '品味是內在的修養外顯於生活。有品，才有味；有味，才有質感。', 'gallery-images/ws02.jpeg', 114);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('ryg6', '請不用擔心失敗', '請不用擔心失敗，因你只需要一次成功。', '成功不是終點，而是一連串微小堅持的累積。重要的不是結果，是你從未放棄的過程。', 'gallery-images/ryg6.jpeg', 115);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('w6bn', '如果夢想有捷徑', '如果夢想有捷徑，這條路必定叫堅持。', '夢想不會自己實現，但它會指引方向。追夢的路上，每一步都算數。', 'gallery-images/w6bn.jpeg', 116);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('9h9f', '不要輕易放棄你的夢', '不要輕易放棄你的夢，繼續睡吧。', '夢想值得追，但也值得再睡一會。休息是為了更好地出發。', 'gallery-images/9h9f.jpeg', 117);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('umu3', '心裡的垃圾', '心裡的垃圾要定期清理， 才能騰出空間存快樂', '心裡的垃圾要定期清理，就像房間要掃除。騰出空間，快樂才能住進來。', 'gallery-images/umu3.jpeg', 118);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('sd9h', '不怕路途遠 ', '不怕路途遠， 只怕志向太短', '路遠不要緊，志向短才可怕。心有多大，舞台就有多大。', 'gallery-images/sd9h.jpeg', 119);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('1zhk', '不管形勢有多難', '不管形勢有多難，還有我和你一起。', '無論形勢多壞，知道有人陪你，就是最大的力量。孤獨是選擇，陪伴是禮物。', 'gallery-images/1zhk.jpeg', 120);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('8128', '減肥同返工一樣', '減肥同返工一樣，做又受，唔做又受(腰圍)！', '想都是問題，做才是答案。行動是打破焦慮的唯一武器。', 'gallery-images/8128.jpeg', 121);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('1apg', '在學校你會先上課', '在學校你會先上課後測驗， 在生活中你受到的考驗 會直接令你上了一課', '生活不在遠方，在當下這一口呼吸裡。學會在平凡中品出滋味，就是最大的智慧。', 'gallery-images/1apg.jpeg', 122);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('d6yy', '因為每天都有新打擊', '因為每天都有新打擊，所以要好好活下去。', '每天都有新的打擊，這就是生活。但正是這些打擊，讓我們學會堅韌。', 'gallery-images/d6yy.jpeg', 123);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('xxq4', '愛過痛過 過', '愛過、痛過、失敗過、成功過，就是未瘦過。', '成功不是終點，而是一連串微小堅持的累積。重要的不是結果，是你從未放棄的過程。', 'gallery-images/xxq4.jpeg', 124);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('6dvh', '低頭做事抬頭做人', '低頭做事， 抬頭做人', '想都是問題，做才是答案。行動是打破焦慮的唯一武器。', 'gallery-images/6dvh.jpeg', 125);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('flrk', '即使有一千個理由', '即使有一千個理由讓你哭，也要找一個理由讓自己笑！', '人生最長的關係，是與自己的關係。善待內心那個孩子，他陪你走了一輩子。', 'gallery-images/flrk.jpeg', 126);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('dj0l', '成功就是跌倒九次', '成功就是跌倒九次， 起來十次！', '成功不是終點，而是一連串微小堅持的累積。重要的不是結果，是你從未放棄的過程。', 'gallery-images/dj0l.jpeg', 127);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('xpi3', '寧最後徒無功 也', '寧最後徒無功， 也不選無動於衷', '簡單的道理往往最深刻。這句話像一面鏡子，照見我們忽略已久的真相。', 'gallery-images/xpi3.jpeg', 128);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('puzk', '世界愈是讓人沮喪', '世界愈是讓人沮喪，你愈是不能放棄希望！', '不需要太多解釋，這句話本身就是答案。懂的人，自然會心一笑。', 'gallery-images/puzk.jpeg', 129);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('c2uy', '每個人都會摸到牌', '每個人都會摸到牌，把手上的牌打好，是生命裡唯一能做的事！', '想都是問題，做才是答案。行動是打破焦慮的唯一武器。', 'gallery-images/c2uy.jpeg', 130);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('e16q', '不怕萬人阻擋', '不怕萬人阻擋，只怕自己投降！', '人生最長的關係，是與自己的關係。善待內心那個孩子，他陪你走了一輩子。', 'gallery-images/e16q.jpeg', 131);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('tmo4', '手機在手天長', '手機在手，天長地久， 機不在手，靈魂都有', '手機是工具，不是主人。放下它，靈魂才能自由呼吸。', 'gallery-images/tmo4.jpeg', 132);
INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('yqti', '風雨不會停', '風雨不會停，終會等到夢寐以求。', '風雨不會永遠持續，夢寐以求的東西，終會在堅持後到來。', 'gallery-images/yqti.jpeg', 133);