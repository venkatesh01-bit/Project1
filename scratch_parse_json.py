import json

with open('detailed_quote.json', 'r') as f:
    data = json.load(f)

print("Top-level keys:", list(data.keys()))
print("Project Summary structure:")
if 'projectSummary' in data:
    ps = data['projectSummary']
    print("  Type of projectSummary:", type(ps))
    if isinstance(ps, dict):
        print("  Keys:", list(ps.keys()))
        for k in ['totalPrice', 'netPrice', 'discountAmount', 'roomPriceBreakup']:
            if k in ps:
                print(f"  {k}:", ps[k])
    elif isinstance(ps, list) and len(ps) > 0:
        print("  First element keys:", list(ps[0].keys()))

print("\nCategory Breakup keys:")
if 'categoryBreakup' in data:
    cb = data['categoryBreakup']
    print("  Type:", type(cb))
    if isinstance(cb, dict):
        print("  Keys:", list(cb.keys()))
    elif isinstance(cb, list) and len(cb) > 0:
        print("  First item:", cb[0])

print("\nRoom-wise summary if present:")
if 'projectSummary' in data and isinstance(data['projectSummary'], dict):
    rpb = data['projectSummary'].get('roomPriceBreakup', {})
    print("  Rooms in roomPriceBreakup:", list(rpb.keys()))
    for rname, rdata in list(rpb.items())[:2]:
        print(f"  Room '{rname}' keys:", list(rdata.keys()))
        print(f"  Room '{rname}' sample data:", json.dumps(rdata, indent=2)[:500])
