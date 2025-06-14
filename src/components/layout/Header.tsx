
import React from 'react';
import { Bell, Search, Sun, Moon, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  activeSection: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeSection, 
  isDarkMode, 
  onToggleDarkMode 
}) => {
  const getSectionTitle = (section: string) => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard Principal',
      workflows: 'Gestionnaire de Workflows',
      'ai-chat': 'Assistant IA',
      content: 'Générateur de Contenu',
      analytics: 'Analytics & Performance',
      campaigns: 'Gestion des Campagnes',
      social: 'Automatisation Sociale',
      competitors: 'Surveillance Concurrentielle',
      calendar: 'Planning & Calendrier',
      data: 'Base de Données',
      settings: 'Paramètres'
    };
    return titles[section] || 'Dashboard';
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Section Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {getSectionTitle(activeSection)}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Plateforme de Marketing Digital Intégré
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Rechercher workflows, campagnes, métriques..."
              className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" onClick={onToggleDarkMode}>
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium">Admin</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
