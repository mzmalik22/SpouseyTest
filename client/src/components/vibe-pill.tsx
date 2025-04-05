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

  return (
    <button
      type="button"
      onClick={() => onClick(vibe)}
      className={`vibe-pill flex items-center px-3 py-1.5 rounded-full text-sm font-medium
        ${isSelected
          ? `border-primary text-primary bg-white hover:bg-primary-light hover:bg-opacity-10`
          : `bg-white border border-neutral-200 hover:border-primary`
        } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200`}
    >
      <i className={`fas ${vibe.icon} ${vibe.color} mr-1.5`}></i>
      <span>{vibe.name}</span>
    </button>
  );
}
