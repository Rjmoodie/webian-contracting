import { MapPin } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import jamaicaMapImage from 'figma:asset/7f8950c56c52dca925d40dbb81dc5bffa4ea6cb0.png';

interface JamaicaMapProps {
  selectedParish: string | null;
  onParishClick: (parish: string) => void;
}

export default function JamaicaMap({ selectedParish, onParishClick }: JamaicaMapProps) {
  // Simplified parish positions (left-to-right, roughly geographically accurate)
  const parishPositions = [
    // East
    { name: 'Portland', left: '85%', top: '30%' },
    { name: 'St. Thomas', left: '90%', top: '55%' },
    { name: 'Kingston', left: '82%', top: '65%' },
    { name: 'St. Andrew', left: '78%', top: '50%' },
    
    // Center-North
    { name: 'St. Mary', left: '70%', top: '25%' },
    { name: 'St. Ann', left: '58%', top: '22%' },
    { name: 'Trelawny', left: '46%', top: '20%' },
    
    // Center-South
    { name: 'St. Catherine', left: '68%', top: '55%' },
    { name: 'Clarendon', left: '58%', top: '60%' },
    { name: 'Manchester', left: '52%', top: '68%' },
    
    // West
    { name: 'St. James', left: '35%', top: '28%' },
    { name: 'Hanover', left: '25%', top: '22%' },
    { name: 'Westmoreland', left: '18%', top: '35%' },
    { name: 'St. Elizabeth', left: '35%', top: '70%' },
  ];

  return (
    <div className="relative w-full aspect-[3/1] bg-gradient-to-br from-[#c9a882]/10 to-[#755f52]/10 rounded-2xl border-4 border-[#755f52] shadow-2xl overflow-hidden">
      
      {/* Actual Jamaica Map Photo Background */}
      <ImageWithFallback 
        src={jamaicaMapImage}
        alt="Map of Jamaica"
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />
      
      {/* Overlay gradient for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#755f52]/30 via-transparent to-[#755f52]/20"></div>
      
      {/* Background island shape */}
      <svg
        viewBox="0 0 1000 400"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Jamaica island shape (simplified) */}
        <path
          d="M 50 180 Q 50 160, 80 150 L 150 140 Q 200 135, 250 125 L 350 115 Q 450 105, 550 110 L 700 120 Q 800 130, 900 140 L 950 145 Q 970 155, 975 175 L 980 190 Q 980 210, 970 220 L 950 235 Q 930 245, 900 250 L 800 255 Q 700 260, 600 260 L 400 260 Q 300 265, 200 250 L 100 235 Q 65 225, 55 205 Z"
          fill="#755f52"
          opacity="0.15"
          stroke="#755f52"
          strokeWidth="3"
        />
        
        {/* Water waves effect */}
        <path
          d="M 0 250 Q 100 240, 200 250 T 400 250 T 600 250 T 800 250 T 1000 250"
          fill="none"
          stroke="#BDFF1C"
          strokeWidth="1"
          opacity="0.3"
        />
        <path
          d="M 0 280 Q 100 270, 200 280 T 400 280 T 600 280 T 800 280 T 1000 280"
          fill="none"
          stroke="#BDFF1C"
          strokeWidth="1"
          opacity="0.2"
        />
      </svg>

      {/* Parish markers */}
      {parishPositions.map((parish) => {
        const isSelected = selectedParish === parish.name;
        return (
          <button
            key={parish.name}
            onClick={() => onParishClick(parish.name)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group ${
              isSelected ? 'z-30 scale-125' : 'z-10 scale-100 hover:scale-110'
            }`}
            style={{ left: parish.left, top: parish.top }}
            title={parish.name}
          >
            {/* Glow effect for selected */}
            {isSelected && (
              <div className="absolute inset-0 bg-[#BDFF1C] rounded-full blur-xl opacity-50 animate-pulse" style={{ width: '60px', height: '60px', top: '-15px', left: '-15px' }}></div>
            )}
            
            {/* Pin icon */}
            <div
              className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all ${
                isSelected
                  ? 'bg-[#BDFF1C] text-white ring-4 ring-[#BDFF1C]/50'
                  : 'bg-white text-[#755f52] border-2 border-[#755f52] group-hover:bg-[#755f52] group-hover:text-white'
              }`}
            >
              <MapPin className="w-5 h-5" fill="currentColor" />
            </div>
            
            {/* Parish label */}
            <div
              className={`absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-bold px-2 py-1 rounded shadow-md transition-all ${
                isSelected
                  ? 'bg-[#BDFF1C] text-white'
                  : 'bg-white text-[#755f52] opacity-0 group-hover:opacity-100'
              }`}
            >
              {parish.name}
            </div>
          </button>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-[#755f52]/20">
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="w-4 h-4 text-[#BDFF1C]" fill="#BDFF1C" />
          <span className="text-[#755f52] font-medium">Click pins to explore</span>
        </div>
      </div>

      {/* Coverage badge */}
      <div className="absolute top-4 left-4 bg-[#BDFF1C] text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Full Island Coverage
      </div>
    </div>
  );
}