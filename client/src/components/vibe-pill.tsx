import { useState, useEffect } from "react";
import { VibeOption } from "@/lib/types";

interface VibePillProps {
  vibe: VibeOption;
  isSelected: boolean;
  onClick: (vibe: VibeOption) => void;
}

export default function VibePill({ vibe, isSelected, onClick }: VibePillProps) {
  const [mounted, setMounted] = useState(false);

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
    <button
      type="button"
      onClick={() => onClick(vibe)}
      className={`group flex items-center gap-2 px-2 py-1 rounded-md ${isSelected ? 'bg-muted/50' : 'hover:bg-muted/30'} transition-colors duration-200`}
    >
      <div className={`emotion-circle ${isSelected ? emotionClass : 'border-white bg-transparent'} transition-all duration-200`}>
        <i className={`fas ${vibe.icon} ${isSelected ? 'text-black' : 'text-white'} text-xs`}></i>
      </div>
      <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
        {vibe.name}
      </span>
    </button>
  );
}
