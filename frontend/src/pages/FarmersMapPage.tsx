import { useEffect, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Search, Filter, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../api/axiosInstance'
import LoadingSpinner from '../components/common/LoadingSpinner'

// Fix Leaflet default icon path issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl']
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

// Custom green marker for farmers
const farmerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

interface FarmerMapData {
  _id: string
  userId: { _id: string; name: string } | string
  farmName: string
  district: string
  state: string
  latitude?: number
  longitude?: number
  verificationStatus: string
  productCount?: number
}

/** Haversine distance in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function FlyToLocation({ pos }: { pos: [number, number] | null }) {
  const map = useMap()
  useEffect(() => { if (pos) map.flyTo(pos, 11, { duration: 1.2 }) }, [pos, map])
  return null
}

const DISTANCE_FILTERS = [5, 10, 25, 50, 999]

export default function FarmersMapPage() {
  const { t } = useTranslation()
  const [farmers, setFarmers] = useState<FarmerMapData[]>([])
  const [loading, setLoading] = useState(true)
  const [customerPos, setCustomerPos] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationInput, setLocationInput] = useState('')
  const [distanceFilter, setDistanceFilter] = useState(999)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    axiosInstance.get<{ success: boolean; data: FarmerMapData[] }>('/api/farmers/map/all')
      .then((r) => setFarmers(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t('map.locationError'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setCustomerPos(coords)
        setFlyTarget(coords)
        setLocationError(null)
      },
      () => setLocationError(t('map.permissionDenied')),
    )
  }, [t])

  async function handleLocationSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!locationInput.trim()) return
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationInput + ', India')}&format=json&limit=1`)
      const data = await resp.json() as Array<{ lat: string; lon: string }>
      if (data.length > 0) {
        const coords: [number, number] = [parseFloat(data[0]!.lat), parseFloat(data[0]!.lon)]
        setCustomerPos(coords)
        setFlyTarget(coords)
        setLocationError(null)
      } else {
        setLocationError('Location not found. Try a different name.')
      }
    } catch {
      setLocationError(t('map.locationError'))
    }
  }

  const farmersWithCoords = farmers.filter((f) => f.latitude != null && f.longitude != null)

  const farmersWithDistance = farmersWithCoords.map((f) => ({
    ...f,
    distanceKm: customerPos
      ? haversineKm(customerPos[0], customerPos[1], f.latitude!, f.longitude!)
      : null,
  })).sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))

  const filteredFarmers = farmersWithDistance.filter((f) =>
    f.distanceKm == null || f.distanceKm <= distanceFilter
  )

  const mapCenter: [number, number] = customerPos ?? [17.385, 78.4867] // Hyderabad default

  return (
    <div className="min-h-screen bg-[#FAF3E0]">
      {/* Header */}
      <div className="bg-[#2D6A2D] text-white py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={28} />
            <h1 className="text-3xl font-bold">{t('map.title')}</h1>
          </div>
          <p className="text-white/80 mb-5">{t('map.subtitle')}</p>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleGetLocation}
              className="flex items-center gap-2 bg-white text-[#2D6A2D] rounded-full px-4 py-2 text-sm font-semibold hover:bg-[#FAF3E0] transition-colors">
              <Navigation size={16} />{t('map.shareLocation')}
            </button>
            <form onSubmit={handleLocationSearch} className="flex gap-2">
              <input value={locationInput} onChange={(e) => setLocationInput(e.target.value)} placeholder={t('map.locationPlaceholder')}
                className="rounded-full bg-white/10 border border-white/30 text-white placeholder-white/60 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[200px]" />
              <button type="submit" className="bg-[#5DAB24] rounded-full px-4 py-2 text-sm font-medium hover:bg-[#4d9420]">
                <Search size={16} />
              </button>
            </form>
          </div>

          {locationError && <p className="mt-2 text-sm text-yellow-200">{locationError}</p>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Distance filter */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-600">{t('map.filter')}:</span>
          {DISTANCE_FILTERS.map((d) => (
            <button key={d} onClick={() => setDistanceFilter(d)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${distanceFilter === d ? 'bg-[#2D6A2D] text-white border-[#2D6A2D]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#2D6A2D]'}`}>
              {d === 999 ? t('map.any', { defaultValue: 'Any' }) : `${d} km`}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Map */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow overflow-hidden h-[500px]">
            {loading ? (
              <div className="h-full flex items-center justify-center"><LoadingSpinner size={48} /></div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={customerPos ? 11 : 7}
                className="h-full w-full"
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FlyToLocation pos={flyTarget} />

                {customerPos && (
                  <Marker position={customerPos} icon={customerIcon}>
                    <Popup>📍 Your location</Popup>
                  </Marker>
                )}

                {filteredFarmers.map((f) => (
                  <Marker key={f._id} position={[f.latitude!, f.longitude!]} icon={farmerIcon}>
                    <Popup>
                      <div className="text-sm min-w-[160px]">
                        <p className="font-bold text-[#2D6A2D]">{f.farmName}</p>
                        <p className="text-gray-500">{f.district}, {f.state}</p>
                        {f.distanceKm != null && (
                          <p className="text-xs text-gray-400 mt-1">≈ {f.distanceKm.toFixed(1)} km {t('map.away')}</p>
                        )}
                        <p className="text-xs text-gray-500">{f.productCount ?? 0} {t('map.products')}</p>
                        <a href={`/farmers/${typeof f.userId === 'object' ? f.userId._id : f.userId}`}
                          className="mt-2 block text-center bg-[#2D6A2D] text-white rounded px-3 py-1 text-xs hover:bg-[#245424]">
                          {t('map.viewProducts')}
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Farmer list */}
          <div className="bg-white rounded-2xl shadow p-4 h-[500px] overflow-y-auto">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-[#2D6A2D]" />
              {filteredFarmers.length} farmer{filteredFarmers.length !== 1 ? 's' : ''}
              {customerPos ? ' nearby' : ' total'}
            </h2>

            {filteredFarmers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">{t('map.noFarmers')}</p>
                <p className="text-gray-400 text-xs mt-1">{t('map.noFarmersHint', { defaultValue: 'Try increasing the distance filter.' })}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFarmers.map((f) => {
                  const fid = typeof f.userId === 'object' ? f.userId._id : f.userId
                  return (
                    <div key={f._id}
                      className="border border-gray-100 rounded-xl p-3 hover:border-[#2D6A2D]/30 hover:bg-[#FAF3E0]/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setFlyTarget([f.latitude!, f.longitude!])
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{f.farmName}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} />{f.district}, {f.state}
                          </p>
                          {f.distanceKm != null && (
                            <p className="text-xs text-[#2D6A2D] font-medium mt-1">
                              ≈ {f.distanceKm.toFixed(1)} km {t('map.away')}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Package size={10} />{f.productCount ?? 0} {t('map.products')}
                          </p>
                        </div>
                        <Link to={`/farmers/${fid}`} onClick={(e) => e.stopPropagation()}
                          className="shrink-0 text-xs bg-[#2D6A2D] text-white rounded-full px-3 py-1 hover:bg-[#245424] whitespace-nowrap">
                          {t('map.viewProducts')}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="mt-4 text-xs text-gray-400 border-t pt-3">{t('map.distanceNote')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

