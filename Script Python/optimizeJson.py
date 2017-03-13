import json

with open('airportsLight.json') as json_data:
    data = json.load(json_data)
    new_data = [{"code": element["code"], "name" : element["name"], "city": element["city"], "country": element["country"]} for element in data]
    
with open('data.txt', 'w') as outfile:
    json.dump(new_data, outfile)
    
    