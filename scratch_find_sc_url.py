import urllib.request
import re

js_files = [
    "https://ux-designs.homelane.com/_next/static/chunks/pages/quotes/quotes_v2-cd04b6aea6f92769e124.js",
    "https://ux-designs.homelane.com/_next/static/chunks/pages/_app-dfe8a99b7e29092379fa.js"
]

for url in js_files:
    print(f"Downloading {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            matches = [m.start() for m in re.finditer("SC_URL", content)]
            for idx in matches:
                start = max(0, idx - 150)
                end = min(len(content), idx + 150)
                print(f"  Snippet at {idx}: ...{content[start:end]}...")
    except Exception as e:
        print("  Error:", e)
