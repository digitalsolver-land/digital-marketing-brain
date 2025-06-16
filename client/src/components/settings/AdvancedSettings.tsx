import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, Globe, Bell, Users, Shield, Trash2, RefreshCw, Download, Upload, Lock, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AppSettings {
  // API Keys
  n8n_api_key?: string;
  n8n_base_url?: string;
  openrouter_api_key?: string;
  postiz_api_key?: string;
  postiz_api_url?: string;
  google_analytics_api?: string;
  google_search_console_api?: string;
  google_ads_api?: string;
  facebook_api?: string;
  twitter_api?: string;
  linkedin_api?: string;
  instagram_api?: string;
  
  // WhatsApp Settings
  whatsapp_api_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_verify_token?: string;
  whatsapp_ai_enabled?: boolean;
  whatsapp_ai_instructions?: string;
  whatsapp_response_mode?: string;
  
  // General Settings
  default_language?: string;
  timezone?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  auto_backup?: boolean;
  backup_frequency?: string;
  max_workflows?: number;
  data_retention_days?: number;
}

interface UserRole {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
}

export const AdvancedSettings: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>({});
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (user) {
      loadSettings();
    }
    if (isAdmin) {
      loadUsers();
    }
  }, [user, isAdmin]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres",
          variant: "destructive"
        });
      } else if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin) return;

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserRole[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        roles: (roles || [])
          .filter(role => role.user_id === profile.id)
          .map(role => role.role)
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
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

      if (error) throw error;

      toast({
        title: "Paramètres sauvegardés",
        description: "Vos paramètres ont été mis à jour avec succès"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string, action: 'add' | 'remove') => {
    if (!isAdmin) return;

    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        
        if (error) throw error;
      }

      await loadUsers();
      toast({
        title: "Rôle mis à jour",
        description: `Rôle ${role} ${action === 'add' ? 'ajouté' : 'retiré'} avec succès`
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle",
        variant: "destructive"
      });
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export réussi",
      description: "Paramètres exportés en JSON"
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...settings, ...importedSettings });
        toast({
          title: "Import réussi",
          description: "Paramètres importés avec succès"
        });
      } catch (error) {
        toast({
          title: "Erreur d'import",
          description: "Fichier JSON invalide",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSecretField = (key: string, label: string, placeholder?: string) => {
    const isVisible = showSecrets[key];
    return (
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor={key}>{label}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => toggleSecretVisibility(key)}
          >
            {isVisible ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </Button>
        </div>
        <Input
          id={key}
          type={isVisible ? 'text' : 'password'}
          value={(settings as any)[key] || ''}
          onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
          placeholder={placeholder}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Paramètres Avancés
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportSettings}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </Button>
          </div>
          <Button onClick={saveSettings} disabled={loading}>
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Utilisateurs</TabsTrigger>}
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <span>Paramètres Généraux</span>
              </CardTitle>
              <CardDescription>
                Configuration générale de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="default_language">Langue par défaut</Label>
                  <Select
                    value={settings.default_language || 'fr'}
                    onValueChange={(value) => setSettings({ ...settings, default_language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select
                    value={settings.timezone || 'Europe/Paris'}
                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_workflows">Nombre max de workflows</Label>
                  <Input
                    id="max_workflows"
                    type="number"
                    value={settings.max_workflows || 50}
                    onChange={(e) => setSettings({ ...settings, max_workflows: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="data_retention_days">Rétention des données (jours)</Label>
                  <Input
                    id="data_retention_days"
                    type="number"
                    value={settings.data_retention_days || 90}
                    onChange={(e) => setSettings({ ...settings, data_retention_days: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sauvegarde automatique</Label>
                    <p className="text-sm text-slate-500">Sauvegarde automatique des données</p>
                  </div>
                  <Switch
                    checked={settings.auto_backup || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_backup: checked })}
                  />
                </div>

                {settings.auto_backup && (
                  <div>
                    <Label htmlFor="backup_frequency">Fréquence de sauvegarde</Label>
                    <Select
                      value={settings.backup_frequency || 'daily'}
                      onValueChange={(value) => setSettings({ ...settings, backup_frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Chaque heure</SelectItem>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-green-500" />
                <span>Clés API</span>
              </CardTitle>
              <CardDescription>
                Configuration des APIs externes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium">n8n</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderSecretField('n8n_api_key', 'Clé API n8n', 'Votre clé API n8n')}
                    <div>
                      <Label htmlFor="n8n_base_url">URL de base n8n</Label>
                      <Input
                        id="n8n_base_url"
                        value={settings.n8n_base_url || ''}
                        onChange={(e) => setSettings({ ...settings, n8n_base_url: e.target.value })}
                        placeholder="https://your-n8n-instance.com/api/v1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-medium">AI & Content</h3>
                  {renderSecretField('openrouter_api_key', 'OpenRouter API Key', 'sk-or-v1-...')}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-medium">Social Media</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderSecretField('postiz_api_key', 'Postiz API Key')}
                    <div>
                      <Label htmlFor="postiz_api_url">URL API Postiz</Label>
                      <Input
                        id="postiz_api_url"
                        value={settings.postiz_api_url || 'https://api.postiz.com/public/v1'}
                        onChange={(e) => setSettings({ ...settings, postiz_api_url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {renderSecretField('facebook_api', 'Facebook API')}
                    {renderSecretField('twitter_api', 'Twitter API')}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {renderSecretField('linkedin_api', 'LinkedIn API')}
                    {renderSecretField('instagram_api', 'Instagram API')}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-medium">Analytics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderSecretField('google_analytics_api', 'Google Analytics API')}
                    {renderSecretField('google_search_console_api', 'Google Search Console API')}
                  </div>
                  {renderSecretField('google_ads_api', 'Google Ads API')}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-green-600" />
                <span>WhatsApp Business</span>
              </CardTitle>
              <CardDescription>
                Configuration de l'intégration WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {renderSecretField('whatsapp_api_token', 'Token API WhatsApp')}
                {renderSecretField('whatsapp_phone_number_id', 'ID du numéro de téléphone')}
              </div>
              
              {renderSecretField('whatsapp_verify_token', 'Token de vérification')}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>IA activée pour WhatsApp</Label>
                    <p className="text-sm text-slate-500">Réponses automatiques avec IA</p>
                  </div>
                  <Switch
                    checked={settings.whatsapp_ai_enabled || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, whatsapp_ai_enabled: checked })}
                  />
                </div>

                {settings.whatsapp_ai_enabled && (
                  <>
                    <div>
                      <Label htmlFor="whatsapp_response_mode">Mode de réponse</Label>
                      <Select
                        value={settings.whatsapp_response_mode || 'auto'}
                        onValueChange={(value) => setSettings({ ...settings, whatsapp_response_mode: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automatique</SelectItem>
                          <SelectItem value="manual">Manuel</SelectItem>
                          <SelectItem value="hybrid">Hybride</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="whatsapp_ai_instructions">Instructions pour l'IA</Label>
                      <Textarea
                        id="whatsapp_ai_instructions"
                        value={settings.whatsapp_ai_instructions || ''}
                        onChange={(e) => setSettings({ ...settings, whatsapp_ai_instructions: e.target.value })}
                        placeholder="Instructions personnalisées pour l'IA WhatsApp..."
                        rows={4}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-orange-500" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Gérez vos préférences de notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-slate-500">Recevoir des notifications par email</p>
                  </div>
                  <Switch
                    checked={settings.email_notifications || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications SMS</Label>
                    <p className="text-sm text-slate-500">Recevoir des notifications par SMS</p>
                  </div>
                  <Switch
                    checked={settings.sms_notifications || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, sms_notifications: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>Gestion des utilisateurs</span>
                </CardTitle>
                <CardDescription>
                  Gérez les rôles et permissions des utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <h3 className="font-medium">{user.first_name} {user.last_name}</h3>
                        <p className="text-sm text-slate-500">{user.email}</p>
                        <div className="flex gap-1 mt-2">
                          {user.roles.map((role) => (
                            <Badge key={role} variant="secondary">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Select
                          onValueChange={(role) => updateUserRole(user.id, role, 'add')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Ajouter rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="moderator">Modérateur</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
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