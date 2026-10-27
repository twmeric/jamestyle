# -*- coding: utf-8 -*-
"""JameStyle D1 全表備份（reset 前搶救）。2026-10-26"""
import subprocess, json, io

tables = ['visitor_sessions', 'visitor_events', 'reactions', 'device_metrics',
          'card_shares', 'whatsapp_leads', 'quote_reactions', 'subscribers', 'settings']
out = []
for t in tables:
    r = subprocess.run(
        f'npx wrangler d1 execute jamestyle-db --remote --command "SELECT * FROM {t}" --config wrangler.toml --json',
        capture_output=True, text=True, timeout=180, shell=True)
    raw = r.stdout
    start = raw.find('[')
    if start < 0:
        out.append({'table': t, 'error': raw[:200]})
        continue
    rows = json.loads(raw[start:])[0]['results']
    out.append({'table': t, 'count': len(rows), 'rows': rows})
    print(t, len(rows))

io.open('../backups/jamestyle-db-backup-20261026.ndjson', 'w', encoding='utf-8', newline='\n').write(
    '\n'.join(json.dumps(x, ensure_ascii=False) for x in out))
print('backup written')
