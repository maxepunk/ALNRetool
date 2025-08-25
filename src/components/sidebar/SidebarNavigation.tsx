/**
 * SidebarNavigation Component
 * Dynamic navigation using ViewRegistry
 */

import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Network, 
  Users, 
  CheckSquare, 
  Clock,
  Share2,
  FileText
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { viewRegistry } from '@/contexts/ViewContext';
import { RouteUtils } from '@/components/generated/RouteGenerator';

// Icon mapping for view types
const iconMap: Record<string, LucideIcon> = {
  'puzzle-focus': Network,
  'character-journey': Users,
  'node-connections': Share2,
  'content-status': CheckSquare,
  'timeline': Clock,
  'default': FileText
};

interface SidebarNavigationProps {
  isOpen: boolean;
}

export function SidebarNavigation({ isOpen }: SidebarNavigationProps) {
  const location = useLocation();
  
  // Generate navigation items from ViewRegistry
  const navItems = useMemo(() => {
    const views = viewRegistry.getAll();
    return views.map(view => {
      const route = RouteUtils.getRouteForView(view.id);
      return {
        id: view.id,
        path: route?.path || `/${view.id}`,
        label: view.ui?.title || view.name,
        icon: iconMap[view.id] || iconMap.default,
        description: view.ui?.description || view.description || ''
      };
    });
  }, []);

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