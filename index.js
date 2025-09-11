let map = null;
let api_data = null;
function showMainPage(toShow) {
  const main_page = document.getElementById("main-page");
  const res_page = document.getElementById("res-page");
  if (!main_page || !res_page) return;
  main_page.style.display = toShow ? "block" : "none";
  if (toShow) {
    res_page.classList.remove("show");
  } else {
    res_page.classList.add("show");
    if (!map) {
      map = L.map("map").setView([40.7127, -74.0059], 1);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> & <a href="https://carto.com">Carto</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);
      var manhattanBounds = [
        [40.698, -74.029],
        [40.877, -73.899],
      ];
      map.fitBounds(manhattanBounds, { minZoom: 16 });
      map.setMinZoom(map.getZoom());
    }
  }
}

function displayCafeData(){
  if (!api_data) return;
  // ['place_id', 'display_name', 'p_type', 'rating', 
  //   'rating_count', 'location', 'price_level', 
  //   'price_range', 'r_hours', 'study_confidence']
  console.log(api_data);
  api_data["results"].forEach(element => {
    const cafe_el = document.createElement("div");
    cafe_el.classList.add("cafe_result");
    const location = Object.fromEntries(element["location"]);
    L.marker([location["lat"], location["long"]]).addTo(map);
    cafe_el.onclick = () => {
      map.flyTo([location["lat"], location["long"]],20)
    }

    const child_1 = document.createElement("span");
    child_1.textContent = element["display_name"]
    child_1.classList.add("cafe_display_name");
    const child_2 = document.createElement("span");
    child_2.textContent = `Study Confidence: ${(element["study_confidence"] * 100).toFixed(0)}%`;
    cafe_el.appendChild(child_1);
    cafe_el.appendChild(child_2);
    document.getElementById("info-panel").appendChild(cafe_el);
  });
  api_data = null; // reset
}

async function init_script() {
  await google.maps.importLibrary("places");
  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
  document.getElementById("autocomplete").appendChild(placeAutocomplete);
  placeAutocomplete.addEventListener(
    "gmp-select",
    async ({ placePrediction }) => {
      const place = placePrediction.toPlace();
      await place.fetchFields({
        fields: ["id", "displayName", "formattedAddress", "location"],
      });
      selectedPlace = place.id;
    }
  );
}
init_script();

let selectedPlace = null;
document.getElementById("fetchBtn").addEventListener("click", async () => {
  if (!selectedPlace) {
    return;
  }
  showMainPage(false);
  const params = new URLSearchParams({ place_id: selectedPlace });
  try {
    console.log("sending request to lambda.....");
    const s = Date.now();
    const response = await fetch(
      `https://6xraxq80be.execute-api.us-east-1.amazonaws.com/getNearbyCafes?${params}`
    );
    const data = await response.json();
    console.log(
      "lambda response took..... ",
      (Date.now() - s) / 1000,
      " seconds"
    );
    api_data = data;
    displayCafeData();
  } catch (err) {
    console.error(err);
  }
});
