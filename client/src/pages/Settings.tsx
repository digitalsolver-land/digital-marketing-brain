
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Database,
  Save,
  RefreshCw,
  Bell,
  Globe,
  Trash2,
  UserPlus
} from 'lucide-react';
import { N8nConfigurationPanel } from '@/components/workflows/N8nConfigurationPanel';
import { AppSettings, UserWithRoles, AppRole } from '@/types/workflow';
import { convertAppSettings, convertUserWithRoles } from '@/lib/typeHelpers';

const Settings: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({});
  const [users, setUsers] = useState<UserWithRoles[]>([]);

  useEffect(() => {
    if (user) {
      loadSettings();
      if (isAdmin) {
        loadUsers();
      }
    }
  }, [user, isAdmin]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user?.id)
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

      const usersWithRoles = profilesData?.map(profile => ({
        ...profile,
        roles: rolesData?.filter(role => role.user_id === profile.id).map(r => r.role) || []
      })) || [];

      setUsers(convertUserWithRoles(usersWithRoles));
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <User className="w-4 h-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Database className="w-4 h-4 mr-2" />
            Intégrations
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin">
              <Shield className="w-4 h-4 mr-2" />
              Administration
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Configurez les paramètres de base de votre application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue par défaut</Label>
                  <Select
                    value={settings.default_language || 'fr'}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, default_language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select
                    value={settings.timezone || 'Europe/Paris'}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-backup">Sauvegarde automatique</Label>
                    <p className="text-sm text-gray-600">Activer les sauvegardes automatiques</p>
                  </div>
                  <Switch
                    id="auto-backup"
                    checked={settings.auto_backup || false}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_backup: checked }))}
                  />
                </div>

                {settings.auto_backup && (
                  <div className="space-y-2">
                    <Label htmlFor="backup-frequency">Fréquence de sauvegarde</Label>
                    <Select
                      value={settings.backup_frequency || 'daily'}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, backup_frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button onClick={saveSettings} disabled={loading}>
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-6">
            <N8nConfigurationPanel />
            
            <Card>
              <CardHeader>
                <CardTitle>Autres intégrations</CardTitle>
                <CardDescription>
                  Configurez vos API externes et services tiers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openrouter-api">Clé API OpenRouter</Label>
                  <Input
                    id="openrouter-api"
                    type="password"
                    value={settings.openrouter_api_key || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, openrouter_api_key: e.target.value }))}
                    placeholder="sk-or-..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postiz-api">Clé API Postiz</Label>
                  <Input
                    id="postiz-api"
                    type="password"
                    value={settings.postiz_api_key || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, postiz_api_key: e.target.value }))}
                    placeholder="Clé API Postiz"
                  />
                </div>

                <Button onClick={saveSettings} disabled={loading}>
                  {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notification</CardTitle>
              <CardDescription>
                Gérez vos préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Notifications email</Label>
                  <p className="text-sm text-gray-600">Recevoir des notifications par email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, email_notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications">Notifications SMS</Label>
                  <p className="text-sm text-gray-600">Recevoir des notifications par SMS</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.sms_notifications || false}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sms_notifications: checked }))}
                />
              </div>

              <Button onClick={saveSettings} disabled={loading}>
                {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
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
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
