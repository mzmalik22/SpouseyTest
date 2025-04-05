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
      case 'compassionate':
        return 'emotion-peaceful';
      case 'direct':
        return 'emotion-angry';
      case 'supportive':
        return 'emotion-sad';
      case 'enthusiastic':
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
      className={`group flex flex-col items-center`}
    >
      <div className={`emotion-circle ${isSelected ? emotionClass : 'border-white bg-transparent'} mb-1.5 transition-all duration-200`}>
        <i className={`fas ${vibe.icon} ${isSelected ? 'text-black' : 'text-white'}`}></i>
      </div>
      <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
        {vibe.name}
      </span>
    </button>
  );
}
