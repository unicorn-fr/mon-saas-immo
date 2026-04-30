import { useEffect, useRef, useState } from 'react'
import { Property } from '../../types/property.types'
import { Loader, MapPin } from 'lucide-react'

interface SearchMapProps {
  properties: Property[]
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
  selectedPropertyId?: string | null
  onPropertySelect?: (property: Property | null) => void
}

export const SearchMap = ({
  properties,
  onBoundsChange,
  selectedPropertyId,
  onPropertySelect,
}: SearchMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filter properties with valid coordinates
  const propertiesWithCoords = properties.filter(
    (p) => p.latitude !== null && p.longitude !== null
  )

  useEffect(() => {
    if (!mapRef.current || propertiesWithCoords.length === 0) return

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      // Initialize map if not already done
      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current!).setView(
          [
            propertiesWithCoords[0].latitude!,
            propertiesWithCoords[0].longitude!,
          ],
          12
        )

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map)

        mapInstanceRef.current = map

        // Listen to bounds changes
        map.on('moveend', () => {
          if (onBoundsChange) {
            const bounds = map.getBounds()
            onBoundsChange({
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest(),
            })
          }
        })

        setIsLoading(false)
      }

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // Add markers for all properties
      propertiesWithCoords.forEach((property) => {
        const isSelected = property.id === selectedPropertyId

        // Custom icon
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="${
              isSelected
                ? 'background:#1b5e3b;outline:4px solid #9fd4ba;'
                : 'background:#ffffff;border:2px solid #1b5e3b;'
            }border-radius:9999px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(13,12,10,0.18);cursor:pointer;transform:scale(1);transition:transform 0.15s;">
              <span style="color:${isSelected ? '#ffffff' : '#1b5e3b'};font-weight:700;font-size:12px;">${property.price}€</span>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })

        const marker = L.marker([property.latitude!, property.longitude!], {
          icon,
        }).addTo(mapInstanceRef.current)

        // Popup content
        const popupContent = `
          <div class="p-2" style="min-width: 200px;">
            ${
              property.images && property.images[0]
                ? `<img src="${property.images[0]}" alt="${property.title}" class="w-full h-32 object-cover rounded-xl mb-2" />`
                : ''
            }
            <h4 class="font-semibold mb-1 line-clamp-1" style="color:#0d0c0a">${property.title}</h4>
            <p class="text-sm mb-2 flex items-center gap-1" style="color:#5a5754">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              ${property.city}
            </p>
            <div class="flex items-center justify-between">
              <p style="font-size:16px;font-weight:700;color:#1b5e3b;margin:0;">${property.price}€/mois</p>
              <button
                onclick="window.location.href='/property/${property.id}'"
                style="font-size:11px;padding:4px 12px;background:#1b5e3b;color:#ffffff;border:none;border-radius:8px;cursor:pointer;"
              >
                Voir
              </button>
            </div>
          </div>
        `

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup',
        })

        // Click handler
        marker.on('click', () => {
          if (onPropertySelect) {
            onPropertySelect(property)
          }
        })

        markersRef.current.push(marker)
      })

      // Fit bounds to show all markers
      if (propertiesWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          propertiesWithCoords.map((p) => [p.latitude!, p.longitude!])
        )
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    })

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [propertiesWithCoords, selectedPropertyId, onBoundsChange, onPropertySelect])

  if (propertiesWithCoords.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: 'clamp(300px, 50dvh, 500px)', background: '#f4f2ee' }}>
        <div className="text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: '#ccc9c3' }} />
          <p style={{ color: '#5a5754' }}>
            Aucune propriété avec coordonnées GPS disponible
          </p>
        </div>
      </div>
    )
  }

  return (
    // isolation: isolate creates a new stacking context — confines Leaflet z-indexes (200–1000+) inside this wrapper
    <div className="relative w-full" style={{ height: 'clamp(300px, 50dvh, 500px)', isolation: 'isolate' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white" style={{ zIndex: 10 }}>
          <Loader className="w-8 h-8 animate-spin" style={{ color: '#1a1a2e' }} />
        </div>
      )}
      <div ref={mapRef} className="w-full" style={{ height: 'clamp(300px, 50dvh, 500px)' }} />

      {/* Info overlay — z-index relative to this stacking context only */}
      <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-3" style={{ zIndex: 1001 }}>
        <p className="text-sm font-medium" style={{ color: '#0d0c0a' }}>
          {propertiesWithCoords.length} bien{propertiesWithCoords.length > 1 ? 's' : ''} sur la
          carte
        </p>
      </div>
    </div>
  )
}
