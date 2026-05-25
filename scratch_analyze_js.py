import urllib.request
import re

js_files = [
    "https://ux-designs.homelane.com/_next/static/chunks/pages/quotes/quotes_v2-cd04b6aea6f92769e124.js",
    "https://ux-designs.homelane.com/_next/static/chunks/pages/_app-dfe8a99b7e29092379fa.js",
    "https://ux-designs.homelane.com/_next/static/chunks/main-5b9c9153beb7a96c5ee4.js",
    "https://ux-designs.homelane.com/_next/static/chunks/76437-eca54bdf4fea6f069bc0.js",
    "https://ux-designs.homelane.com/_next/static/chunks/8541-ae9e7aeee699c5f445cc.js"
]

for url in js_files:
    print(f"Downloading {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            print(f"Length: {len(content)}")
            # Let's search for keywords
            for keyword in ["encryptedKey", "sc-quotes-share", "getQuote", "quoteDetail", "api/v", "sales-channels", "quotes/share"]:
                matches = [m.start() for m in re.finditer(keyword, content, re.IGNORECASE)]
                if matches:
                    print(f"  Found '{keyword}' {len(matches)} times. Positions: {matches[:5]}")
                    for idx in matches[:2]:
                        start = max(0, idx - 150)
                        end = min(len(content), idx + 150)
                        print(f"    Snippet: ...{content[start:end]}...")
    except Exception as e:
        print("  Error:", e)
