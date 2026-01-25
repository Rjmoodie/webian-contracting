import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/styles/leaflet-custom.css';

interface Parish {
  name: string;
  lat: number;
  lng: number;
  capital: string;
}

interface JamaicaLeafletMapProps {
  selectedParish: string | null;
  onParishClick: (parish: string) => void;
}

// Approximate coordinates for each parish capital in Jamaica
const parishes: Parish[] = [
  { name: 'Kingston', lat: 17.9714, lng: -76.7931, capital: 'Kingston' },
  { name: 'St. Andrew', lat: 18.0179, lng: -76.7313, capital: 'Half Way Tree' },
  { name: 'St. Thomas', lat: 17.9823, lng: -76.3498, capital: 'Morant Bay' },
  { name: 'Portland', lat: 18.1836, lng: -76.4512, capital: 'Port Antonio' },
  { name: 'St. Mary', lat: 18.4077, lng: -76.9430, capital: 'Port Maria' },
  { name: 'St. Ann', lat: 18.4147, lng: -77.1987, capital: "St. Ann's Bay" },
  { name: 'Trelawny', lat: 18.4742, lng: -77.5634, capital: 'Falmouth' },
  { name: 'St. James', lat: 18.4762, lng: -77.9191, capital: 'Montego Bay' },
  { name: 'Hanover', lat: 18.4044, lng: -78.1332, capital: 'Lucea' },
  { name: 'Westmoreland', lat: 18.2670, lng: -78.1339, capital: 'Savanna-la-Mar' },
  { name: 'St. Elizabeth', lat: 18.0106, lng: -77.7575, capital: 'Black River' },
  { name: 'Manchester', lat: 18.0413, lng: -77.5057, capital: 'Mandeville' },
  { name: 'Clarendon', lat: 17.9654, lng: -77.2385, capital: 'May Pen' },
  { name: 'St. Catherine', lat: 18.0009, lng: -77.0000, capital: 'Spanish Town' },
];

export default function JamaicaLeafletMap({ selectedParish, onParishClick }: JamaicaLeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Initialize map with custom styles
      const map = L.map(mapRef.current, {
        zoomControl: false, // We'll add custom zoom controls
        attributionControl: true,
      }).setView([18.1096, -77.2975], 9);
      
      mapInstanceRef.current = map;

      // Add custom zoom control in bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // Add tile layer with custom styling
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        className: 'map-tiles',
      }).addTo(map);

      // Create custom icon function with enhanced design
      const createCustomIcon = (isSelected: boolean) => {
        return L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-wrapper">
              <div class="marker-pulse ${isSelected ? 'selected' : ''}"></div>
              <div class="marker-icon ${isSelected ? 'selected' : ''}">
                <div class="marker-inner"></div>
              </div>
            </div>
            <style>
              .marker-wrapper {
                position: relative;
                width: 40px;
                height: 40px;
              }
              .marker-pulse {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 40px;
                height: 40px;
                margin: -20px 0 0 -20px;
                border-radius: 50%;
                background-color: rgba(117, 95, 82, 0.2);
                animation: pulse 2s infinite;
              }
              .marker-pulse.selected {
                background-color: rgba(176, 221, 22, 0.3);
                animation: pulse-selected 2s infinite;
              }
              .marker-icon {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 32px;
                height: 32px;
                margin: -16px 0 0 -16px;
                background: linear-gradient(135deg, #755f52 0%, #8b7263 100%);
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .marker-icon:hover {
                transform: scale(1.15);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.3);
              }
              .marker-icon.selected {
                background: linear-gradient(135deg, #B0DD16 0%, #9ac514 100%);
                border-color: white;
                transform: scale(1.2);
                box-shadow: 0 6px 20px rgba(176, 221, 22, 0.5), 0 3px 8px rgba(0, 0, 0, 0.3);
              }
              .marker-inner {
                width: 14px;
                height: 14px;
                background-color: white;
                border-radius: 50%;
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
              }
              @keyframes pulse {
                0%, 100% {
                  transform: scale(0.8);
                  opacity: 0.6;
                }
                50% {
                  transform: scale(1.2);
                  opacity: 0.3;
                }
              }
              @keyframes pulse-selected {
                0%, 100% {
                  transform: scale(0.8);
                  opacity: 0.8;
                }
                50% {
                  transform: scale(1.3);
                  opacity: 0.4;
                }
              }
            </style>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
        });
      };

      // Add markers for each parish with enhanced popups
      parishes.forEach((parish) => {
        const marker = L.marker([parish.lat, parish.lng], {
          icon: createCustomIcon(false),
        }).addTo(map);

        // Enhanced popup HTML with services
        marker.bindPopup(`
          <div class="custom-popup">
            <div class="popup-header">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; background-color: #B0DD16; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <svg style="width: 24px; height: 24px; color: white;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: white; line-height: 1.2;">${parish.name}</h3>
                  <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.9); margin-top: 2px;">Full coverage available</p>
                </div>
              </div>
            </div>
            
            <div style="padding: 20px; background: white;">
              <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #755f52;">Commonly requested services</h4>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
                <div style="background: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 12px; padding: 12px; text-align: left;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <svg style="width: 18px; height: 18px; color: #755f52; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
                    </svg>
                    <h5 style="margin: 0; font-size: 13px; font-weight: 600; color: #333;">Photography</h5>
                  </div>
                  <p style="margin: 0; font-size: 11px; color: #666; line-height: 1.4;">Professional photographers available</p>
                </div>
                
                <div style="background: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 12px; padding: 12px; text-align: left;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <svg style="width: 18px; height: 18px; color: #755f52; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                    </svg>
                    <h5 style="margin: 0; font-size: 13px; font-weight: 600; color: #333;">Videography</h5>
                  </div>
                  <p style="margin: 0; font-size: 11px; color: #666; line-height: 1.4;">4K video production teams</p>
                </div>
                
                <div style="background: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 12px; padding: 12px; text-align: left;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <svg style="width: 18px; height: 18px; color: #755f52; flex-shrink: 0;" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/>
                    </svg>
                    <h5 style="margin: 0; font-size: 13px; font-weight: 600; color: #333;">Audio</h5>
                  </div>
                  <p style="margin: 0; font-size: 11px; color: #666; line-height: 1.4;">Professional sound recording</p>
                </div>
              </div>
              
              <button 
                class="popup-button"
                onclick="window.dispatchEvent(new CustomEvent('parishClick', { detail: '${parish.name}' }))">
                Book Services in ${parish.name}
              </button>
            </div>
          </div>
        `);

        // Handle marker click
        marker.on('click', () => {
          onParishClick(parish.name === selectedParish ? '' : parish.name);
        });

        markersRef.current.set(parish.name, marker);
      });

      // Handle popup button clicks
      const handleParishClick = (e: any) => {
        const parishName = e.detail;
        onParishClick(parishName);
      };
      window.addEventListener('parishClick', handleParishClick);

      // Cleanup
      return () => {
        window.removeEventListener('parishClick', handleParishClick);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, []);

  // Update marker icons when selectedParish changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const createCustomIcon = (isSelected: boolean) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-wrapper">
            <div class="marker-pulse ${isSelected ? 'selected' : ''}"></div>
            <div class="marker-icon ${isSelected ? 'selected' : ''}">
              <div class="marker-inner"></div>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });
    };

    // Update all marker icons
    markersRef.current.forEach((marker, parishName) => {
      marker.setIcon(createCustomIcon(parishName === selectedParish));
    });

    // Zoom to selected parish
    if (selectedParish) {
      const parish = parishes.find(p => p.name === selectedParish);
      if (parish && typeof parish.lat === 'number' && typeof parish.lng === 'number' && 
          !isNaN(parish.lat) && !isNaN(parish.lng)) {
        mapInstanceRef.current.flyTo([parish.lat, parish.lng], 10, {
          duration: 1.5,
        });
      }
    } else {
      mapInstanceRef.current.flyTo([18.1096, -77.2975], 9, {
        duration: 1.5,
      });
    }
  }, [selectedParish]);

  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl" style={{
      background: 'linear-gradient(135deg, #755f52 0%, #8b7263 100%)',
      padding: '6px',
    }}>
      <div className="w-full h-full rounded-2xl overflow-hidden bg-white">
        <div ref={mapRef} className="w-full h-full" />

        {/* Enhanced Legend */}
        <div className="absolute bottom-6 right-6 bg-white/98 backdrop-blur-md px-5 py-4 rounded-2xl shadow-2xl border border-[#755f52]/10 z-[1000]">
          <h4 className="text-xs font-bold text-[#755f52] mb-3 uppercase tracking-wider">Legend</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-7 h-7">
                <div className="absolute inset-0 bg-[#755f52] border-2 border-white rounded-full shadow-lg"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
              </div>
              <span className="text-sm text-gray-700 font-medium">Available Parish</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-7 h-7">
                <div className="absolute inset-0 bg-[#B0DD16] border-2 border-white rounded-full shadow-lg"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
              </div>
              <span className="text-sm text-gray-700 font-medium">Selected Parish</span>
            </div>
          </div>
        </div>

        {/* Enhanced Coverage Badge */}
        <div className="absolute top-6 left-6 z-[1000]">
          <div className="bg-[#B0DD16] text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-3 border-2 border-white/20">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="text-xs opacity-90">Full Island Coverage</div>
              <div className="text-base font-extrabold">14 Parishes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}