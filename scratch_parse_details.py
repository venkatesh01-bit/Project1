import json

with open('detailed_quote.json', 'r') as f:
    data = json.load(f)

rooms = data.get('projectSummary', {}).get('rooms', [])

print(f"Total Rooms: {len(rooms)}")
for r in rooms:
    room_name = r.get('roomName')
    room_type = r.get('roomType')
    price = r.get('price')
    print(f"\n================ Room: {room_name} ({room_type}) - Price: {price} ================")
    
    # Check fittedFurniture
    ff = r.get('fittedFurniture', {})
    ff_items = ff.get('data', [])
    if ff_items:
        print(f"  Fitted Furniture ({len(ff_items)} items):")
        for idx, item in enumerate(ff_items):
            print(f"    {idx+1}. Name: {item.get('name')} | SKU: {item.get('sku')} | Price: {item.get('price')}")
            # print items inside it
            subitems = item.get('items', [])
            for sub in subitems:
                print(f"       - SubItem: {sub.get('name')} (Qty: {sub.get('quantity')}) | Price: {sub.get('price')}")
                desc = sub.get('product', {}).get('description', '')
                spec = sub.get('product', {}).get('specification', '')
                prod_name = sub.get('product', {}).get('name', '')
                uom = sub.get('product', {}).get('uom', '')
                dims = f"L: {sub.get('length')} D: {sub.get('width')} H: {sub.get('height')}"
                print(f"         Dims: {dims} | Description: {desc[:100]}... | Spec: {spec[:100]}...")
                
    # Check services
    services = r.get('services', {})
    srv_items = services.get('data', [])
    if srv_items:
        print(f"  Services ({len(srv_items)} items):")
        for idx, item in enumerate(srv_items):
            print(f"    {idx+1}. Name: {item.get('name')} | Price: {item.get('price')}")
            for sub in item.get('items', []):
                print(f"       - SubItem: {sub.get('name')} (Qty: {sub.get('quantity')}) | Price: {sub.get('price')}")
                desc = sub.get('product', {}).get('description', '')
                dims = f"L: {sub.get('length')} D: {sub.get('width')} H: {sub.get('height')}"
                print(f"         Dims: {dims} | Description: {desc[:100]}...")

    # Check appliances
    appliances = r.get('appliances', {})
    app_items = appliances.get('data', [])
    if app_items:
        print(f"  Appliances ({len(app_items)} items):")
        for idx, item in enumerate(app_items):
            print(f"    {idx+1}. Name: {item.get('name')} | Price: {item.get('price')}")

    # Check looseFurniture
    loose = r.get('looseFurniture', {})
    loose_items = loose.get('data', [])
    if loose_items:
        print(f"  Loose Furniture ({len(loose_items)} items):")
        for idx, item in enumerate(loose_items):
            print(f"    {idx+1}. Name: {item.get('name')} | Price: {item.get('price')}")
