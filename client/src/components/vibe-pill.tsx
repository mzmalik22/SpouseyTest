import { useState, useEffect } from "react";
import { VibeOption } from "@/lib/types";

interface VibePillProps {
  vibe: VibeOption;
  isSelected: boolean;
  onClick: (vibe: VibeOption) => void;
}

export default function VibePill({ vibe, isSelected, onClick }: VibePillProps) {
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Map vibe.id to emotion colors
  const getEmotionColor = (vibeId: string) => {
    switch(vibeId) {
      case 'affectionate':
        return 'emotion-peaceful';
      case 'concerned':
        return 'emotion-sad';
      case 'apologetic':
        return 'emotion-sad';
      case 'playful':
        return 'emotion-happy';
      case 'excited':
        return 'emotion-happy';
      case 'flirty':
        return 'emotion-happy';
      case 'funny':
        return 'emotion-happy';
      default:
        return 'emotion-happy';
    }
  };

  const emotionClass = getEmotionColor(vibe.id);
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onClick(vibe)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`group flex flex-col items-center justify-center p-3 rounded-lg ${
          isSelected ? 'bg-muted/70 ring-1 ring-primary' : 'hover:bg-muted/30'
        } transition-all duration-200 h-24 w-full`}
      >
        <div className={`emotion-circle ${isSelected ? emotionClass : 'border-white bg-transparent'} mb-2 transition-all duration-200`}>
          <i className={`fas ${vibe.icon} ${isSelected ? 'text-black' : 'text-white'} text-lg`}></i>
        </div>
        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
          {vibe.name}
        </span>
      </button>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 w-56 px-3 py-2 -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full bg-black/90 rounded-md shadow-lg border border-border">
          <p className="text-xs text-white">{vibe.description}</p>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-black/90 border-t border-l border-border"></div>
        </div>
      )}
    </div>
  );
}
