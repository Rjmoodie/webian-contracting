"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Camera, Video, Music } from 'lucide-react';

// Fix for default Leaflet icon issue (using CDN URLs as fallback)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface JamaicaLeafletMapProps {
  selectedParish: string | null;
  onParishClick: (parish: string) => void;
}

// Parish coordinates (approximate center points for Jamaica)
const parishCoordinates: Record<string, [number, number]> = {
  'Kingston': [17.9712, -76.7929],
  'St. Andrew': [18.0764, -76.7942],
  'St. Thomas': [17.9414, -76.4086],
  'Portland': [18.1247, -76.4108],
  'St. Mary': [18.1466, -76.8972],
  'St. Ann': [18.3147, -77.3944],
  'Trelawny': [18.3526, -77.6078],
  'St. James': [18.4469, -77.9136],
  'Hanover': [18.4097, -78.1336],
  'Westmoreland': [18.2944, -78.1569],
  'St. Elizabeth': [18.0500, -77.7667],
  'Manchester': [18.0473, -77.5164],
  'Clarendon': [18.1250, -77.2833],
  'St. Catherine': [18.0081, -77.0069],
};

// Create custom marker icon
const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'ecj-marker',
    html: `
      <div class="ecj-marker__wrap ${isSelected ? 'is-selected' : ''}">
        <div class="ecj-marker__pulse"></div>
        <div class="ecj-marker__dot"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Component to handle map view updates when selectedParish changes
function MapViewUpdater({ selectedParish }: { selectedParish: string | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    if (selectedParish && parishCoordinates[selectedParish]) {
      const [lat, lng] = parishCoordinates[selectedParish];
      map.setView([lat, lng], 10, { animate: true, duration: 0.5 });
    } else {
      // Default view: center of Jamaica
      map.setView([18.1096, -77.2975], 9, { animate: true, duration: 0.5 });
    }
  }, [selectedParish, map]);
  
  return null;
}

// Map content component that uses the map context
function MapContent({ selectedParish, onParishClick }: JamaicaLeafletMapProps) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewUpdater selectedParish={selectedParish} />
      {Object.entries(parishCoordinates).map(([parish, position]) => {
        const isSelected = selectedParish === parish;
        return (
          <Marker
            key={parish}
            position={position}
            icon={createCustomIcon(isSelected)}
            eventHandlers={{
              click: () => onParishClick(parish),
            }}
          >
            <Popup className="ecj-popupShell">
              <div className="ecj-popup__header">
                <div className="ecj-popup__badge">
                  <MapPin className="ecj-popup__badgeIcon" />
                </div>
                <div>
                  <h3 className="ecj-popup__title">{parish}</h3>
                  <p className="ecj-popup__subtitle">Full coverage available</p>
                </div>
              </div>
              <div className="ecj-popup__body">
                <h4 className="ecj-popup__sectionTitle">Available Services</h4>
                <div className="ecj-popup__grid">
                  <div className="ecj-popup__card">
                    <div className="ecj-popup__cardTop">
                      <div className="ecj-popup__iconWrap">
                        <Camera size={16} />
                      </div>
                      <div className="ecj-popup__cardTitle">Photography</div>
                    </div>
                    <p className="ecj-popup__cardText">Professional photographers available</p>
                  </div>
                  <div className="ecj-popup__card">
                    <div className="ecj-popup__cardTop">
                      <div className="ecj-popup__iconWrap">
                        <Video size={16} />
                      </div>
                      <div className="ecj-popup__cardTitle">Videography</div>
                    </div>
                    <p className="ecj-popup__cardText">4K video production teams</p>
                  </div>
                  <div className="ecj-popup__card">
                    <div className="ecj-popup__cardTop">
                      <div className="ecj-popup__iconWrap">
                        <Music size={16} />
                      </div>
                      <div className="ecj-popup__cardTitle">Audio</div>
                    </div>
                    <p className="ecj-popup__cardText">Professional sound recording</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function JamaicaLeafletMap({ selectedParish, onParishClick }: JamaicaLeafletMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render on client side
  if (!isMounted || typeof window === 'undefined') {
    return (
      <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-2xl overflow-hidden border-2 border-[#755f52]/20 shadow-xl bg-gradient-to-br from-[#f5f1eb] to-[#ebe4d8] flex items-center justify-center">
        <p className="text-[#755f52] font-medium">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-2xl overflow-hidden border-2 border-[#755f52]/20 shadow-xl">
      <MapContainer
        center={[18.1096, -77.2975]} // Center of Jamaica
        zoom={9}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        key="jamaica-map"
      >
        <MapContent selectedParish={selectedParish} onParishClick={onParishClick} />
      </MapContainer>
    </div>
  );
}
