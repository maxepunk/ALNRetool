/**
 * CollapsibleSection Component
 * Wrapper for filter sections with expand/collapse, icons, and active filter badges
 */

import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent 
} from '@/components/ui/collapsible';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  activeCount?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  activeCount = 0,
  defaultOpen = true,
  children,
  className
}: CollapsibleSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("space-y-2", className)}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span className="text-sm font-medium">{title}</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeCount}
            </Badge>
          )}
        </div>
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}