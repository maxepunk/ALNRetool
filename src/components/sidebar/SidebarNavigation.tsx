/**
 * SidebarNavigation Component
 * Dynamic navigation for view switching
 */

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Network, Puzzle, Users, Clock, Star } from 'lucide-react';

interface SidebarNavigationProps {
  isOpen: boolean;
}

export function SidebarNavigation({ isOpen }: SidebarNavigationProps) {
  const location = useLocation();
  
  // View navigation items based on viewConfigs
  const navItems = [
    {
      id: 'full-graph',
      path: '/graph/full-graph',
      label: 'Full Graph',
      icon: Network,
      description: 'Complete view of all entities and relationships'
    },
    {
      id: 'puzzles-only',
      path: '/graph/puzzles-only',
      label: 'Puzzle Network',
      icon: Puzzle,
      description: 'Focus on puzzle dependencies and rewards'
    },
    {
      id: 'character-relations',
      path: '/graph/character-relations',
      label: 'Character Relationships',
      icon: Users,
      description: 'Character and element connections'
    },
    {
      id: 'timeline-flow',
      path: '/graph/timeline-flow',
      label: 'Timeline',
      icon: Clock,
      description: 'Chronological event flow'
    },
    {
      id: 'core-experience',
      path: '/graph/core-experience',
      label: 'Core Experience',
      icon: Star,
      description: 'Essential puzzles and characters only'
    }
  ];

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
            key={item.id}
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
                {item.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </div>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}