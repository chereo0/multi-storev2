import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon paths for CRA
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ClickHandler = ({ onSelect, disabled }) => {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onSelect?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

const LocationPicker = ({
  value,
  onChange,
  isDark = false,
  disabled = false,
  height = 320,
}) => {
  // Normalize incoming value to numeric lat/lng or null
  const normalize = (v) => {
    if (!v) return null;
    const lat = typeof v.lat === "string" ? parseFloat(v.lat) : v.lat;
    const lng = typeof v.lng === "string" ? parseFloat(v.lng) : v.lng;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  };

  const [pos, setPos] = useState(normalize(value));
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    const n = normalize(value);
    // Allow clearing
    setPos(n);
  }, [value]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const center = useMemo(() => {
    if (pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lng)) return [pos.lat, pos.lng];
    // Default center (Beirut, Lebanon) as a reasonable fallback
    return [33.8938, 35.5018];
  }, [pos]);

  const handleSelect = (p) => {
    const n = normalize(p);
    setPos(n);
    if (n) onChange?.(n);
  };

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (res) => {
        const p = { lat: res.coords.latitude, lng: res.coords.longitude };
        const n = normalize(p);
        setPos(n);
        if (n) onChange?.(n);
      },
      (err) => {
        console.warn("Geolocation error:", err?.message || err);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          {pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lng) ? (
            <span>
              Selected: {pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}
            </span>
          ) : (
            <span>Click on the map to set a location</span>
          )}
        </div>
        <button
          type="button"
          onClick={locateMe}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : isDark
              ? "bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30"
              : "bg-cyan-600/10 text-cyan-700 hover:bg-cyan-600/20"
          }`}
        >
          Use my location
        </button>
      </div>
      <div style={{ height, minHeight: 240 }} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {mounted && (
          <MapContainer
            key={`${center[0].toFixed(4)},${center[1].toFixed(4)}`}
            center={center}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={!disabled}
            whenCreated={(map) => {
              mapRef.current = map;
              // Invalidate size after a tick to ensure correct rendering
              setTimeout(() => {
                try {
                  map.invalidateSize(false);
                } catch (e) {}
              }, 0);
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
            />
            {!disabled && <ClickHandler onSelect={handleSelect} disabled={disabled} />}
            {pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lng) && (
              <Marker position={[pos.lat, pos.lng]} />
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
