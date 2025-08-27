import { Plus, User, Package, Puzzle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCreationStore } from '@/stores/creationStore';
import { zIndex } from '@/config/zIndex';

interface FloatingActionButtonProps {
  hidden?: boolean;
}

export function FloatingActionButton({ hidden }: FloatingActionButtonProps) {
  const { openCreatePanel } = useCreationStore();
  
  if (hidden) return null;

  return (
    <div className="fixed top-20 right-6" style={{ zIndex: zIndex.fab }}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            size="lg" 
            className="rounded-full h-14 w-14 shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" style={{ zIndex: zIndex.fabDropdown }}>
          <DropdownMenuItem onClick={() => {
            console.log('[FAB] Creating character');
            openCreatePanel('character', { sourceComponent: 'fab' });
          }}>
            <User className="mr-2 h-4 w-4" />
            <span>New Character</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            console.log('[FAB] Creating element');
            openCreatePanel('element', { sourceComponent: 'fab' });
          }}>
            <Package className="mr-2 h-4 w-4" />
            <span>New Element</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            console.log('[FAB] Creating puzzle');
            openCreatePanel('puzzle', { sourceComponent: 'fab' });
          }}>
            <Puzzle className="mr-2 h-4 w-4" />
            <span>New Puzzle</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            console.log('[FAB] Creating timeline event');
            openCreatePanel('timeline', { sourceComponent: 'fab' });
          }}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>New Timeline Event</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}