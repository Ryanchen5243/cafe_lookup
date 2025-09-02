import json
from urllib.request import urlopen,Request
import os

def lambda_handler(event, context):
    print("start testing lambda ...")
    # fetch location detail from user requested place
    place_detail_request = Request(f"https://places.googleapis.com/v1/places/{event['queryStringParameters']['place_id']}")
    place_detail_request.add_header('Content-Type','application/json')
    place_detail_request.add_header('X-Goog-Api-Key', os.environ['GMAPS_API_KEY_BACKEND'])
    place_detail_request.add_header('X-Goog-FieldMask', 'id,displayName,location')
    req_lat,req_lon = None,None
    with urlopen(place_detail_request) as response:
        res_obj = json.loads(response.read())
        req_lat,req_lon = res_obj['location']['latitude'],res_obj['location']['longitude']
    raw_list = []
    candidates = ["coffee_shop","cafe"]
    for cand in candidates:
        body = {
            'includedTypes': [],
            'excludedTypes':[],
            'includedPrimaryTypes':[cand],
            'excludedPrimaryTypes': [],
            'maxResultCount': 20,
            'locationRestriction': {
                'circle': {
                    'center': {
                        'latitude': req_lat,
                        'longitude': req_lon,
                    },
                    'radius': 500.0,
                }
            }
        }
        search_nearby_request = Request("https://places.googleapis.com/v1/places:searchNearby",\
                            data=json.dumps(body).encode('utf-8'))
        search_nearby_request.add_header('Content-Type', 'application/json')
        search_nearby_request.add_header('X-Goog-Api-Key', os.environ['GMAPS_API_KEY_BACKEND'])
        # gen_info -> location, regularOpeningHours, currentOpeningHours, priceLevel, priceRange
        search_nearby_request.add_header('X-Goog-FieldMask', 'places.id,places.displayName,places.primaryType,places.types,places.rating,places.reviews,places.reviewSummary,places.userRatingCount,places.dineIn,places.location,places.regularOpeningHours,places.currentOpeningHours,places.priceLevel,places.priceRange')
        with urlopen(search_nearby_request) as response:
            res_obj = json.loads(response.read())
            for place in res_obj['places']:
                if 'dineIn' in place and place['dineIn'] == False:
                    continue
                if 'reviews' not in place:
                    continue
                raw_list.append({
                    "place_id": place['id'],
                    "display_name": place['displayName']['text'],
                    "p_type": place['primaryType'],
                    "all_types": place['types'],
                    "rating": None if 'rating' not in place else place['rating'],
                    "rating_count": None if 'userRatingCount' not in place else place['userRatingCount'],
                    "has_dine_in": None if 'dineIn' not in place else place['dineIn'],
                    "review_summary": None if 'reviewSummary' not in place else place['reviewSummary'],
                    "reviews_list": [] if 'reviews' not in place else [(None,None) if 'text' not in r.keys() else (r['rating'],r['text']['text']) for r in place['reviews']],
                    "location": [["lat",place['location']['latitude']],["long",place['location']['longitude']]],
                    "today_hours": None if 'currentOpeningHours' not in place else place['currentOpeningHours'],
                    "weekly_hours": None if 'regularOpeningHours' not in place else place['regularOpeningHours'],
                    "price_level": None if 'priceLevel' not in place else place['priceLevel'],
                    "price_range": None if 'priceRange' not in place else [int(place['priceRange']['startPrice']['units']),int(place['priceRange']['endPrice']['units'])]
                })
    # display api results
    # print(f'Total of {len(raw_list)} places returned from api')
    '''
    for res in raw_list:
        print(">>>>>")
        print(f"{res['place_id']} - {res['p_type']} - {res['display_name']}")
        print("all_types: ",res['all_types'])
        print("rating: ",res['rating'], "total_ratings: ",res['rating_count'])
        print("location: ",res['location'])
        # print("weekly hours: ",res['weekly_hours'])
        # print("today hours: ",res['today_hours'])
        print("price level: ",res['price_level'])
        print("price range: ", res['price_range'])
        print("reviews list: ", res['reviews_list'])
        print("------------------------------------------")
    '''
    res_list = compute_study_heuristic(raw_list)
    print(res_list)

    print("end lambda testing........")
    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin":"http://127.0.0.1:8080"},
        "body": json.dumps({"msg": "foo bar says hi"})
    }

def compute_study_heuristic(raw_data):
    return raw_data

if __name__ == "__main__":
    test_event = {
        "version":"2.0",
        "routeKey":"GET /getNearbyCafes",
        "rawPath":"/getNearbyCafes",
        "rawQueryString":"place_id=ChIJYeZuBI9YwokRjMDs_IEyCwo",
        "headers":{
            "accept":"*/*",
            "accept-encoding":"gzip, deflate, br, zstd",
            "accept-language":"en-US,en;q=0.9",
            "content-length":"0",
            "host":"bpjhf33406.execute-api.us-east-2.amazonaws.com",
            "origin":"http://127.0.0.1:8080",
            "priority":"u=1, i",
            "referer":"http://127.0.0.1:8080/",
            "sec-ch-ua":"\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"",
            "sec-ch-ua-mobile":"?0",
            "sec-ch-ua-platform":"\"Windows\"",
            "sec-fetch-dest":"empty",
            "sec-fetch-mode":"cors",
            "sec-fetch-site":"cross-site",
            "user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
            "x-amzn-trace-id":"Root=1-68b49f7c-66a850073c8ac7a45f1d6490",
            "x-forwarded-for":"69.118.200.146",
            "x-forwarded-port":"443",
            "x-forwarded-proto":"https"
        },
        "queryStringParameters":{
            "place_id":"ChIJYeZuBI9YwokRjMDs_IEyCwo"
        },
        "requestContext":{
            "accountId":"640168446635",
            "apiId":"bpjhf33406",
            "domainName":"bpjhf33406.execute-api.us-east-2.amazonaws.com",
            "domainPrefix":"bpjhf33406",
            "http":{
                "method":"GET",
                "path":"/getNearbyCafes",
                "protocol":"HTTP/1.1",
                "sourceIp":"69.118.200.146",
                "userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
            },
            "requestId":"QL3bhjqIiYcEPSQ=",
            "routeKey":"GET /getNearbyCafes",
            "stage":"$default",
            "time":"31/Aug/2025:19:16:12 +0000",
            "timeEpoch":1756667772515
        },
        "isBase64Encoded":False
    }
    lambda_handler(test_event,None)