import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

interface PropertyMapProps {
  address: string
  city: string
  postalCode: string
  latitude?: number
  longitude?: number
}

export const PropertyMap = ({
  address,
  city,
  postalCode,
  latitude,
  longitude,
}: PropertyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    // Only initialize if we have coordinates and Leaflet is loaded
    if (latitude && longitude && typeof window !== 'undefined') {
      // Dynamically import Leaflet to avoid SSR issues
      import('leaflet').then((L) => {
        // Clean up previous map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
        }

        if (!mapRef.current) return

        // Create map
        const map = L.map(mapRef.current).setView([latitude, longitude], 15)

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        // Create custom icon
        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="
              background-color: #2563eb;
              width: 40px;
              height: 40px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg
                style="transform: rotate(45deg); width: 20px; height: 20px;"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })

        // Add marker
        L.marker([latitude, longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(
            `
            <div style="padding: 8px; font-family: system-ui;">
              <strong style="font-size: 14px; display: block; margin-bottom: 4px;">${address}</strong>
              <span style="font-size: 12px; color: #666;">${city}, ${postalCode}</span>
            </div>
          `
          )
          .openPopup()

        mapInstanceRef.current = map

        // Add CSS for Leaflet
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link')
          link.id = 'leaflet-css'
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          document.head.appendChild(link)
        }
      })
    }

    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, address, city, postalCode])

  // If no coordinates, show a message to use geocoding service
  if (!latitude || !longitude) {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center p-6 text-center">
        <MapPin className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-700 font-medium mb-2">Localisation</p>
        <p className="text-sm text-gray-600 max-w-md">
          {address}, {city} {postalCode}
        </p>
        <p className="text-xs text-gray-500 mt-4">
          Carte interactive disponible prochainement
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="aspect-video rounded-lg shadow-md" />
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="w-4 h-4" />
        <span>
          {address}, {city} {postalCode}
        </span>
      </div>
    </div>
  )
}
