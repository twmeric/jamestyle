import urllib.request, json

req = urllib.request.Request(
    'https://jamestyle-analytics.jimsbond007.workers.dev/api/public/analytics/fan-scores',
    headers={'User-Agent': 'Mozilla/5.0'}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print(json.dumps(data, ensure_ascii=False, indent=2))
