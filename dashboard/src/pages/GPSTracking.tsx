// PawSense360 — GPS Tracking Page
// Uses Leaflet for map display with OpenStreetMap tiles (no API key required).

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import { SectionHeader, FreshnessBar, SourceBadge } from '../components/MetricCard';
import { Satellite, Navigation, Clock, ExternalLink, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

// Fix Leaflet default marker icon path issue with Vite bundler
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const GPSTracking: React.FC = () => {
  const { telemetry, settings } = useApp();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const gps = telemetry?.gps;
  const hasCoords = gps?.hasFix || (gps?.lastKnown !== undefined);
  const displayLat = gps?.hasFix ? gps.latitude.value : (gps?.lastKnown?.latitude ?? 12.9716);
  const displayLon = gps?.hasFix ? gps.longitude.value : (gps?.lastKnown?.longitude ?? 77.5946);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [displayLat, displayLon],
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Custom paw-print icon
    const pawIcon = L.divIcon({
      html: `<div style="
        width: 36px; height: 36px;
        background: ${gps?.hasFix ? '#0F3460' : '#F59E0B'};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 18px;
      ">🐾</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([displayLat, displayLon], { icon: pawIcon }).addTo(map);
    marker.bindPopup(
      `<strong>${settings.deviceName}</strong><br/>` +
      `${displayLat.toFixed(5)}, ${displayLon.toFixed(5)}<br/>` +
      `${gps?.hasFix ? '✅ Live Fix' : '⚠️ Last Known Location'}`
    );

    leafletMapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update marker position when GPS data changes
  useEffect(() => {
    if (!leafletMapRef.current || !markerRef.current) return;
    const lat = displayLat;
    const lon = displayLon;
    markerRef.current.setLatLng([lat, lon]);
    leafletMapRef.current.panTo([lat, lon]);
  }, [displayLat, displayLon]);

  return (
    <div className="page-content">
      <SectionHeader
        title="GPS Tracking"
        subtitle="Neo-6M GPS module — requires outdoor line-of-sight to satellites"
        actions={gps && <SourceBadge source={gps.latitude.source} />}
      />

      {/* GPS Limitation Notice */}
      <div style={{
        background: '#F0FFF4', border: '1px solid #BBF7D0',
        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
        fontSize: '0.8125rem', color: '#14532D',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>GPS Coverage:</strong> The Neo-6M is a satellite GPS receiver —
          it is <em>not</em> a cellular module. Live remote tracking requires the ESP32
          to be connected to Wi-Fi. Indoor use will likely produce no satellite fix.
          Initial cold-start fix can take 30–120+ seconds outdoors.
          {settings.demoMode && ' Currently showing SIMULATED location near Bengaluru, India.'}
        </div>
      </div>

      {/* Status Row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="card-title" style={{ marginBottom: 6 }}>Fix Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`status-dot ${gps?.hasFix ? 'pulsing' : gps?.isStale ? 'warning' : 'offline'}`} />
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {gps?.hasFix ? 'Active Fix' : gps?.isStale ? 'Last Known' : 'No Fix'}
            </span>
          </div>
          <p className="text-xs text-muted" style={{ marginTop: 4 }}>{gps?.statusMessage}</p>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="card-title" style={{ marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Satellite size={12} /> Satellites
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{gps?.satellites ?? '—'}</span>
          <p className="text-xs text-muted">HDOP: {gps?.hdop?.toFixed(1) ?? '—'}</p>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="card-title" style={{ marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Navigation size={12} /> Speed
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {gps?.hasFix ? gps.speedKmh.toFixed(1) : '—'}
          </span>
          <p className="text-xs text-muted">km/h over ground</p>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="card-title" style={{ marginBottom: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Clock size={12} /> Last Fix
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {gps?.lastFixTime
              ? format(new Date(gps.lastFixTime), 'HH:mm:ss')
              : '—'}
          </span>
          <p className="text-xs text-muted">UTC time</p>
        </div>
      </div>

      {/* Map */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        {!gps?.hasFix && (
          <div style={{
            padding: '8px 16px',
            background: '#FEF3C7',
            fontSize: '0.8rem',
            color: '#92400E',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <AlertTriangle size={14} />
            {gps?.isStale
              ? 'Showing LAST KNOWN location — GPS fix is currently unavailable.'
              : settings.demoMode
                ? 'Showing DEMO location (Bengaluru, India). Not a real device position.'
                : 'Searching for GPS fix — map will update when satellites are locked.'}
          </div>
        )}
        <div ref={mapRef} style={{ height: 420, width: '100%' }} />
        {gps?.latitude && (
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--color-border)' }}>
            <FreshnessBar ageMs={Date.now() - gps.latitude.timestampMs} maxAgeMs={60000} />
          </div>
        )}
      </div>

      {/* Coordinate Details */}
      {hasCoords && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Coordinates</span>
            {gps?.hasFix && (
              <a
                href={gps.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <ExternalLink size={13} /> Open in Google Maps
              </a>
            )}
          </div>
          <div className="grid-2">
            <div>
              <div className="card-title" style={{ marginBottom: 4 }}>Latitude</div>
              <code className="font-mono" style={{ fontSize: '1rem', fontWeight: 600 }}>
                {displayLat.toFixed(6)}°
              </code>
            </div>
            <div>
              <div className="card-title" style={{ marginBottom: 4 }}>Longitude</div>
              <code className="font-mono" style={{ fontSize: '1rem', fontWeight: 600 }}>
                {displayLon.toFixed(6)}°
              </code>
            </div>
          </div>
          {gps?.altitudeM ? (
            <p className="text-sm text-muted" style={{ marginTop: 8 }}>
              Altitude: {gps.altitudeM.toFixed(0)} m
            </p>
          ) : null}
          {!gps?.hasFix && (
            <p className="text-xs text-muted" style={{ marginTop: 8 }}>
              ⚠️ Showing {settings.demoMode ? 'DEMO' : 'last known'} position — not current location.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GPSTracking;
