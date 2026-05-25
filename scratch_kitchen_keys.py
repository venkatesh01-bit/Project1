import json

with open('detailed_quote.json', 'r') as f:
    data = json.load(f)

rooms = data.get('projectSummary', {}).get('rooms', [])
kitchens = [r for r in rooms if 'kitchen' in r.get('roomName', '').lower() or 'kitchen' in r.get('roomType', '').lower()]

for r in kitchens:
    ff = r.get('fittedFurniture', {})
    ff_items = ff.get('data', [])
    for idx, item in enumerate(ff_items):
        print(f"Item {idx+1}: {item.get('name')}")
        print("  Keys:", list(item.keys()))
        # Print sub-items
        sub_items = item.get('items', [])
        print("  Sub-items count:", len(sub_items))
        if sub_items:
            print("  First sub-item keys:", list(sub_items[0].keys()))
            print("  First sub-item sample:", json.dumps(sub_items[0], indent=2)[:500])
