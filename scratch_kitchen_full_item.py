import json

with open('detailed_quote.json', 'r') as f:
    data = json.load(f)

rooms = data.get('projectSummary', {}).get('rooms', [])
kitchens = [r for r in rooms if 'kitchen' in r.get('roomName', '').lower() or 'kitchen' in r.get('roomType', '').lower()]

for r in kitchens:
    ff = r.get('fittedFurniture', {})
    ff_items = ff.get('data', [])
    if ff_items:
        print(json.dumps(ff_items[0], indent=2))
        break
