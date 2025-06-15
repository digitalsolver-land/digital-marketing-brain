
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Brain, User, Settings, LogOut, Shield } from 'lucide-react';

const Header = () => {
  const { user, profile, userRoles, signOut } = useAuth();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`;
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return user?.email || 'Utilisateur';
  };

  const getPrimaryRole = () => {
    if (userRoles.includes('admin')) return 'admin';
    if (userRoles.includes('commercial')) return 'commercial';
    if (userRoles.includes('client')) return 'client';
    return 'user';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 hover:bg-red-600';
      case 'commercial': return 'bg-blue-500 hover:bg-blue-600';
      case 'client': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-purple-600" />
            <h1 className="text-xl font-bold text-slate-900">Marketing AI</h1>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 p-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage 
                    src={profile?.avatar_url} 
                    alt={getDisplayName()} 
                    key={profile?.updated_at} // Force re-render when profile updates
                  />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex items-center space-x-2">
                  <div className="text-left">
                    <p className="text-sm font-medium">{getDisplayName()}</p>
                    <p className="text-xs text-slate-600">{user.email}</p>
                  </div>
                  <Badge className={`${getRoleBadgeColor(getPrimaryRole())} text-white text-xs`}>
                    {getPrimaryRole()}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{getDisplayName()}</p>
                <p className="text-xs text-slate-600">{user.email}</p>
                <div className="flex gap-1 mt-1">
                  {userRoles.map((role) => (
                    <Badge 
                      key={role} 
                      variant="outline" 
                      className="text-xs"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="w-4 h-4 mr-2" />
                Mon Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
