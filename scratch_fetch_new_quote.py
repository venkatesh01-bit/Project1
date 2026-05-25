import urllib.request
import json

project_id = 'c57e1608-3d0e-49fa-8d79-bb3c58eca9cf'

sc_url = f"https://sc-backend-production.homelane.com/api/v1.0/detailedQuote/{project_id}"
headers = {
    'User-Agent': 'Mozilla/5.0',
    'Authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJyb2xlIjoiUk9MRV9ST1NURVIiLCJvcGVuIjp0cnVlLCJ1c2VybmFtZSI6InJvc3Rlci1zZXJ2aWNlIiwic3ViIjoicm9zdGVyLXNlcnZpY2UiLCJpYXQiOjE3MDIwMzcyMzcsImV4cCI6MTg1OTcxNzIzN30.X7HhD-eIEvGu2yxRD724a1ivzfYklifFj3L_TsCVgMYHrldpUrEmWTcpDoYGTY5GHQ2bjEUEipIvY5uRin6WMQ'
}

req = urllib.request.Request(sc_url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Total Price:", data.get('projectSummary', {}).get('total'))
        print("SubTotal:", data.get('projectSummary', {}).get('subTotal'))
        print("Discount:", data.get('projectSummary', {}).get('discount'))
        print("Name:", data.get('name'))
        with open('new_quote.json', 'w') as f:
            json.dump(data, f, indent=2)
        print("Saved detailed quote info to new_quote.json")
except Exception as e:
    print("Error:", e)
