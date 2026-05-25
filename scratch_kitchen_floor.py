import json

with open('detailed_quote.json', 'r') as f:
    data = json.load(f)

rooms = data.get('projectSummary', {}).get('rooms', [])
kitchens = [r for r in rooms if 'kitchen' in r.get('roomName', '').lower() or 'kitchen' in r.get('roomType', '').lower()]

for r in kitchens:
    ff = r.get('fittedFurniture', {})
    ff_items = ff.get('data', [])
    for item in ff_items:
        if item.get('name') == 'Floor Standing':
            print(f"Floor Standing total price: {item.get('price')}")
            for sub in item.get('items', []):
                prod = sub.get('product', {})
                print(f"  - SubItem: {sub.get('name')} | Qty: {sub.get('quantity')} | Price: {sub.get('price')}")
                print(f"    Dims: L: {sub.get('length')} D: {sub.get('width')} H: {sub.get('height')}")
                print(f"    Desc: {prod.get('description')}")
                print(f"    Spec: {prod.get('specification')}")
