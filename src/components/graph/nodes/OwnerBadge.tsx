import { memo } from 'react';
import { cn } from '@/lib/utils';
import { HOVER_TRANSITIONS } from '@/lib/animations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OwnerBadgeProps {
  /** Character name to display */
  characterName?: string;
  /** Character tier for visual styling */
  tier?: 'Tier 1' | 'Tier 2' | 'Tier 3';
  /** Optional portrait URL (future enhancement) */
  portraitUrl?: string;
  /** Position variant for absolute positioning when used standalone */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Whether to use absolute positioning (default false for slot usage) */
  useAbsolutePosition?: boolean;
}

/**
 * Owner badge component that displays character portrait or initials
 * Overlays on element nodes to show ownership at a glance
 */
const OwnerBadge = memo(({ 
  characterName, 
  tier = 'Tier 3',
  portraitUrl,
  position = 'top-right',
  useAbsolutePosition = false
}: OwnerBadgeProps) => {
  if (!characterName) return null;
  
  // Extract initials from character name
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      const firstWord = words[0];
      return firstWord ? firstWord.substring(0, 2).toUpperCase() : '';
    }
    return words
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };
  
  const initials = getInitials(characterName);
  
  // Position classes for absolute positioning
  const positionClasses = useAbsolutePosition ? {
    'top-right': 'absolute top-0 right-0 -translate-y-1/3 translate-x-1/3',
    'top-left': 'absolute top-0 left-0 -translate-y-1/3 -translate-x-1/3',
    'bottom-right': 'absolute bottom-0 right-0 translate-y-1/3 translate-x-1/3',
    'bottom-left': 'absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3'
  } : {
    'top-right': '',
    'top-left': '',
    'bottom-right': '',
    'bottom-left': ''
  };
  
  // Tier-based styling with improved contrast and animations
  const tierStyles = {
    'Tier 1': {
      wrapper: 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-700 text-white border-[2.5px] shadow-sm',
      hoverGlow: 'hover:shadow-amber-400/50',
      pulseColor: 'animate-pulse-glow'
    },
    'Tier 2': {
      wrapper: 'bg-gradient-to-br from-indigo-500 to-indigo-700 border-indigo-800 text-white shadow-sm',
      hoverGlow: 'hover:shadow-indigo-400/50',
      pulseColor: ''
    },
    'Tier 3': {
      wrapper: 'bg-gradient-to-br from-gray-500 to-gray-700 border-gray-800 text-white shadow-sm',
      hoverGlow: 'hover:shadow-gray-400/50',
      pulseColor: ''
    }
  };
  
  const tierStyle = tierStyles[tier];
  
  return (
    <div className="relative group inline-block">
      <Avatar
        className={cn(
          'w-7 h-7 border-2', // Base size and border
          'text-xs font-semibold cursor-help',
          'transition-all duration-200',
          HOVER_TRANSITIONS.scale,
          'hover:shadow-lg hover:z-10',
          positionClasses[position],
          tierStyle.wrapper,
          tierStyle.hoverGlow,
          tier === 'Tier 1' && tierStyle.pulseColor,
          'group'
        )}
        title={`Owner: ${characterName} (${tier})`}
      >
        <AvatarImage
          src={portraitUrl}
          alt={characterName}
          className="transition-transform duration-200 group-hover:scale-105"
        />
        <AvatarFallback className="bg-transparent tracking-tighter transition-transform duration-200 group-hover:scale-110">
          {initials}
        </AvatarFallback>
      </Avatar>
      {/* CSS-only tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                      hidden group-hover:block
                      bg-primary text-primary-foreground
                      rounded-md px-2 py-1 text-xs
                      whitespace-nowrap pointer-events-none
                      animate-in fade-in-0 zoom-in-95">
        <div>Owner: {characterName}</div>
        <div className="text-xs opacity-80">{tier}</div>
      </div>
    </div>
  );
});

OwnerBadge.displayName = 'OwnerBadge';

export default OwnerBadge;