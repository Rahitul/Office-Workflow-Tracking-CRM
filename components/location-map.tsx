"use client"

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"

interface MapPoint {
  lat: number
  lng: number
  status: string
  timestamp: string
}

export default function LocationMap({ points }: { points: MapPoint[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return
    const el = mapRef.current
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setReady(true)
          observer.disconnect()
        }
      }
    })
    observer.observe(el)
    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
      setReady(true)
      observer.disconnect()
    }
    return () => observer.disconnect()
  }, [points])

  useEffect(() => {
    if (!ready || !mapRef.current || points.length === 0) return

    let L: any

    const initMap = async () => {
      L = await import("leaflet")

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapRef.current, {
        attributionControl: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      L.control.attribution({ prefix: false }).addTo(map)

      const bounds = L.latLngBounds([])

      points.forEach((point) => {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          popupAnchor: [0, -10],
        })
        const marker = L.marker([point.lat, point.lng], { icon }).addTo(map)
        marker.bindPopup(`
          <div style="font-size:13px;line-height:1.5;min-width:140px">
            <b>${point.status}</b><br/>
            ${point.timestamp}
          </div>
        `)
        bounds.extend(marker.getLatLng())
      })

      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 15)
      } else {
        map.fitBounds(bounds, { padding: [50, 50] })
      }

      requestAnimationFrame(() => map.invalidateSize())
      setTimeout(() => map.invalidateSize(), 300)

      mapInstanceRef.current = map
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [ready, points])

  if (points.length === 0) return null

  return (
    <div
      ref={mapRef}
      className="h-full w-full rounded-lg border border-slate-200"
      style={{ minHeight: "250px" }}
    />
  )
}
