import json

with open('detailed_quote.json', 'r') as f:
    data = json.load(f)

ps = data.get('projectSummary', {})
print("ProjectSummary subtotal:", ps.get('subTotal'))
print("ProjectSummary total:", ps.get('total'))
print("ProjectSummary rooms count:", len(ps.get('rooms', [])))

rooms = ps.get('rooms', [])
if rooms:
    print("\nFirst room summary:")
    first_room = rooms[0]
    print("Keys in room:", list(first_room.keys()))
    print("Room data (truncated):", json.dumps(first_room, indent=2)[:2000])

if 'homelaneProducts' in ps:
    print("\nhomelaneProducts count:", len(ps['homelaneProducts']))
    if ps['homelaneProducts']:
        print("First homelaneProduct sample:", json.dumps(ps['homelaneProducts'][0], indent=2)[:1000])

if 'thirdPartyProducts' in ps:
    print("\nthirdPartyProducts count:", len(ps['thirdPartyProducts']))
    if ps['thirdPartyProducts']:
        print("First thirdPartyProduct sample:", json.dumps(ps['thirdPartyProducts'][0], indent=2)[:1000])
