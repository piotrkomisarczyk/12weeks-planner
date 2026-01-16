import { LogOut, Settings, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabaseClient } from '@/db/supabase.client';

interface UserMenuProps {
  userEmail?: string;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        toast.error('Failed to log out', {
          description: error.message,
        });
      } else {
        // Redirect to home/login page
        window.location.href = '/';
      }
    } catch (error) {
      toast.error('Failed to log out', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleExportData = () => {
    // Placeholder for export functionality
    toast.info('Export feature coming soon');
  };

  const handleSettings = () => {
    // Placeholder for settings functionality
    toast.info('Settings feature coming soon');
  };

  // Get initials from email
  const getInitials = (email?: string): string => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label="User menu"
        >
          <Avatar className="size-9">
            <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">My Account</p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSettings}>
          <Settings className="mr-2 size-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportData}>
          <Download className="mr-2 size-4" />
          <span>Export data</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 size-4" />
          <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
