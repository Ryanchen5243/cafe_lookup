import json
import re
from urllib.request import urlopen,Request
import os
from ReviewClassifier import ReviewClassifier
import numpy as np

def lambda_handler(event, context):
    ALLOWED_ORIGINS = ["http://127.0.0.1:8080","http://localhost:8080","https://foobrix.com"]
    method = event.get("requestContext",{}).get("http",{}).get("method","")
    origin = event.get("headers",{}).get("origin","")
    cors_headers = {}
    if origin in ALLOWED_ORIGINS:
        cors_headers = {
            "Access-Control-Allow-Origin" : origin,
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,X-Goog-Api-Key,X-Goog-FieldMask"
        }
    # preflight request
    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": cors_headers,
            "body": ""
        }
    if method != "GET":
        return{
            "statusCode": 405,
            "body": "Method Not Allowed"
        }
    
    # handle get request...


    print("start testing lambda ...")
    # fetch location detail from user requested place
    place_detail_request = Request(f"https://places.googleapis.com/v1/places/{event['queryStringParameters']['place_id']}")
    place_detail_request.add_header('Content-Type','application/json')
    place_detail_request.add_header('X-Goog-Api-Key', os.environ['GMAPS_API_KEY_BACKEND'])
    place_detail_request.add_header('X-Goog-FieldMask', 'id,displayName,location')
    req_lat,req_lon = None,None
    print("making request to google places api....")
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
        search_nearby_request.add_header('X-Goog-FieldMask', 'places.id,places.displayName,places.primaryType,places.types,places.rating,places.reviews,places.reviewSummary,places.userRatingCount,places.dineIn,places.location,places.regularOpeningHours,places.currentOpeningHours,places.priceLevel,places.priceRange')
        print("making request to nearby search....")
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
    place_id_set = set()
    unique_places = []
    for p in raw_list:
        if p["place_id"] in place_id_set:
            continue
        unique_places.append(p)
        place_id_set.add(p["place_id"])
    raw_list = unique_places
    # display api results
    print(f'Total of {len(raw_list)} places returned from api')
    print("preprocessing places hours....")
    for p in raw_list:
        r_hours = []
        if p['weekly_hours']:
            for entry in p['weekly_hours']['weekdayDescriptions']:
                cleaned = re.sub('\u202f\u2009','',entry)
                day,hours = cleaned.split(':',1)
                open,close = None,None
                if '24 hours' in hours.lower():
                    open,close = "00:00","00:00"
                elif 'closed' in hours.lower():
                    pass
                elif ':' in hours:
                    matches = re.findall('\d{1,2}:\d{2}',hours)
                    if re.findall(r'^\d{1}:\d{2}',matches[0]):
                        open = re.sub(r'^(\d{1}):(\d{2})',r'0\1:\2',matches[0])
                    else:
                        open = matches[0]
                    h,m = matches[1].split(":")
                    close = f'{int(h)+12}:{m}'
                r_hours.append([day,[open,close]])
        p['r_hours'] = r_hours
    print("computing scores .... ")
    t_list = compute_scores(raw_list,clf=ReviewClassifier())
    print("done computing scorse...")
    sorted_t_list = sorted(t_list, key=lambda e: e['study_confidence'], reverse=True)
    k = 20
    result = list(map(lambda e : {'place_id': e['place_id'],
                                  'display_name' : e['display_name'],
                                  'p_type' : e['p_type'],
                                  'rating' : e['rating'],
                                  'rating_count' : e['rating_count'],
                                  'location' : e['location'],
                                  'price_level' : e['price_level'],
                                  'price_range' : e['price_range'],
                                  'r_hours' : e['r_hours'],
                                  'study_confidence' : float(e['study_confidence'])},sorted_t_list[:k]))
    print(f"sortedtlist -> {len(sorted_t_list)} ; result -> {len(result)}")
    print("end lambda testing........")
    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({"results": result})
    }

def compute_scores(raw_data,clf) -> list:
    for place in raw_data:
        review_scores = []
        for review in place['reviews_list']:
            sentence_list = []
            for s in re.split(r'[.!?]+', str(review[1]), maxsplit=0):
                s = re.sub(r'\n',' ',s).strip()
                if s:
                    sentence_list.append(s)
            '''
            heuristic scoring algorithm
                let A0,A1,A2 <- study friendly, not study friendly, insufficient evidence
                posterior <- [A0, A1, A2] with A_i representing ndarray of probabilities
                    with A_i_j representing P(s_j=i) for s_j in input S = [s1,s2,....sk]
                    where S are the sentences that make up the review
            '''
            posterior = clf.predict(sentence_list)
            A0_max,A1_max,A2_mean = np.max(posterior[:,0]), np.max(posterior[:,1]),np.mean(posterior[:,2])
            study_score = A0_max * (1 - A1_max)
            review_scores.append(study_score)
        place['study_confidence'] = np.max(review_scores)
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