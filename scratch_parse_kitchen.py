import json

with open('detailed_quote.json', 'r') as f:
    data = json.load(f)

rooms = data.get('projectSummary', {}).get('rooms', [])
kitchens = [r for r in rooms if 'kitchen' in r.get('roomName', '').lower() or 'kitchen' in r.get('roomType', '').lower()]

print(f"Kitchen rooms found: {len(kitchens)}")
for r in kitchens:
    print(f"Room: {r.get('roomName')} ({r.get('roomType')}) - Price: {r.get('price')}")
    ff = r.get('fittedFurniture', {})
    ff_items = ff.get('data', [])
    for idx, item in enumerate(ff_items):
        print(f"  Fitted Furniture {idx+1}: {item.get('name')} - {item.get('price')}")
        for sub in item.get('items', []):
            prod = sub.get('product', {})
            print(f"    - SubItem: {sub.get('name')} | Qty: {sub.get('quantity')} | Price: {sub.get('price')}")
            print(f"      Dims: L {sub.get('length')} D {sub.get('width')} H {sub.get('height')}")
            print(f"      Description: {prod.get('description')}")
            print(f"      Specification: {prod.get('specification')}")
