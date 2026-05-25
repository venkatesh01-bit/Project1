import json

with open('detailed_quote.json', 'r') as f:
    data = json.load(f)

rooms = data.get('projectSummary', {}).get('rooms', [])
kitchens = [r for r in rooms if 'kitchen' in r.get('roomName', '').lower() or 'kitchen' in r.get('roomType', '').lower()]

for r in kitchens:
    ff = r.get('fittedFurniture', {})
    ff_items = ff.get('data', [])
    for idx, item in enumerate(ff_items):
        print(f"\nItem {idx+1}: {item.get('name')}")
        sub_cats = item.get('subCategories', [])
        print(f"  SubCategories count: {len(sub_cats)}")
        for sc in sub_cats:
            print(f"    - SubCategory Name: {sc.get('name')} | Price: {sc.get('price')}")
            items = sc.get('items', [])
            print(f"      Items count: {len(items)}")
            if items:
                print(f"      First item: {json.dumps(items[0], indent=2)[:800]}")
