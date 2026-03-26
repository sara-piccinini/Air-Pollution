import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

type City = {
  name: string
  aqi: number
  pm25: number
  pm10: number
  color: string
}

function getAQIColor(aqi: number) {
  if (aqi <= 50) return "#00e400"
  if (aqi <= 100) return "#d4d400"
  if (aqi <= 150) return "#ff7e00"
  if (aqi <= 200) return "#ff0000"
  if (aqi <= 300) return "#8f3f97"
  return "#7e0023"
}

export default function App() {
  const [comparisonCities, setComparisonCities] = useState<City[]>([])
  const [cityInput, setCityInput] = useState('')
  const [selectedPoint, setSelectedPoint] = useState<any>(null)

  async function searchCity() {
    if (!cityInput) return

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${cityInput}&count=1`
    )
    const geoData = await geoRes.json()

    if (!geoData.results) {
      alert("City not found")
      return
    }

    const city = geoData.results[0]

    fetchAirQuality(city.latitude, city.longitude, city.name)
  }

  async function fetchAirQuality(lat: number, lon: number, name: string) {
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10`
    )
    const data = await res.json()

    const aqi = data.current.us_aqi
    const color = getAQIColor(aqi)

    setSelectedPoint({
      lat,
      lon,
      name,
      aqi,
      pm25: data.current.pm2_5,
      pm10: data.current.pm10,
      color
    })
  }

  function addToCompare() {
    if (!selectedPoint) return
    if (comparisonCities.length >= 5) return alert("Max 5 cities")

    setComparisonCities([...comparisonCities, selectedPoint])
  }

  function removeCity(index: number) {
    const newCities = [...comparisonCities]
    newCities.splice(index, 1)
    setComparisonCities(newCities)
  }

  return (
    <div className="container">

      {/* LEFT SIDEBAR */}
      <div className="sidebar">
        <h2>Compare</h2>

        {comparisonCities.length === 0 && (
          <p>No cities added</p>
        )}

        {comparisonCities.map((c, i) => (
          <div key={i} className="card" style={{ borderLeft: `5px solid ${c.color}` }}>
            <button onClick={() => removeCity(i)}>x</button>
            <b>{c.name}</b><br />
            AQI: {c.aqi}<br />
            PM2.5: {c.pm25} | PM10: {c.pm10}
          </div>
        ))}
      </div>

      {/* MAP */}
      <div className="map-area">

        <div className="search">
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Enter city..."
          />
          <button onClick={searchCity}>Search</button>
        </div>

        <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {selectedPoint && (
            <Marker position={[selectedPoint.lat, selectedPoint.lon]}>
              <Popup>
                <b>{selectedPoint.name}</b><br />
                AQI: {selectedPoint.aqi}<br /><br />
                <button onClick={addToCompare}>
                  Add to Compare
                </button>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="sidebar">
        <h3>AQI Legend</h3>
        <p>0-50 Good</p>
        <p>51-100 Moderate</p>
        <p>101-150 Unhealthy</p>
      </div>

    </div>
  )
}