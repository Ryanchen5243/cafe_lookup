function showMainPage(toShow){
    const main_page = document.getElementById("main-page");
    const res_page = document.getElementById("res-page");
    if (!main_page || !res_page) return;
    main_page.style.display = toShow ? "block" : "none";
    if (toShow){
        res_page.classList.remove("show");
    } else {
        res_page.classList.add("show");
    }
}
let map = null;
function showMap() {
    if (document.getElementById("map").style.display == "none") return;
    if (!map){
        map = L.map('map').setView([40.7127,-74.0059],1);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution:
                '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> & <a href="https://carto.com">Carto</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);
        var manhattanBounds = [ [40.698, -74.029],[40.877, -73.899] ];
        map.fitBounds(manhattanBounds, {minZoom: 16});
        map.setMinZoom(map.getZoom());
    }
}

async function init_script() {
    // event listeners
    await google.maps.importLibrary("places");
    const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
    document.getElementById("autocomplete").appendChild(placeAutocomplete);
    placeAutocomplete.addEventListener("gmp-select",async ({placePrediction})=>{
        const place = placePrediction.toPlace();
        await place.fetchFields({ fields: ['id','displayName', 'formattedAddress', 'location'] });
        selectedPlace = place.id;
    })
}
init_script();

let selectedPlace = null;
document.getElementById('fetchBtn').addEventListener("click", async () => {
    if (!selectedPlace) {
        return;
    }
    showMainPage(false);
    showMap();
    const params = new URLSearchParams({ place_id: selectedPlace });
    try {
        console.log("sending request to lambda.....")
        const s = Date.now();
        const response = await fetch(`https://6xraxq80be.execute-api.us-east-1.amazonaws.com/getNearbyCafes?${params}`);
        const data = await response.json();
        console.log("lambda response took..... ",(Date.now()-s)/1000," seconds")
        console.log(data);
    } catch (err){
        console.error(err);
    }
})