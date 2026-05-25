import urllib.request
import re

url = "https://ux-designs.homelane.com/_next/static/chunks/pages/quotes/quotes_v2-cd04b6aea6f92769e124.js"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        print(f"File downloaded. Length: {len(content)}")
        
        # Search for fetchUserPropertyDetails
        matches = [m.start() for m in re.finditer("fetchUserPropertyDetails", content)]
        for i, idx in enumerate(matches):
            start = max(0, idx - 200)
            end = min(len(content), idx + 800)
            print(f"\n--- Match {i+1} at {idx} ---")
            print(content[start:end])
            
        # Search for detailedQuote
        matches2 = [m.start() for m in re.finditer("detailedQuote", content)]
        for i, idx in enumerate(matches2):
            start = max(0, idx - 200)
            end = min(len(content), idx + 800)
            print(f"\n--- detailedQuote Match {i+1} at {idx} ---")
            print(content[start:end])

except Exception as e:
    print("Error:", e)
