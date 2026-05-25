import urllib.request
import json

url = 'https://www.homelane.com/sc-quotes/c57e1608-3d0e-49fa-8d79-bb3c58eca9cf'

# Check if it has a pattern or encryptedKey
# We can request it to see the HTML page structure
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        print("Status:", resp.status)
        print("HTML length:", len(html))
        # Look for __NEXT_DATA__
        import re
        m = re.search(r'<script id="__NEXT_DATA__" type="application/json">([\s\S]*?)</script>', html)
        if m:
            print("Found __NEXT_DATA__")
            parsed = json.loads(m.group(1))
            print(json.dumps(parsed, indent=2)[:2000])
        else:
            print("No __NEXT_DATA__ found")
except Exception as e:
    print("Error:", e)
