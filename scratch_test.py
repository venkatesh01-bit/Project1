import urllib.request
import urllib.parse

url = 'https://www.homelane.com/sc-quotes-share/amR6dlJrYXY0UlhXSm8zbnZUb1B0cGhMM0pjWVpxKzU1RGlMTzN4SG5wTkEwdE5IUERiT2lUTkFPSSs5ZjNjRQ==?room=Kitchen'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print(f"Status: {response.status}")
        print(f"HTML Length: {len(html)}")
        with open('homelane_response.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Saved HTML to homelane_response.html")
except Exception as e:
    print("Error:", e)
