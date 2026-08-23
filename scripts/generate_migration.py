import json
import os

# Read gallery-data.json with UTF-8
with open('.build_src/public/gallery-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

quotes = data['gallery']
print(f'Total quotes: {len(quotes)}')

# Generate SQL
sql_lines = []
sql_lines.append('-- Migration: Create quotes table and seed data')
sql_lines.append('CREATE TABLE IF NOT EXISTS quotes (')
sql_lines.append('  id INTEGER PRIMARY KEY AUTOINCREMENT,')
sql_lines.append('  code TEXT NOT NULL UNIQUE,')
sql_lines.append('  title TEXT NOT NULL,')
sql_lines.append('  caption TEXT NOT NULL,')
sql_lines.append('  insight TEXT NOT NULL,')
sql_lines.append('  image TEXT NOT NULL,')
sql_lines.append('  today_insight TEXT,')
sql_lines.append('  updated_at INTEGER DEFAULT (unixepoch()),')
sql_lines.append('  order_id INTEGER DEFAULT 0')
sql_lines.append(');')
sql_lines.append('')
sql_lines.append('CREATE TABLE IF NOT EXISTS quote_reactions (')
sql_lines.append('  id INTEGER PRIMARY KEY AUTOINCREMENT,')
sql_lines.append('  quote_code TEXT NOT NULL,')
sql_lines.append('  reaction_type TEXT NOT NULL,')
sql_lines.append('  session_id TEXT NOT NULL,')
sql_lines.append('  created_at INTEGER DEFAULT (unixepoch())')
sql_lines.append(');')
sql_lines.append('')
sql_lines.append('-- Seed 134 quotes')

for item in quotes:
    code = item['code'].replace("'", "''")
    title = item['title'].replace("'", "''")
    caption = item['caption'].replace("'", "''")
    insight = item['insight'].replace("'", "''")
    image = item['image'].replace("'", "''")
    order_id = item.get('id', 0)
    sql_lines.append(f"INSERT OR IGNORE INTO quotes (code, title, caption, insight, image, order_id) VALUES ('{code}', '{title}', '{caption}', '{insight}', '{image}', {order_id});")

# Also create index
sql_lines.append('CREATE INDEX IF NOT EXISTS idx_quote_reactions_code ON quote_reactions(quote_code);')
sql_lines.append('CREATE INDEX IF NOT EXISTS idx_quote_reactions_session ON quote_reactions(session_id);')

output = '\n'.join(sql_lines)
print(f'SQL length: {len(output)} chars')

# Write to file
os.makedirs('backend/migrations', exist_ok=True)
with open('backend/migrations/002_quotes.sql', 'w', encoding='utf-8') as f:
    f.write(output)
print('Written to backend/migrations/002_quotes.sql')
