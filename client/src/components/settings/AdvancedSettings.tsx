
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Save,
  RefreshCw,
  UserPlus,
  Trash2
} from 'lucide-react';
import { AppSettings, UserWithRoles, AppRole } from '@/types/workflow';
import { convertAppSettings, convertUserWithRoles } from '@/lib/typeHelpers';

const AdvancedSettings: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({});
  const [users, setUsers] = useState<UserWithRoles[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
      if (isAdmin) {
        loadUsers();
      }
    }
  }, [user, isAdmin]);

  const loadSettings = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur chargement paramètres:', error);
        return;
      }

      if (data) {
        setSettings(convertAppSettings(data));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name');

      if (profilesError) {
        console.error('Erreur chargement profils:', profilesError);
        return;
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Erreur chargement rôles:', rolesError);
        return;
      }

      const usersWithRoles = (profilesData || []).map(profile => ({
        ...profile,
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined,
        roles: (rolesData || []).filter(role => role.user_id === profile.id).map(r => r.role) || []
      }));

      setUsers(convertUserWithRoles(usersWithRoles));
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const saveSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erreur sauvegarde:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de sauvegarder les paramètres",
        });
        return;
      }

      toast({
        title: "Paramètres sauvegardés ✅",
        description: "Vos paramètres ont été mis à jour avec succès",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role as AppRole
        });

      if (error) {
        console.error('Erreur assignation rôle:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible d'assigner le rôle",
        });
        return;
      }

      toast({
        title: "Rôle assigné",
        description: `Le rôle ${role} a été assigné avec succès`,
      });

      loadUsers();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as AppRole);

      if (error) {
        console.error('Erreur suppression rôle:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de supprimer le rôle",
        });
        return;
      }

      toast({
        title: "Rôle supprimé",
        description: `Le rôle ${role} a été supprimé avec succès`,
      });

      loadUsers();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accès restreint</CardTitle>
          <CardDescription>
            Vous n'avez pas les permissions pour accéder aux paramètres avancés.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Paramètres système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>Paramètres système</span>
          </CardTitle>
          <CardDescription>
            Configuration avancée du système
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rétention des données (jours)</Label>
              <Input
                type="number"
                value={settings.data_retention_days || 90}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  data_retention_days: parseInt(e.target.value) 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Workflows maximum par utilisateur</Label>
              <Input
                type="number"
                value={settings.max_workflows || 50}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  max_workflows: parseInt(e.target.value) 
                }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Sauvegarde automatique</Label>
              <p className="text-sm text-gray-600">Activer les sauvegardes automatiques</p>
            </div>
            <Switch
              checked={settings.auto_backup || false}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_backup: checked }))}
            />
          </div>

          <Button onClick={saveSettings} disabled={loading}>
            {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </CardContent>
      </Card>

      {/* Gestion des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Gestion des utilisateurs</span>
          </CardTitle>
          <CardDescription>
            Gérez les utilisateurs et leurs rôles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((userItem) => (
              <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">
                    {userItem.first_name} {userItem.last_name}
                  </h4>
                  <p className="text-sm text-gray-600">{userItem.email}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {userItem.roles.map((role) => (
                    <Badge 
                      key={role} 
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeRole(userItem.id, role)}
                    >
                      {role} ×
                    </Badge>
                  ))}
                  <Select onValueChange={(value) => assignRole(userItem.id, value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="+ Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSettings;
