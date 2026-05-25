import urllib.request
import json

encrypted_key = 'amR6dlJrYXY0UlhXSm8zbnZUb1B0cGhMM0pjWVpxKzU1RGlMTzN4SG5wTkEwdE5IUERiT2lUTkFPSSs5ZjNjRQ=='

# 1. Fetch user property details
roster_url = f"https://rosters.homelane.com/apis/general/fetchUserPropertyDetails?key={encrypted_key}&isProCust=1"
req1 = urllib.request.Request(roster_url, headers={'User-Agent': 'Mozilla/5.0'})

try:
    with urllib.request.urlopen(req1) as resp1:
        data1 = json.loads(resp1.read().decode('utf-8'))
        print("Property Details:")
        print(json.dumps(data1, indent=2)[:1000]) # Print first 1000 chars
        
        project_id = data1.get('project_id')
        print("\nProject ID:", project_id)
        
        if project_id:
            # 2. Fetch detailed quote
            sc_url = f"https://sc-backend-production.homelane.com/api/v1.0/detailedQuote/{project_id}"
            headers2 = {
                'User-Agent': 'Mozilla/5.0',
                'Authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJyb2xlIjoiUk9MRV9ST1NURVIiLCJvcGVuIjp0cnVlLCJ1c2VybmFtZSI6InJvc3Rlci1zZXJ2aWNlIiwic3ViIjoicm9zdGVyLXNlcnZpY2UiLCJpYXQiOjE3MDIwMzcyMzcsImV4cCI6MTg1OTcxNzIzN30.X7HhD-eIEvGu2yxRD724a1ivzfYklifFj3L_TsCVgMYHrldpUrEmWTcpDoYGTY5GHQ2bjEUEipIvY5uRin6WMQ'
            }
            req2 = urllib.request.Request(sc_url, headers=headers2)
            with urllib.request.urlopen(req2) as resp2:
                data2 = json.loads(resp2.read().decode('utf-8'))
                print("\nDetailed Quote structure keys:")
                print(list(data2.keys()))
                
                with open('detailed_quote.json', 'w', encoding='utf-8') as f:
                    json.dump(data2, f, indent=2)
                print("\nSaved detailed quote to detailed_quote.json")
except Exception as e:
    print("Error:", e)
