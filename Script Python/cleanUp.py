import json

with open('airportsDatacopie.json') as json_data:
    data = json.load(json_data)
    res = [airport for airport in data.values()]
    for airport in data.values():
        jsonEntry = json.loads(json.dumps(airport))

with open('data.json', 'w') as f:
    json.dump(res, f)
    
