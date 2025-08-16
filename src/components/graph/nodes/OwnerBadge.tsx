import { memo, useState } from 'react';
import styles from './OwnerBadge.module.css';

interface OwnerBadgeProps {
  /** Character name to display */
  characterName?: string;
  /** Character tier for visual styling */
  tier?: 'Tier 1' | 'Tier 2' | 'Tier 3';
  /** Optional portrait URL (future enhancement) */
  portraitUrl?: string;
  /** Position variant */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Owner badge component that displays character portrait or initials
 * Overlays on element nodes to show ownership at a glance
 */
const OwnerBadge = memo(({ 
  characterName, 
  tier = 'Tier 3',
  portraitUrl,
  position = 'top-right' 
}: OwnerBadgeProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  
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
  const tierClass = `tier-${tier.toLowerCase().replace(/\s+/g, '-')}`;
  const positionClass = `position-${position}`;
  
  return (
    <div 
      className={`${styles.ownerBadge} ${styles[tierClass]} ${styles[positionClass]}`}
      title={`Owner: ${characterName} (${tier})`}
    >
      {portraitUrl && !imageFailed ? (
        <img 
          src={portraitUrl} 
          alt={characterName}
          className={styles.portrait}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={styles.initials}>
          {initials}
        </span>
      )}
    </div>
  );
});

OwnerBadge.displayName = 'OwnerBadge';

export default OwnerBadge;