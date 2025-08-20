/**
 * SidebarNavigation Component
 * Handles main navigation items in the sidebar
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Network, 
  Users, 
  CheckSquare, 
  Clock
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const navItems: NavItem[] = [
  {
    path: '/puzzles',
    label: 'Puzzle Focus',
    icon: Network,
    description: 'Visualize puzzle dependencies and rewards'
  },
  {
    path: '/character-journey',
    label: 'Character Journey',
    icon: Users,
    description: 'Track character ownership paths'
  },
  {
    path: '/status',
    label: 'Content Status',
    icon: CheckSquare,
    description: 'Review content completion and issues'
  },
  {
    path: '/timeline',
    label: 'Timeline',
    icon: Clock,
    description: 'View chronological story events'
  }
];

interface SidebarNavigationProps {
  isOpen: boolean;
}

export function SidebarNavigation({ isOpen }: SidebarNavigationProps) {
  const location = useLocation();

  return (
    <nav 
      className="space-y-1" 
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || 
                        location.pathname.startsWith(`${item.path}/`);
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isActive && 'bg-accent text-accent-foreground font-medium'
            )}
            aria-current={isActive ? 'page' : undefined}
            title={!isOpen ? item.label : undefined}
          >
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {isOpen && (
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {item.description}
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}