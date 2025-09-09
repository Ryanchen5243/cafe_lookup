async function init_script() {
    // leaflet map
    var map = L.map('map').setView([40.7127,-74.0059],1);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution:
            '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> & <a href="https://carto.com">Carto</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
    var manhattanBounds = [
        [40.698, -74.029],
        [40.877, -73.899]
    ];
    map.fitBounds(manhattanBounds, {minZoom: 16});
    map.setMinZoom(map.getZoom());

    // google autocomplete
    await google.maps.importLibrary("places");
    const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
    document.getElementById("autocomplete").appendChild(placeAutocomplete);
    
    let selectedPlace = null;
    placeAutocomplete.addEventListener("gmp-select",async ({placePrediction})=>{
        const place = placePrediction.toPlace();
        await place.fetchFields({ fields: ['id','displayName', 'formattedAddress', 'location'] });
        selectedPlace = place.id;
    })

    document.getElementById('fetchBtn').addEventListener("click", async () => {
        if (!selectedPlace) {
            return;
        }
        const params = new URLSearchParams();
        params.append("place_id",selectedPlace);
        try {
            console.log("sending request to lambda....")
            const s = Date.now();
            const response = await fetch(`https://6xraxq80be.execute-api.us-east-1.amazonaws.com/getNearbyCafes?${params}`);
            const res_body = await response.json();
            console.log("lambda response....toook....",(Date.now()-s)/1000,"seconds")
            console.log(res_body);
        } catch (err){
            console.log("error with fetch api",err);
        }
        
    })
}

init_script();