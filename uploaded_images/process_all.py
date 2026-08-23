import os
import json
import shutil
import random
import string

src_dir = r'E:\Projects\JameStyle\uploaded_images\Jamestyle Original'
upload_dir = r'E:\Projects\JameStyle\uploaded_images\gallery_upload'
json_path = r'E:\Projects\JameStyle\.build_src\public\gallery-data.json'

def gen_code():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))

def clean_caption(raw):
    # Remove common noise
    noise = ['DO', 'E', 'WTAPS', 'FCK', 'O)', 'QC', 'm', 'C', 'D', '三', '5', '0O', 'O.0', 'OO', 'lo',
             'Heineken', 'History', 'Bristol', 'Supreme', 'WHISKY', "children's day special edition",
             'PO', '888', '五班班', '九萬', '东南西北', '目', '业', '?']
    for n in noise:
        raw = raw.replace(n, '')
    raw = raw.replace('阿占随意', '').strip()
    # Clean up multiple spaces
    while '  ' in raw:
        raw = raw.replace('  ', ' ')
    return raw.strip(' !，。')

def generate_title(caption):
    # Extract key phrase for title (first 4-6 chars of core meaning)
    # Remove punctuation
    clean = caption.replace('，', '').replace('。', '').replace('！', '').replace('？', '').replace('、', '')
    if len(clean) <= 6:
        return clean
    # Try to find a natural break point
    breakpoints = ['是', '的', '在', '就', '要', '會', '有', '不', '才', '而', '但', '讓', '把']
    for bp in breakpoints:
        idx = clean.find(bp, 2, 10)
        if idx > 2:
            return clean[:idx]
    return clean[:6]

def generate_insight(caption):
    # Simple rule-based insight generation based on keywords
    caption_lower = caption.lower()
    
    insights = {
        '專注': '專注不是天賦，是選擇。當你把所有能量匯聚於一點，平凡也能變得不凡。',
        '努力': '努力從不白費，它只是換了個形式回來。那些看似徒勞的堅持，終將在某處開花。',
        '成功': '成功不是終點，而是一連串微小堅持的累積。重要的不是結果，是你從未放棄的過程。',
        '夢想': '夢想不會自己實現，但它會指引方向。追夢的路上，每一步都算數。',
        '愛': '愛是世間最簡單也最複雜的事。給出去，它就流動起來，最終回到你身上。',
        '朋友': '真正的朋友不在數量，而在質量。能在低谷時陪你吃飯的人，勝過無數點讚。',
        '人生': '人生沒有標準答案，只有不斷修正的過程。接受不完美，就是完美的開始。',
        '放下': '執念是苦的根源。學會放手，不是認輸，是給自己騰出空間，迎接新的可能。',
        '堅持': '最難的不是開始，是繼續。當所有人都在放棄，你的堅持就是最大的勝利。',
        '時間': '時間是唯一的公平。你怎麼花它，它就怎麼回報你。當下即是永恆。',
        '勇氣': '勇氣不是不害怕，是害怕仍然前行。每一次硬著頭皮的出發，都是成長的印記。',
        '自己': '人生最長的關係，是與自己的關係。善待內心那個孩子，他陪你走了一輩子。',
        '生活': '生活不在遠方，在當下這一口呼吸裡。學會在平凡中品出滋味，就是最大的智慧。',
        '成長': '成長是痛苦的，因為它在打破舊有的自己。但每一次破碎，都是為了更好的重組。',
        '忘記': '記得太滿，心會溢出。適當遺忘是種智慧，讓靈魂有喘息的空間。',
        '順其自然': '真正的順其自然，是盡全力後的釋懷。不是無所作為，而是接納所有可能。',
        '藝術': '藝術是靈魂的鏡子，照見我們不敢直視的真相。它讓苦難有了形狀，也讓希望有了顏色。',
        '風格': '風格不是裝出來的，是活出來的。當你足夠真實，獨特性自然會散發。',
        '迷路': '迷路不是壞事，它意味著你走出了舒適區。夢想與愛，是永遠的北極星。',
        '緣份': '緣分不可強求，但可以珍惜。來了歡迎，走了祝福，這就是灑脫。',
        '疫情': '親情是根，愛情是花，而恐懼是雜草。別讓雜草遮住了根與花的美。',
        '胖': '身材的焦慮是時代強加的。能吃是福，會笑是慧，健康比數字重要得多。',
        '大便': '人生有順有不順，正如排泄有暢有滯。接納全部，才是真實。',
        '休息': '休息不是懶惰，是充電。懂得停下的人，才能走得更遠。',
        '酒': '酒是放大鏡，放大了歡樂，也放大了悲傷。適量是詩，過量是傷。',
        '吃': '吃是生存，也是生活。對食物的熱愛，是對生命最樸素的致敬。',
        '孩子': '童心不是幼稚，是歷經滄桑後仍保有好奇。大人只是過期的小孩，別忘了初心。',
        '人心': '眼睛看見表象，心才能觸及本質。最難的不是認識世界，是認識人心。',
        '當下': '過去是影子，未來是霧，只有當下是實在。活在此刻，就是對生命最大的誠意。',
        '變': '唯一不變的是變化本身。擁抱變化，就是擁抱生命。',
        '讀書': '你讀過的書、走過的路，都會沉澱為氣質。這是誰也偷不走的財富。',
        '等待': '等待是種修行。有些東西，時間到了自然會來，急不來。',
        '做': '想都是問題，做才是答案。行動是打破焦慮的唯一武器。',
        '錯覺': '很多執念不過是錯覺。放下期待，才能看見真實。',
        '掌聲': '外在的認同是錦上添花，內心的平靜才是雪中送炭。沒人鼓掌時，更要為自己喝彩。',
        '熱量': '身體需要能量，心靈也是。讓食物成為快樂的來源，而不是罪惡的負擔。',
        '隨意': '隨意不是隨便，是歷經千帆後的從容。關鍵時刻的淡定，來自平日的積累。',
        '厄運': '厄運不會太久，因為它不屬於你。撐住，天總會亮。',
        '見自己': '見自己，見天地，見眾生。這是人生的三重境界，也是修行的三個階段。',
        '放棄': '十年後回望，今天的難過不過是下酒菜。時間是最好的釀酒師。',
        '牛扒': '人與人的距離，就像牛扒的熟度。太近會膩，適當留白才美味。',
        '遠方': '遠方不在地圖上，在心裡。當你感到被困，也許只是視角需要調整。',
        '冒險': '人生要麼是一場大冒險，要麼就什麼都不是。安全區是舒適的，也是停滯的。',
        '睡覺': '能睡是福，會醒是慧。動靜皆宜，才是生活的藝術。',
        '親情': '親情是來時的路，愛情是沿途的風景。兩者皆美，缺一不可。',
        '失去': '每一次失去都是為了更好的相遇。抱緊當下，因為此刻轉瞬即逝。',
        '腹肌': '外表會老，靈魂不會。與其糾結腹肌，不如豐富內在。',
        '強裝': '脆弱不是弱點，是真實。允許自己偶爾像個孩子，是對靈魂的溫柔。',
        '可樂': '快樂變難了，不是世界變了，是我們變複雜了。偶爾回到簡單，就是療癒。',
        '像素': '科技再發達，也測量不了人心。有些東西，只能用心感受。',
        '拯救': '小時候想拯救世界，長大後發現能拯救自己已經很了不起。',
        '大吃大喝': '活著就要好好吃，這不是放縱，是對生命的尊重。每一口都是感恩。',
        '七十二變': '苦難是修行的燃料。沒有八十一難，哪來的通透與豁達。',
        '怪獸': '成長就是從被怪獸追，到與怪獸共舞。最後發現，怪獸不過是放大的恐懼。',
        '小孩': '大人每天需要十五分鐘當小孩，這不是逃避，是給靈魂放假。',
        '藝術的力量': '藝術的意義，在於它讓我們在黑暗中看見光。無論多苦，美總能治癒。',
        '甜': '人生苦多甜少，所以那一二分甜才彌足珍貴。學會在苦中品甜，是最高級的智慧。',
        '後天': '後天的努力很重要，所以今天和明天先休息——這不是懶，是懂得蓄力。',
        '生牌': '人生選擇千千萬，選自己開心的那個，就對了。',
        '風霜': '風霜是歲月的禮物，它讓酒更醇，讓人更厚。大醉一場，是對風霜最瀟灑的回敬。',
        '麻煩': '麻煩是活著的證明。沒有麻煩的人生，就像沒有波瀾的湖面，了無生趣。',
        '可樂第一年': '偉大的事物都始於微小。可樂第一年只賣了 25 瓶，你的夢想也值得堅持。',
        '三十': '十八歲的東西三十歲才買，意義確實不同了。所以，想做的事，現在就去做。',
        '熱誠': '世界千變萬化，唯有熱誠永恒。抓住你愛的，全力以赴，這就是活著的意義。',
        '出路': '只要不停步，路就會出現。終點永遠在等著不放棄的人。',
        '被子': '離不開溫暖的被窩，不是懶，是身體在誠實地告訴你：休息也是必需品。',
        '當下最實在': '過去已逝，未來未至。當下這一秒，才是真實擁有的全部。',
        '玩具': '買玩具治癒的不是孤單，是內心那個長不大的孩子。偶爾寵溺自己，無可厚非。',
        '勇敢': '勇敢是明知艱難，仍然前行。這不是魯莽，是對生命最深情的回應。',
        '溫柔': '溫柔不是軟弱，是力量的一種形式。對人溫柔，對食物也溫柔，這就是生活美學。',
        '品味': '品味是內在的修養外顯於生活。有品，才有味；有味，才有質感。',
        '成功一次': '失敗是過程，成功是結果。你只需要一次成功，就能覆蓋所有的失敗。',
        '捷徑': '如果夢想有捷徑，那條路一定叫堅持。沒有例外。',
        '續睡': '夢想值得追，但也值得再睡一會。休息是為了更好地出發。',
        '垃圾': '心裡的垃圾要定期清理，就像房間要掃除。騰出空間，快樂才能住進來。',
        '志向': '路遠不要緊，志向短才可怕。心有多大，舞台就有多大。',
        '一起': '無論形勢多壞，知道有人陪你，就是最大的力量。孤獨是選擇，陪伴是禮物。',
        '減肥': '減肥和返工一樣，做與不做都是三十六。與其糾結，不如接納。',
        '考驗': '生活沒有預習，考驗直接來臨。但每一次考驗，都是一堂珍貴的課。',
        '活下去': '每天都有新的打擊，這就是生活。但正是這些打擊，讓我們學會堅韌。',
        '愛過痛過': '愛過、痛過、醉過、成功過，就是人生。瘦不瘦，沒那麼重要。',
        '低頭': '低頭做事，抬頭做人。踏實與格局，缺一不可。',
        '笑': '有一千個理由哭，也要找一個理由笑。笑是靈魂的陽光，能驅散所有陰霾。',
        '跌倒': '成功就是跌倒九次，起來十次。多那一次，就是勝利。',
        '寧願': '寧願徒勞無功地嘗試，也不願無動於衷地旁觀。行動本身就是意義。',
        '沮喪': '世界愈沮喪，愈不能放棄希望。因為希望是唯一的逆風飛行的翅膀。',
        '牌': '每個人手上的牌不同，但把爛牌打好，才是生命的真功夫。',
        '投降': '不怕萬人阻擋，只怕自己投降。最大的敵人，從來都是自己。',
        '手機': '手機是工具，不是主人。放下它，靈魂才能自由呼吸。',
        '風雨': '風雨不會永遠持續，夢寐以求的東西，終會在堅持後到來。',
    }
    
    # Keyword matching
    for keyword, insight in insights.items():
        if keyword in caption:
            return insight
    
    # Fallback insights based on length/mood
    fallbacks = [
        '簡單的道理往往最深刻。這句話像一面鏡子，照見我們忽略已久的真相。',
        '人生沒有標準答案，但這句話提供了一個溫柔的視角。換個角度看，海闊天空。',
        '有些話聽起來輕描淡寫，細想卻重如千鈞。這就是生活智慧的份量。',
        '在紛擾的世界裡，這句話像一盞小燈，照亮腳下一步的路。',
        '真理往往藏在玩笑裡。笑過之後，留下的是回味與頓悟。',
        '不需要太多解釋，這句話本身就是答案。懂的人，自然會心一笑。',
        '人生百態，這句話捕捉了其中一種微妙的平衡。品一品，別有滋味。',
        '有時候一句話的價值，不在於它說了什麼，而在於它讓你想起了什誰。',
    ]
    return random.choice(fallbacks)

# Load existing gallery data
with open(json_path, 'r', encoding='utf-8') as f:
    existing = json.load(f)

# Load OCR results
with open(r'E:\Projects\JameStyle\uploaded_images\ocr_all.json', 'r', encoding='utf-8') as f:
    ocr_data = json.load(f)

# Process each OCR result
gallery_items = existing['gallery'].copy()
existing_codes = {item['code'] for item in gallery_items}

for item in ocr_data:
    idx = item['idx']
    file_name = item['file']
    raw_caption = item.get('caption', '')
    
    if not raw_caption:
        print(f'Skipping {file_name} - no caption')
        continue
    
    caption = clean_caption(raw_caption)
    if len(caption) < 5:
        print(f'Skipping {file_name} - caption too short: {caption}')
        continue
    
    title = generate_title(caption)
    insight = generate_insight(caption)
    
    # Generate unique code
    code = gen_code()
    while code in existing_codes:
        code = gen_code()
    existing_codes.add(code)
    
    gallery_items.append({
        'code': code,
        'id': idx,
        'title': title,
        'caption': caption,
        'insight': insight,
        'image': f'gallery-images/{code}.jpeg'
    })
    
    # Copy image
    src_path = os.path.join(src_dir, file_name)
    dst_path = os.path.join(upload_dir, f'{code}.jpeg')
    shutil.copy2(src_path, dst_path)
    
    print(f'{idx}: {title} -> {code}.jpeg')

# Save updated JSON
existing['gallery'] = gallery_items
existing['total'] = len(gallery_items)

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

print(f'\nTotal gallery items: {len(gallery_items)}')
