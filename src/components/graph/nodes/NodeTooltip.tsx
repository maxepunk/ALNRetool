/**
 * NodeTooltip Component
 * Provides rich tooltip functionality for graph nodes
 * Replaces native browser tooltips with shadcn Tooltip component
 */

import type { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NodeTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  enabled?: boolean;
  className?: string;
}

/**
 * Generic tooltip wrapper for node content
 * Only renders tooltip if enabled and content exists
 */
export function NodeTooltip({ 
  children, 
  content, 
  side = 'top',
  enabled = true,
  className
}: NodeTooltipProps) {
  // Don't render tooltip if disabled or no content
  if (!enabled || !content) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent 
        side={side} 
        className={cn("max-w-xs z-50", className)}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Specialized tooltip for displaying entity lists
 * Shows a formatted list with title and entity names
 */
export function EntityListTooltip({ 
  title, 
  entities, 
  children,
  enabled = true,
  maxItems = 10
}: {
  title: string;
  entities: string[];
  children: ReactNode;
  enabled?: boolean;
  maxItems?: number;
}) {
  // Don't show tooltip if disabled or no entities
  if (!enabled || entities.length === 0) {
    return <>{children}</>;
  }

  return (
    <NodeTooltip
      enabled={enabled}
      content={
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <ul className="text-sm space-y-0.5">
            {entities.slice(0, maxItems).map((name, i) => (
              <li key={i} className="text-muted-foreground">
                • {name}
              </li>
            ))}
            {entities.length > maxItems && (
              <li className="text-muted-foreground italic">
                ...and {entities.length - maxItems} more
              </li>
            )}
          </ul>
        </div>
      }
    >
      {children}
    </NodeTooltip>
  );
}

/**
 * Tooltip for showing detailed text content
 * Used for truncated descriptions, loglines, etc.
 */
export function TextTooltip({
  children,
  text,
  title,
  enabled = true,
  className
}: {
  children: ReactNode;
  text: string;
  title?: string;
  enabled?: boolean;
  className?: string;
}) {
  if (!enabled || !text) {
    return <>{children}</>;
  }

  return (
    <NodeTooltip
      enabled={enabled}
      className={className}
      content={
        <div className="max-w-sm space-y-1">
          {title && <p className="font-semibold">{title}</p>}
          <p className="text-sm whitespace-pre-wrap">{text}</p>
        </div>
      }
    >
      {children}
    </NodeTooltip>
  );
}

/**
 * Tooltip for showing status descriptions
 * Used with badges and status indicators
 */
export function StatusTooltip({
  children,
  status,
  description,
  enabled = true
}: {
  children: ReactNode;
  status: string;
  description?: string;
  enabled?: boolean;
}) {
  if (!enabled || !description) {
    return <>{children}</>;
  }

  return (
    <NodeTooltip
      enabled={enabled}
      content={
        <div className="space-y-1">
          <p className="font-medium capitalize">{status}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      }
    >
      {children}
    </NodeTooltip>
  );
}