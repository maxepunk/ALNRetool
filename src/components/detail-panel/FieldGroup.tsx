import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FieldGroupProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
  title,
  children,
  collapsible = true,
  defaultOpen = true,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className={cn('space-y-4', className)}>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <div className="space-y-4">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start p-0 h-auto font-semibold text-sm text-muted-foreground uppercase tracking-wider hover:bg-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 mr-2 transition-transform" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-2 transition-transform" />
        )}
        {title}
      </Button>
      
      {isOpen && (
        <div className="space-y-4 pl-6 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};