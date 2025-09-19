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
  // ----------------------------------------------------
  // display_name,location,next_open_close,
  // p_address,p_type,phone_no,place_id,price_level,
  // price_range,r_hours, rating, rating_count,
  // review_summary,study_confidence

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
    child_2.append(child_2_1, child_2_2);
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
    child_3.append(icon_container, price_level_el);
    cafe_el.append(child_1, child_2, child_3);
    document.getElementById("cafe-results-panel").appendChild(cafe_el);
    // `Study Confidence: ${(element["study_confidence"] * 100).toFixed(0)}%`;
    bounds.extend([location.lat, location.long]);
  });
  // fill the top right panel
  const summary_overview_el = document.createElement("div");
  const summary_overview_el_1 = document.createElement("h2");
  summary_overview_el_1.textContent = "Summary";
  const summary_overview_el_2 = document.createElement("p");
  const topCafeName = api_data?.results?.[0]?.display_name ?? "N/A";
  summary_overview_el_2.textContent = `Top Rated Café: ${topCafeName}`;
  const summary_overview_el_3 = document.createElement("p");
  summary_overview_el_3.textContent = `Total ${
    api_data?.results.length || "0"
  } Cafes`;
  const summary_overview_el_4 = document.createElement("p");
  const ratings = api_data?.results ?? [];
  const avg_rating =
    ratings.length > 0
      ? (
          ratings.reduce((acc, e) => {
            return acc + (Number(e?.rating) || 0);
          }, 0) / ratings.length
        ).toFixed(2)
      : "N/A";
  summary_overview_el_4.textContent = `Avg Rating: ${avg_rating}⭐`;
  summary_overview_el.append(
    summary_overview_el_1,
    summary_overview_el_2,
    summary_overview_el_3,
    summary_overview_el_4
  );
  const open_analysis_modal_btn = document.createElement("button");
  open_analysis_modal_btn.textContent = "hi button";
  summary_overview_el.classList.add("summary-overview-el");
  open_analysis_modal_btn.classList.add("open-analysis-modal-btn");
  open_analysis_modal_btn.textContent = "View Insights";
  open_analysis_modal_btn.addEventListener("click", () => {
    showInsightsModal();
  });
  document
    .getElementById("results-page-top-right")
    .append(summary_overview_el, open_analysis_modal_btn);
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
  const next_open_close_str = `${
    (cafe?.next_open_close?.open_now
      ? `<span class="status-open">Open.</span> Closes ${
          new Date(cafe?.next_open_close?.next_close).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }) || ""
        }`
      : `<span class="status-closed">Closed.</span> Opens ${
          new Date(cafe.next_open_close.next_open).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }) || ""
        }`) || "Opening Hours ▾"
  }`;
  if (cafe?.r_hours != null) {
    const hours_dropdown = document.createElement("div");
    hours_dropdown.classList.add("modal-item-hours-dropdown");
    const hours_button = document.createElement("button");
    hours_button.classList.add("modal-item-hours-toggle");
    hours_button.innerHTML = next_open_close_str;
    const hours_list = document.createElement("div");
    hours_list.classList.add("modal-item-hours-list");
    hours_dropdown.append(hours_button, hours_list);
    cafe.r_hours.forEach((e) => {
      const e_i = document.createElement("p");
      e_i.innerHTML = `
        <span class="day">${daysMap[e[0]]}:</span> 
        <span class="open-time">${formatTimeString(e[1][0])}</span> - 
        <span class="close-time">${formatTimeString(e[1][1])}</span>
      `;
      hours_list.appendChild(e_i);
    });
    hours_dropdown.addEventListener("click", () => {
      if (hours_list.style.maxHeight && hours_list.style.maxHeight !== "0px") {
        hours_list.style.maxHeight = "0";
        hours_dropdown.classList.remove("open");
        hours_button.innerHTML = next_open_close_str;
      } else {
        hours_list.style.maxHeight = hours_list.scrollHeight + "px";
        hours_dropdown.classList.add("open");
        hours_button.innerHTML = next_open_close_str;
      }
    });
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
  // const confidence_el = `Confidence -> ${cafe["study_confidence"]}`;
  modal_body_container_el_2.append(rating_el, review_summary_el);
  // start progress bar
  const progress_circle = document.createElement("div");
  progress_circle.classList.add("progress-circle");
  progress_circle.style = `--value: ${Number(cafe["study_confidence"]*100)}`;
  progress_circle.setAttribute('role', 'progressbar');
  progress_circle.ariaValueNow = `${Number(cafe["study_confidence"]*100)}`;
  progress_circle.ariaValueMin = '0';
  progress_circle.ariaValueMax = '100';
  progress_circle.textContent = `${(cafe["study_confidence"] * 100).toFixed(2)}%`;
  modal_body_container_el_2.appendChild(progress_circle);
  // end progress bar

  modal_body_container_el_1.classList.add("modal-body-con-left");
  modal_body_container_el_2.classList.add("modal-body-con-right");
  modal_body_container.appendChild(modal_body_container_el_1);
  modal_body_container.appendChild(modal_body_container_el_2);
  body.appendChild(place_name);
  body.appendChild(modal_body_container);
  modal.style.display = "block";
}

function showInsightsModal() {
  const modal = document.getElementById("analysis-modal");
  modal.style.display = "block";
}

document.getElementById("modal-close").onclick = () => {
  document.getElementById("detail-modal").style.display = "none";
  document.getElementById("modal-body").innerHTML = "";
};

document.getElementById("analysis-modal-close").onclick = () => {
  document.getElementById("analysis-modal").style.display = "none";
  document.getElementById("analysis-modal-body").innerHTML = "";
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

function formatTimeString(timeStr) {
  // "hh:mm" 24 hr
  if (!timeStr) return "";
  let [hours, minutes] = timeStr.split(":").map(Number);
  const ampm = hours < 12 ? "AM" : "PM";
  hours = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`;
}
