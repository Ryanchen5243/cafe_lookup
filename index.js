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

function displayCafeData() {
  if (!api_data) return;
  //
  // result panel
  // Starbucks
  // **** 4.1 (312 reviews)  ->>>>> Score
  // ! East Village $$ Open until...
  //
  // ----------------------------------------------------
  // display_name,location,next_open_close,
  // p_address,p_type,phone_no,place_id,price_level,
  // price_range,r_hours, rating, rating_count,
  // review_summary,study_confidence

  // -----------------------------------------------------
  // |          Café Name                               |
  // |       Tomorrow 12:00 PM                          |
  // -----------------------------------------------------
  // | Left Column:                                  | Right Column:
  // -----------------------------------------------------|--------------------------------------------------
  // | Address: 123 Coffee St, City                   | Rating: 4.5 ⭐
  // | Phone: (123) 456-7890                          | (150 Reviews)
  // | Price Level: $$                                | "Great coffee, friendly staff!"
  // | Price Range: $10 - $30                         | Confidence: [ O O O O O ] 85%
  // | Opening Hours:                                 |
  // |   Mon-Fri: 7:00 AM - 8:00 PM                   |
  // |   Sat-Sun: 8:00 AM - 6:00 PM                   |
  // -----------------------------------------------------|--------------------------------------------------

  let bounds = L.latLngBounds([]);
  const curr_time = new Date();
  api_data["results"].forEach((element) => {
    const cafe_el = document.createElement("div");
    cafe_el.classList.add("cafe_result");
    const location = Object.fromEntries(element["location"]);
    const marker = L.marker([location.lat, location.long]).addTo(map);

    const popup_el = document.createElement("div");
    popup_el.classList.add("popup-content");
    const popup_el_c1 = document.createElement("h3");
    popup_el_c1.classList.add("popup-title");
    popup_el_c1.textContent = `${element["display_name"]}`;
    const popup_el_c2 = document.createElement("button");
    popup_el_c2.classList.add("view-details-btn");
    popup_el_c2.textContent = "View Details";
    popup_el_c2.onclick = () => {
      showModal(element);
    };
    popup_el.appendChild(popup_el_c1);
    popup_el.appendChild(popup_el_c2);
    marker.bindPopup(popup_el);
    cafe_el.onclick = () => {
      map.flyTo([location.lat, location.long], 20);
      marker.openPopup();
    };

    const price_level_mapping = {
      PRICE_LEVEL_UNSPECIFIED: "Price Not specified",
      PRICE_LEVEL_FREE: "Free",
      PRICE_LEVEL_INEXPENSIVE: "$",
      PRICE_LEVEL_MODERATE: "$$",
      PRICE_LEVEL_EXPENSIVE: "$$$",
      PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
    };

    const child_1 = document.createElement("div");
    child_1.textContent = element["display_name"];
    child_1.classList.add("cafe_display_name");
    const child_2 = document.createElement("div");
    child_2.classList.add("cafe_result_rating");
    const child_2_1 = document.createElement("div");
    child_2_1.classList.add("cafe_result_stars");
    for (let i = 0; i < 5; i++) {
      const star = document.createElement("span");
      star.classList.add("fa");
      star.classList.add("fa-star");
      child_2_1.appendChild(star);
    }
    const child_2_2 = document.createElement("div");
    child_2_2.textContent = `${element["rating"]} (${element["rating_count"]} reviews)`;
    child_2.appendChild(child_2_1);
    child_2.appendChild(child_2_2);
    const child_3 = document.createElement("div");
    child_3.classList.add("cafe_result_location_price_detail");
    const icon_container = document.createElement("div");
    icon_container.id = "icon-container";
    const icon = document.createElement("i");
    icon.classList.add("fa-solid", "fa-location-dot");
    icon_container.appendChild(icon);
    const price_level_el = document.createElement("div");
    price_level_el.textContent = `${element["p_address"]["locality"]} ${
      element["price_level"] === null
        ? ""
        : price_level_mapping[element["price_level"]]
    } ${isOpenNow(curr_time, Object.fromEntries(element["r_hours"]))}`;
    child_3.appendChild(icon_container);
    child_3.appendChild(price_level_el);
    cafe_el.appendChild(child_1);
    cafe_el.appendChild(child_2);
    cafe_el.appendChild(child_3);
    document.getElementById("info-panel").appendChild(cafe_el);
    // `Study Confidence: ${(element["study_confidence"] * 100).toFixed(0)}%`;
    bounds.extend([location.lat, location.long]);
  });
  map.fitBounds(bounds);
  api_data = null;
}

function isOpenNow(now, r_hours) {
  const store_hours_today =
    r_hours[now.toLocaleDateString("en-US", { weekday: "long" })];
  // check for nullity
  if (!store_hours_today || store_hours_today?.some?.((v) => v === null))
    return "";
  const today_open = new Date(Date.now());
  today_open.setHours(Number(store_hours_today[0].split(":")[0]));
  today_open.setMinutes(Number(store_hours_today[0].split(":")[1]));
  const today_close = new Date(Date.now());
  today_close.setHours(Number(store_hours_today[1].split(":")[0]));
  today_close.setMinutes(Number(store_hours_today[1].split(":")[1]));
  if (today_open <= now && now <= today_close) {
    return `Open until ${String(today_close.getHours()).padStart(
      2,
      "0"
    )}:${String(today_close.getMinutes()).padStart(2, "0")}`;
  }
  return "Closed";
}
function showModal(cafe) {
  const modal = document.getElementById("detail-modal");
  const body = document.getElementById("modal-body");
  // ,next_open_close,
  const place_name = document.createElement("h1");
  place_name.textContent = `${cafe["display_name"]}`;
  place_name.id = "modal-item-display-name";
  const modal_body_container = document.createElement("div");
  modal_body_container.classList.add("modal-body-bottom-container");
  const modal_body_container_el_1 = document.createElement("div");
  const modal_body_container_el_2 = document.createElement("div");
  const addr_el = document.createElement("div");
  addr_el.id = "modal-item-addr-line";
  const addr_el_1 = document.createElement("i");
  addr_el_1.classList.add("fa-solid", "fa-location-dot");
  const addr_el_2 = document.createElement("p");
  addr_el_2.textContent = `${cafe?.p_address?.addressLines || ""}, ${
    cafe?.p_address?.administrativeArea || ""
  }`;
  addr_el.append(addr_el_1, addr_el_2);
  modal_body_container_el_1.append(addr_el);
  const phone_no_el = document.createElement("div");
  phone_no_el.id = "modal-item-phone-line";
  const phone_no_el_1 = document.createElement("i");
  phone_no_el_1.classList.add("fa-solid", "fa-phone");
  const phone_no_el_2 = document.createElement("p");
  phone_no_el_2.textContent = `${cafe?.phone_no || ""}`;
  phone_no_el.append(phone_no_el_1, phone_no_el_2);
  modal_body_container_el_1.append(phone_no_el);
  // const price_level_el = document.createElement("p");
  // price_level_el.textContent = ""; // `${cafe?.price_level || ""}`;
  const price_range_el = document.createElement("div");
  price_range_el.id = "modal-item-price-line";
  const price_range_el_1 = document.createElement("i");
  price_range_el_1.classList.add("fa-solid", "fa-dollar-sign");
  const price_range_el_2 = document.createElement("p");
  if (Array.isArray(cafe?.price_range) && cafe.price_range.length == 2) {
    price_range_el_2.textContent = `${cafe.price_range[0]} - ${cafe.price_range[1]}`;
    price_range_el.append(price_range_el_1, price_range_el_2);
    modal_body_container_el_1.append(price_range_el);
  }
  const daysMap = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };
  if (cafe?.r_hours != null) {
    const hours_dropdown = document.createElement("div");
    hours_dropdown.classList.add("modal-item-hours-dropdown");
    const hours_button = document.createElement("button");
    hours_button.classList.add("modal-item-hours-toggle");
    hours_button.textContent = "Opening Hours ▾";
    const hours_list = document.createElement("div");
    hours_list.classList.add("modal-item-hours-list");
    hours_dropdown.append(hours_button, hours_list);
    cafe.r_hours.forEach((e) => {
      const e_i = document.createElement("p");
      e_i.textContent = `${daysMap[e[0]]}: ${e[1][0]} - ${e[1][1]}`;
      hours_list.appendChild(e_i);
    });
    hours_dropdown.addEventListener("click", () => {
      if (hours_list.style.maxHeight && hours_list.style.maxHeight !== "0px") {
        hours_list.style.maxHeight = "0";
        hours_button.textContent = "Opening Hours ▾";
      } else {
        hours_list.style.maxHeight = hours_list.scrollHeight + "px";
        hours_button.textContent = "Opening Hours ▴";
      }
    })
    modal_body_container_el_1.append(hours_dropdown);
  }
  // ------------------------------------------------------------------------
  const rating_el = document.createElement("p");
  if (cafe?.rating == null || cafe?.rating_count == null) {
    rating_el.textContent = "";
  } else {
    rating_el.textContent = `${cafe.rating} (${cafe.rating_count} reviews)`;
  }
  const review_summary_el = document.createElement("p");
  review_summary_el.textContent = `${cafe?.review_summary?.text?.text || ""}`;
  const confidence_el = `Confidence -> ${cafe["study_confidence"]}`;
  modal_body_container_el_2.append(rating_el, review_summary_el, confidence_el);
  modal_body_container_el_1.classList.add("modal-body-con-left");
  modal_body_container_el_2.classList.add("modal-body-con-right");
  modal_body_container.appendChild(modal_body_container_el_1);
  modal_body_container.appendChild(modal_body_container_el_2);
  body.appendChild(place_name);
  body.appendChild(modal_body_container);
  modal.style.display = "block";
}
document.getElementById("modal-close").onclick = () => {
  document.getElementById("detail-modal").style.display = "none";
  document.getElementById("modal-body").innerHTML = "";
};

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
      "\n",
      Date.now() - s,
      "\n",
      (Date.now() - s) / 1000,
      " seconds"
    );
    api_data = data;
    displayCafeData();
  } catch (err) {
    console.error(err);
  }
});
