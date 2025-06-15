
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Key, 
  Users, 
  Globe, 
  Bell, 
  Database, 
  Save,
  Eye,
  EyeOff,
  Shield,
  Trash2
} from 'lucide-react';

interface AppSettings {
  n8n_api_key?: string;
  openrouter_api_key?: string;
  google_analytics_api?: string;
  google_search_console_api?: string;
  google_ads_api?: string;
  facebook_api?: string;
  twitter_api?: string;
  linkedin_api?: string;
  instagram_api?: string;
  default_language: string;
  timezone: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  auto_backup: boolean;
  backup_frequency: string;
  max_workflows: number;
  data_retention_days: number;
}

interface UserWithRole {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
}

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({});
  const [settings, setSettings] = useState<AppSettings>({
    default_language: 'fr',
    timezone: 'Europe/Paris',
    email_notifications: true,
    sms_notifications: false,
    auto_backup: true,
    backup_frequency: 'daily',
    max_workflows: 50,
    data_retention_days: 90
  });
  const [users, setUsers] = useState<UserWithRole[]>([]);

  useEffect(() => {
    fetchSettings();
    if (isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name');

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profilesData.map(profile => ({
        ...profile,
        roles: rolesData.filter(role => role.user_id === profile.id).map(role => role.role)
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ ...settings, user_id: user.id });

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres ont été mis à jour avec succès.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Supprimer tous les rôles existants
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Ajouter le nouveau rôle
      if (newRole !== 'user') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast({
        title: "Rôle mis à jour",
        description: "Le rôle de l'utilisateur a été modifié avec succès.",
      });

      fetchUsers(); // Refresh users list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    return showApiKeys[key] ? key : key.substring(0, 8) + '•••••••••••••••••';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-600 mt-2">Configurez votre application et gérez vos intégrations</p>
      </div>

      <Tabs defaultValue="apis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="apis">
            <Key className="w-4 h-4 mr-2" />
            APIs
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Préférences
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
          )}
        </TabsList>

        {/* Onglet APIs */}
        <TabsContent value="apis">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Intégrations IA</CardTitle>
                <CardDescription>
                  Configurez vos clés API pour les services d'intelligence artificielle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openrouter_api">OpenRouter API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="openrouter_api"
                      type={showApiKeys.openrouter ? "text" : "password"}
                      value={maskApiKey(settings.openrouter_api_key || '')}
                      onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
                      placeholder="or-v1-xxxxxxxxxxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => toggleApiKeyVisibility('openrouter')}
                    >
                      {showApiKeys.openrouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automatisation</CardTitle>
                <CardDescription>
                  Configurez n8n pour l'automatisation des workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="n8n_api">n8n API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="n8n_api"
                      type={showApiKeys.n8n ? "text" : "password"}
                      value={maskApiKey(settings.n8n_api_key || '')}
                      onChange={(e) => setSettings({ ...settings, n8n_api_key: e.target.value })}
                      placeholder="n8n_api_xxxxxxxxxxxxxxxxxxxxx"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => toggleApiKeyVisibility('n8n')}
                    >
                      {showApiKeys.n8n ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Google Services</CardTitle>
                <CardDescription>
                  Intégrations avec les services Google
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google_analytics">Google Analytics API</Label>
                  <Input
                    id="google_analytics"
                    type={showApiKeys.ga ? "text" : "password"}
                    value={maskApiKey(settings.google_analytics_api || '')}
                    onChange={(e) => setSettings({ ...settings, google_analytics_api: e.target.value })}
                    placeholder="GA API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google_ads">Google Ads API</Label>
                  <Input
                    id="google_ads"
                    type={showApiKeys.gads ? "text" : "password"}
                    value={maskApiKey(settings.google_ads_api || '')}
                    onChange={(e) => setSettings({ ...settings, google_ads_api: e.target.value })}
                    placeholder="Google Ads API Key"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Réseaux Sociaux</CardTitle>
                <CardDescription>
                  Clés API pour les plateformes sociales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook_api">Facebook API</Label>
                  <Input
                    id="facebook_api"
                    type={showApiKeys.fb ? "text" : "password"}
                    value={maskApiKey(settings.facebook_api || '')}
                    onChange={(e) => setSettings({ ...settings, facebook_api: e.target.value })}
                    placeholder="Facebook API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_api">LinkedIn API</Label>
                  <Input
                    id="linkedin_api"
                    type={showApiKeys.linkedin ? "text" : "password"}
                    value={maskApiKey(settings.linkedin_api || '')}
                    onChange={(e) => setSettings({ ...settings, linkedin_api: e.target.value })}
                    placeholder="LinkedIn API Key"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Préférences */}
        <TabsContent value="preferences">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Préférences générales</CardTitle>
                <CardDescription>
                  Configurez vos préférences d'utilisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue par défaut</Label>
                  <Select
                    value={settings.default_language}
                    onValueChange={(value) => setSettings({ ...settings, default_language: value })}
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
                    value={settings.timezone}
                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limites et quotas</CardTitle>
                <CardDescription>
                  Configurez les limites d'utilisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max_workflows">Nombre maximum de workflows</Label>
                  <Input
                    id="max_workflows"
                    type="number"
                    value={settings.max_workflows}
                    onChange={(e) => setSettings({ ...settings, max_workflows: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_retention">Rétention des données (jours)</Label>
                  <Input
                    id="data_retention"
                    type="number"
                    value={settings.data_retention_days}
                    onChange={(e) => setSettings({ ...settings, data_retention_days: parseInt(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notification</CardTitle>
              <CardDescription>
                Gérez vos préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications par email</Label>
                  <p className="text-sm text-slate-600">
                    Recevez des notifications par email pour les événements importants
                  </p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sauvegarde automatique</Label>
                  <p className="text-sm text-slate-600">
                    Sauvegarde automatique de vos données
                  </p>
                </div>
                <Switch
                  checked={settings.auto_backup}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_backup: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup_frequency">Fréquence de sauvegarde</Label>
                <Select
                  value={settings.backup_frequency}
                  onValueChange={(value) => setSettings({ ...settings, backup_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Utilisateurs (Admin uniquement) */}
        {isAdmin && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des utilisateurs</CardTitle>
                <CardDescription>
                  Gérez les rôles et permissions des utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                        <div className="flex gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} variant="outline">
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">user</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.roles[0] || 'user'}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Utilisateur</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
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

      <div className="flex justify-end mt-6">
        <Button onClick={saveSettings} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
