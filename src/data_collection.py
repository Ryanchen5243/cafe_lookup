import sys
from dotenv import load_dotenv
import os
import requests
import json
def g_maps_lambda():
    load_dotenv()
    API_KEY = os.getenv('G_MAPS_API_KEY')
    url = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.displayName'
    }
    body = {
        'includedTypes': [
            'cafe',
        ],
        'maxResultCount': 10,
        'locationRestriction': {
            'circle': {
                'center': {
                    'latitude': 40.7200,
                    'longitude': -73.999,
                },
                'radius': 500.0,
            }
        }
    }
    response = requests.post(url, headers=headers, json=body)
    if response.status_code == 200:
        print("POST Request Successful")
        res_dict = response.json()
        print(json.dumps(res_dict))
    else:
        print("Error:", response.status_code)
if __name__ == "__main__":
    g_maps_lambda()