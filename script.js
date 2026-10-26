const ddlUnits = document.querySelector("#ddlUnits");
const dvCityCountry = document.querySelector("#dvCityCountry");
const dvCurrDate = document.querySelector("#dvCurrDate");
const dvCurrTemp = document.querySelector("#dvCurrTemp");
const pFeelsLike = document.querySelector("#pFeelsLike");
const pHumidity = document.querySelector("#pHumidity");
const pWind = document.querySelector("#pWind");
const pPrecipitation = document.querySelector("#pPrecipitation");

let coordinates;

ddlUnits.addEventListener("change", () => {
  if (coordinates) {
    getWeatherData(coordinates.lat, coordinates.lon);
  }
});

async function getGeoData() {
  let search = "Ottawa, ON";
  
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=jsonv2&addressdetails=1&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);

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

getGeoData();

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
  
  let date = new Intl.DateTimeFormat("en-US",dateOptions).format(new Date());
  
  console.log(cityName, countryName);

  dvCityCountry.textContent = `${cityName}, ${countryName}`;
  dvCurrDate.textContent = date;

  console.log(date);
} 

async function getWeatherData(lat, lon) {
  // if toggle value = F

  let tempUnit= "celsius";
  let windUnit = "kmh";
  let precipUnit = "mm";

  if (ddlUnits.value === "F"){
     tempUnit = "fahrenheit";
     windUnit = "mph";
     precipUnit = "inch";
  }
  // else

  // temperature_unit=fahrenheit OR celsius 
  // wind_speed_unit= mph or kmh
  // precipitation_unit = inch or mm
  
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,relative_humidity_2m,dew_point_2m&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&wind_speed_unit=${windUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipUnit}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);

    loadWeatherData(result);
  } catch (error) {
    console.error(error.message);
  }
}

function loadWeatherData(weather){
  dvCurrTemp.textContent = Math.round(weather.current.temperature_2m);
  pFeelsLike.textContent = Math.round(weather.current.apparent_temperature);
  pHumidity.textContent = weather.current.relative_humidity_2m;
  pWind.textContent = `${Math.round(weather.current.wind_speed_10m)} ${weather.current_units.wind_speed_10m}`;
  pPrecipitation.textContent = `${weather.current.precipitation} ${weather.current_units.precipitation}`;
}

function getWeatherFileName(code){

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

  let fileName = `icon-${weatherCodes[code]}.webp`

  return fileName;

  return weatherCodes[code]
}

// getWeatherData();

console.log(getWeatherFileName(57));
