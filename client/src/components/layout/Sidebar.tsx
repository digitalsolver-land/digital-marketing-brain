import React, { useState } from 'react';
import { 
  BarChart3, 
  Workflow, 
  MessageSquare, 
  FileText, 
  Target, 
  Users, 
  Settings, 
  Search,
  TrendingUp,
  Calendar,
  Database,
  Brain,
  Menu,
  X,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-blue-500' },
  { id: 'workflows', label: 'Workflows n8n', icon: Workflow, color: 'text-purple-500' },
  { id: 'ai-chat', label: 'IA Assistant', icon: Brain, color: 'text-green-500' },
  { id: 'content', label: 'Générateur Contenu', icon: FileText, color: 'text-orange-500' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'text-indigo-500' },
  { id: 'whatsapp', label: 'WhatsApp Business', icon: MessageCircle, color: 'text-green-600' },
  { id: 'campaigns', label: 'Campagnes', icon: Target, color: 'text-red-500' },
  { id: 'social', label: 'Réseaux Sociaux', icon: Users, color: 'text-pink-500' },
  { id: 'competitors', label: 'Concurrents', icon: Search, color: 'text-yellow-500' },
  { id: 'calendar', label: 'Planning', icon: Calendar, color: 'text-cyan-500' },
  { id: 'data', label: 'Base de Données', icon: Database, color: 'text-gray-500' },
  { id: 'settings', label: 'Paramètres', icon: Settings, color: 'text-slate-500' }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col h-full",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">MarketingAI</h1>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-slate-700 text-white shadow-lg" 
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? item.color : "")} />
              {!isCollapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      {!isCollapsed && (
        <div className="p-4 flex-shrink-0">
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Utilisateur</p>
                <p className="text-xs text-slate-400 truncate">admin@marketing.ai</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
