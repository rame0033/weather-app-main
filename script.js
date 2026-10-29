const ddlUnits = document.querySelector("#ddlUnits");
const ddlDay = document.querySelector("#ddlDay");
const btnSearch = document.querySelector("#btn-search");
const txtSearch = document.querySelector("#txtSearch")
const dvCityCountry = document.querySelector("#dvCityCountry");
const dvCurrDate = document.querySelector("#dvCurrDate");
const dvCurrTemp = document.querySelector("#dvCurrTemp");
const pFeelsLike = document.querySelector("#pFeelsLike");
const pHumidity = document.querySelector("#pHumidity");
const pWind = document.querySelector("#pWind");
const pPrecipitation = document.querySelector("#pPrecipitation");

let coordinates;
// Keep the API response available when the day selector changes.
let latestWeatherData;

ddlUnits.addEventListener("change", () => {
  if (coordinates) {
    getWeatherData(coordinates.lat, coordinates.lon);
  }
});

async function getGeoData() {
  let search = txtSearch.value;
  
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=jsonv2&addressdetails=1&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();

    if (result.length === 0) {
      throw new Error("No location found");
    }

    coordinates = {
      lat: result[0].lat,
      lon: result[0].lon,
    };

    loadLocationData(result);
    getWeatherData(coordinates.lat, coordinates.lon);
  } catch (error) {
    console.error(error.message);
  }
}

function populateDayOfWeek(){

  // loop to populate day options
  let currDate = new Date();
  let currDay;

  for(i=0; i < 7; i++){

    currDay = new Intl.DateTimeFormat("en-US", {weekday: "long"}).format(currDate);
    const newOption = document.createElement("option");
    const dayOfWeek = document.createTextNode(currDay);

    newOption.setAttribute("class", "hourly_select-day");
    newOption.setAttribute("value", i);
    newOption.appendChild(dayOfWeek);
  
    ddlDay.insertAdjacentElement("beforeend", newOption);

    currDate.setDate(currDate.getDate() + 1);

  }
}

// getGeoData();

function loadLocationData(locationData){
  let location = locationData[0].address;
  cityName = location.city;
  countryName = location.country_code.toUpperCase();
  
    let dateOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "long",
  };

  let currDate =  new Intl.DateTimeFormat("en-US",dateOptions).format(new Date());
  

  dvCityCountry.textContent = `${cityName}, ${countryName}`;
  dvCurrDate.textContent = currDate;
} 

async function getWeatherData(lat, lon) {

  let tempUnit= "celsius";
  let windUnit = "kmh";
  let precipUnit = "mm";

  if (ddlUnits.value === "F"){
     tempUnit = "fahrenheit";
     windUnit = "mph";
     precipUnit = "inch";
  }
  
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=weather_code,temperature_2m,relative_humidity_2m,dew_point_2m&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}&timezone=auto`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const weatherData = await response.json();

    // Store the response for the day selector's change handler.
    latestWeatherData = weatherData;
    loadCurrentWeather(weatherData);
    loadDailyForecast(weatherData);
    loadHourlyForecast (weatherData);
  } catch (error) {
    console.error(error.message);
  }
}

function loadCurrentWeather(weather){
  dvCurrTemp.textContent = Math.round(weather.current.temperature_2m);
  pFeelsLike.textContent = Math.round(weather.current.apparent_temperature);
  pHumidity.textContent = weather.current.relative_humidity_2m;
  pWind.textContent = `${Math.round(weather.current.wind_speed_10m)} ${weather.current_units.wind_speed_10m}`;
  pPrecipitation.textContent = `${weather.current.precipitation} ${weather.current_units.precipitation}`;
}

function loadDailyForecast(weather){
  let daily = weather.daily;

  for (let i=0 ; i < 7; i++){
    const day = new Date(`${daily.time[i]}T00:00:00Z`);
    const dayOfWeek = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "UTC",
    }).format(day);

    let dvForecastday = document.querySelector(`#dvForecastDay${i+1}`);
    let weatherCodeName = getWeatherCodeName(daily.weather_code[i]);

    let dailyHigh = Math.round(daily.temperature_2m_max[i])+"°";
    let dailyLow = Math.round(daily.temperature_2m_min[i])+ "°";

    // Clear previous content of the div
    while (dvForecastday.firstChild){
      dvForecastday.removeChild(dvForecastday.firstChild);
    }

    //Add day of the week to daily forecast
    addDailyElement("p", "daily_day-title", dayOfWeek, "", dvForecastday, "afterbegin");

    addDailyElement("img", "daily_day-icon", "",weatherCodeName,  dvForecastday,"beforeend");

    addDailyElement("div", "daily_day-temps", "", "", dvForecastday, "beforeend");
    let dvDailyTemps = dvForecastday.querySelector(`#dvForecastDay${i+1} .daily_day-temps`);
    addDailyElement("p", "daily_day-high", dailyHigh, "", dvDailyTemps, "afterbegin");
    addDailyElement("p", "daily_day-low", dailyLow, "", dvDailyTemps, "beforeend");
  }
}

function addDailyElement( tag, className, content, weatherCodeName, parentElement, position) {
    const newElement = document.createElement(tag);
    newElement.setAttribute("class", className);

    if (content !== ""){
      const newContent = document.createTextNode(content);
      newElement.appendChild(newContent);
    }
    if (tag === "img"){
      newElement.setAttribute("src", `/assets/images/icon-${weatherCodeName}.webp`);
      newElement.setAttribute("alt", weatherCodeName);
      newElement.setAttribute("width", "320");
      newElement.setAttribute("height", "320");
    }

    parentElement.insertAdjacentElement(position, newElement);
}

function loadHourlyForecast(weather){

  let dayIndex = Number(ddlDay.value);
    let weatherCodes = weather.hourly.weather_code;
    let temps = weather.hourly.temperature_2m;
    let hours = weather.hourly.time;

    for (let h = 0; h < 24; h++){
      // Read the selected day's hour while reusing the 24 forecast display slots.
      const forecastHour = dayIndex * 24 + h;
      if (forecastHour >= hours.length) {
        break;
      }

      let weatherCodeName = getWeatherCodeName(weatherCodes[forecastHour]);
      let temp = Math.round(temps[forecastHour]) + "°";
      let hour = new Date(hours[forecastHour]).toLocaleString('en-US', {hour: 'numeric', hour12:true});

      let dvForecastHour = document.querySelector(`#dvForecastHour${h + 1}`);
      // Replace the previous day's content instead of appending duplicates.
      dvForecastHour.replaceChildren();

      addDailyElement("img", "hourly_hour-icon", "",weatherCodeName,  dvForecastHour,"afterbegin");
      addDailyElement("p", "hourly_hour-time", hour, "", dvForecastHour, "beforeend");
      addDailyElement("p", "hourly_hour-temp", temp, "", dvForecastHour, "beforeend");

    }
  
}


function getWeatherCodeName(code){

  const weatherCodes = {
    0: "sunny",
    1: "partly-cloudy",
    2: "partly-cloudy",
    3: "overcast",
    45: "fog",
    48: "fog",
    51: "drizzle",
    53: "drizzle",
    55: "drizzle",
    56: "drizzle",
    57: "drizzle",
    61: "rain",
    63: "rain",
    65: "rain",
    66: "rain",
    67: "rain",
    71:"snow",
    73:"snow",
    75:"snow",
    77:"snow",
    80: "rain",
    81: "rain",
    82: "rain",
    85:"snow",
    86:"snow",
    95: "storm",
    96: "storm",
    99: "storm",

  };
  
  return weatherCodes[code];
}

populateDayOfWeek();

// Get weather for the searched location
btnSearch.addEventListener("click", getGeoData);

ddlDay.addEventListener("change", () => {
  if (latestWeatherData) {
    // Pass weather data explicitly; the event object is not forecast data.
    loadHourlyForecast(latestWeatherData);
  }
});
