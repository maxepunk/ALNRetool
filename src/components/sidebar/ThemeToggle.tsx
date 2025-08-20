/**
 * ThemeToggle Component
 * Theme switching functionality with proper React patterns
 */

import { memo, useCallback, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface ThemeToggleProps {
  isOpen: boolean;
}

export const ThemeToggle = memo(function ThemeToggle({ isOpen }: ThemeToggleProps) {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  // Apply theme to document root using Effect (React pattern)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleThemeToggle = useCallback((checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  }, [setTheme]);

  const handleThemeButtonClick = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  if (!isOpen) {
    return (
      <div className="px-3 py-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={handleThemeButtonClick}
          className="w-full"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          aria-label={`Current theme: ${theme}. Click to switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 border-t">
      <div className="flex items-center justify-between">
        <Label htmlFor="theme-toggle" className="text-sm cursor-pointer">
          Dark Mode
        </Label>
        <Switch
          id="theme-toggle"
          checked={theme === 'dark'}
          onCheckedChange={handleThemeToggle}
          aria-label={`Dark mode is ${theme === 'dark' ? 'enabled' : 'disabled'}`}
        />
      </div>
    </div>
  );
});