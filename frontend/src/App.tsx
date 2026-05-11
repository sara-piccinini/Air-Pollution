import { useState, useEffect } from 'react'
import { type FormEvent } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import LandingPage from './LandingPage'
import 'leaflet/dist/leaflet.css'
import './App.css'

type City = {
  name: string
  aqi: number
  pm25: number
  pm10: number
  color: string
  lat: number
  lon: number
}

type ChartData = {
  name: string
  value: number
}

function getAQIColor(aqi: number) {
  if (aqi <= 50) return "#00e400"
  if (aqi <= 100) return "#d4d400"
  if (aqi <= 150) return "#ff7e00"
  if (aqi <= 200) return "#ff0000"
  if (aqi <= 300) return "#8f3f97"
  return "#7e0023"
}

function SetView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  return null
}

function FlyToCity({ point }: { point: City | null }) {
  const map = useMap()

  useEffect(() => {
    if (point) {
      map.flyTo([point.lat, point.lon], 11, {
        duration: 1.5,
      })
    }
  }, [point, map])

  return null
}

function MapClickHandler({ onDoubleClick }: { onDoubleClick: (lat: number, lon: number) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useMapEvent('dblclick', (e: any) => {
    onDoubleClick(e.latlng.lat, e.latlng.lng)
  })
  return null
}

type ExpandableCardProps = {
  city: City
  index: number
  isExpanded: boolean
  chartData: ChartData[] | null
  onToggleExpand: (index: number) => void
  onRemove: (index: number) => void
}

function ExpandableCard({ city, index, isExpanded, chartData, onToggleExpand, onRemove }: ExpandableCardProps) {
  return (
    <div className={`card ${isExpanded ? 'expanded' : ''}`} style={{ borderLeft: `5px solid ${city.color}` }}>
      <div className="card-header">
        <div>
          <b>{city.name}</b><br />
          AQI: {city.aqi}<br />
          PM2.5: {city.pm25} | PM10: {city.pm10}
        </div>
        <div className="card-buttons">
          <button className="expand-btn" onClick={() => onToggleExpand(index)} title="Expand">
            {isExpanded ? '▼' : '▶'}
          </button>
          <button className="remove-btn" onClick={() => onRemove(index)}>x</button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="card-expanded">
          <div className="chart-container">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value} />
                  <Bar dataKey="value" fill="#8884d8" name="Concentración (μg/m³)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>Cargando datos...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [comparisonCities, setComparisonCities] = useState<City[]>([])
  const [expandedCards, setExpandedCards] = useState<{ [key: number]: ChartData[] | null }>({})
  const [cityInput, setCityInput] = useState('')
  const [selectedPoint, setSelectedPoint] = useState<City | null>(null)

  async function searchCity() {
    if (!cityInput.trim()) return

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1`
    )
    const geoData = await geoRes.json()

    if (!geoData.results || geoData.results.length === 0) {
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

  function handleMapDoubleClick(lat: number, lon: number) {
    // Use reverse geocoding to get the location name
    fetchReverseGeocoding(lat, lon)
  }

  async function fetchReverseGeocoding(lat: number, lon: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      )
      const data = await res.json()
      const name = data.address?.city || data.address?.town || data.address?.village || `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`
      
      fetchAirQuality(lat, lon, name)
    } catch {
      // Fallback if geocoding fails
      fetchAirQuality(lat, lon, `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`)
    }
  }

  async function fetchChartData(city: City): Promise<ChartData[]> {
    return [
      {
        name: 'PM2.5',
        value: Math.round(city.pm25 * 100) / 100
      },
      {
        name: 'PM10',
        value: Math.round(city.pm10 * 100) / 100
      }
    ]
  }

  function addToCompare() {
    if (!selectedPoint) return
    if (comparisonCities.length >= 5) {
      alert("Max 5 cities")
      return
    }

    setComparisonCities([...comparisonCities, selectedPoint])
  }

  function removeCity(index: number) {
    const newCities = [...comparisonCities]
    newCities.splice(index, 1)
    setComparisonCities(newCities)
    
    // Clean up expanded data
    const newExpanded = { ...expandedCards }
    delete newExpanded[index]
    setExpandedCards(newExpanded)
  }

  async function toggleExpandCard(index: number) {
    if (expandedCards[index] !== undefined) {
      // Collapse
      const newExpanded = { ...expandedCards }
      delete newExpanded[index]
      setExpandedCards(newExpanded)
    } else {
      // Expand and fetch data
      const city = comparisonCities[index]
      const chartData = await fetchChartData(city)
      setExpandedCards(prev => ({ ...prev, [index]: chartData }))
    }
  }

  return (
    <>
      {showLanding ? (
        <LandingPage onEnter={() => setShowLanding(false)} />
      ) : (
        <div className="container">
          <div className="sidebar">
            <h2>Compare</h2>

            {comparisonCities.length === 0 && <p>No cities added</p>}

            {comparisonCities.map((c, i) => (
              <ExpandableCard
                key={i}
                city={c}
                index={i}
                isExpanded={expandedCards[i] !== undefined}
                chartData={expandedCards[i] || null}
                onToggleExpand={toggleExpandCard}
                onRemove={removeCity}
              />
            ))}
          </div>

          <div className="map-area">
            <form
              className="search"
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                searchCity()
              }}
            >
              <input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Enter city..."
              />
              <button type="submit">Search</button>
            </form>

            <MapContainer
              style={{ height: "100%", width: "100%" }}
              maxBounds={[[-90, -180], [90, 180]]}
              maxBoundsViscosity={1.0}
            >
              <SetView center={[20, 0]} zoom={2} />
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri"
              />

              <MapClickHandler onDoubleClick={handleMapDoubleClick} />
              <FlyToCity point={selectedPoint} />

          {selectedPoint && (
            <Marker position={[selectedPoint.lat, selectedPoint.lon]}>
              <Popup>
                <b>{selectedPoint.name}</b><br />
                AQI: {selectedPoint.aqi}<br />
                PM2.5: {selectedPoint.pm25}<br />
                PM10: {selectedPoint.pm10}<br /><br />
                <button onClick={addToCompare}>
                  Add to Compare
                </button>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="sidebar">
        <h3>AQI Legend</h3>
        <p>0-50 Good</p>
        <p>51-100 Moderate</p>
        <p>101-150 Unhealthy</p>
      </div>
        </div>
      )}
    </>
  )
}