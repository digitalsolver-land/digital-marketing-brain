import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Save, 
  Key, 
  Globe, 
  Bell, 
  Users, 
  Shield,
  Trash2,
  ArrowLeft,
  MessageCircle,
  Share2
} from 'lucide-react';

interface AppSettings {
  n8n_api_key?: string;
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
  whatsapp_api_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_verify_token?: string;
  whatsapp_ai_enabled?: boolean;
  whatsapp_ai_instructions?: string;
  whatsapp_response_mode?: string;
  default_language?: string;
  timezone?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  auto_backup?: boolean;
  backup_frequency?: string;
  max_workflows?: number;
  data_retention_days?: number;
}

interface UserWithRoles {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
}

type AppRole = 'admin' | 'moderator' | 'user' | 'commercial' | 'client';

const Settings = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    default_language: 'fr',
    timezone: 'Europe/Paris',
    email_notifications: true,
    sms_notifications: false,
    auto_backup: true,
    backup_frequency: 'daily',
    max_workflows: 50,
    data_retention_days: 90,
    whatsapp_ai_enabled: false,
    whatsapp_response_mode: 'auto',
    whatsapp_ai_instructions: 'Tu es un assistant professionnel qui répond aux questions des clients de manière courtoise et utile.',
    postiz_api_url: 'https://api.postiz.com/public/v1'
  });
  const [users, setUsers] = useState<UserWithRoles[]>([]);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
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
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name');

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles.map(profile => ({
        ...profile,
        roles: userRoles
          .filter(role => role.user_id === profile.id)
          .map(role => role.role)
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger la liste des utilisateurs.",
      });
    }
  };

  const handleSaveSettings = async () => {
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Supprimer tous les rôles existants pour cet utilisateur
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Ajouter le nouveau rôle si ce n'est pas 'user'
      if (newRole !== 'user') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole as AppRole });

        if (error) throw error;
      }

      toast({
        title: "Rôle mis à jour",
        description: "Le rôle de l'utilisateur a été modifié avec succès.",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 hover:bg-red-600';
      case 'commercial': return 'bg-blue-500 hover:bg-blue-600';
      case 'client': return 'bg-green-500 hover:bg-green-600';
      case 'moderator': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Bouton retour */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au Dashboard
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-600 mt-2">Configurez votre application et gérez vos préférences</p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api">API & Intégrations</TabsTrigger>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Gestion Utilisateurs</TabsTrigger>}
        </TabsList>

        <TabsContent value="api">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>Clés API Intelligence Artificielle</span>
                </CardTitle>
                <CardDescription>
                  Configurez vos clés API pour les services d'IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openrouter_api_key">OpenRouter API Key</Label>
                  <Input
                    id="openrouter_api_key"
                    type="password"
                    value={settings.openrouter_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
                    placeholder="sk-or-..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="n8n_api_key">n8n API Key</Label>
                  <Input
                    id="n8n_api_key"
                    type="password"
                    value={settings.n8n_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, n8n_api_key: e.target.value })}
                    placeholder="Votre clé API n8n"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="w-5 h-5" />
                  <span>Configuration Postiz</span>
                </CardTitle>
                <CardDescription>
                  Configurez l'intégration Postiz pour la gestion des réseaux sociaux
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="postiz_api_key">Clé API Postiz</Label>
                  <Input
                    id="postiz_api_key"
                    type="password"
                    value={settings.postiz_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, postiz_api_key: e.target.value })}
                    placeholder="Votre clé API Postiz"
                  />
                  <p className="text-xs text-slate-500">
                    Trouvez votre clé API dans les paramètres de votre instance Postiz
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postiz_api_url">URL de l'API Postiz</Label>
                  <Input
                    id="postiz_api_url"
                    value={settings.postiz_api_url || ''}
                    onChange={(e) => setSettings({ ...settings, postiz_api_url: e.target.value })}
                    placeholder="https://votre-instance.postiz.com/public/v1"
                  />
                  <p className="text-xs text-slate-500">
                    URL de votre instance Postiz (locale ou serveur). Par défaut: https://api.postiz.com/public/v1
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Configuration WhatsApp Business</span>
                </CardTitle>
                <CardDescription>
                  Configurez l'intégration WhatsApp avec IA pour répondre automatiquement aux messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_api_token">WhatsApp API Token</Label>
                    <Input
                      id="whatsapp_api_token"
                      type="password"
                      value={settings.whatsapp_api_token || ''}
                      onChange={(e) => setSettings({ ...settings, whatsapp_api_token: e.target.value })}
                      placeholder="Token d'accès WhatsApp Business"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_phone_number_id">ID Numéro de téléphone</Label>
                    <Input
                      id="whatsapp_phone_number_id"
                      value={settings.whatsapp_phone_number_id || ''}
                      onChange={(e) => setSettings({ ...settings, whatsapp_phone_number_id: e.target.value })}
                      placeholder="ID du numéro WhatsApp Business"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_verify_token">Token de vérification</Label>
                  <Input
                    id="whatsapp_verify_token"
                    value={settings.whatsapp_verify_token || ''}
                    onChange={(e) => setSettings({ ...settings, whatsapp_verify_token: e.target.value })}
                    placeholder="Token pour vérifier le webhook"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="whatsapp_ai_enabled">Activer l'IA WhatsApp</Label>
                      <p className="text-sm text-slate-600">
                        Permettre à l'IA de répondre automatiquement aux messages WhatsApp
                      </p>
                    </div>
                    <Switch
                      id="whatsapp_ai_enabled"
                      checked={settings.whatsapp_ai_enabled || false}
                      onCheckedChange={(checked) => setSettings({ ...settings, whatsapp_ai_enabled: checked })}
                    />
                  </div>

                  {settings.whatsapp_ai_enabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp_response_mode">Mode de réponse</Label>
                        <Select 
                          value={settings.whatsapp_response_mode} 
                          onValueChange={(value) => setSettings({ ...settings, whatsapp_response_mode: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Automatique (réponse immédiate)</SelectItem>
                            <SelectItem value="manual">Manuel (nécessite validation)</SelectItem>
                            <SelectItem value="smart">Intelligent (IA décide)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp_ai_instructions">Instructions pour l'IA</Label>
                        <Textarea
                          id="whatsapp_ai_instructions"
                          value={settings.whatsapp_ai_instructions || ''}
                          onChange={(e) => setSettings({ ...settings, whatsapp_ai_instructions: e.target.value })}
                          placeholder="Décrivez comment l'IA doit se comporter, quels types de réponses donner, et quelles sont les consignes à suivre..."
                          rows={6}
                          className="resize-none"
                        />
                        <p className="text-xs text-slate-500">
                          Exemple: "Tu es l'assistant client de [nom de l'entreprise]. Réponds de manière professionnelle et courtoise. Pour les demandes techniques, oriente vers le support. Ne donne jamais d'informations de prix sans confirmation."
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>APIs Google</CardTitle>
                <CardDescription>
                  Intégrations avec les services Google
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google_analytics_api">Google Analytics API</Label>
                  <Input
                    id="google_analytics_api"
                    type="password"
                    value={settings.google_analytics_api || ''}
                    onChange={(e) => setSettings({ ...settings, google_analytics_api: e.target.value })}
                    placeholder="Clé API Google Analytics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google_search_console_api">Google Search Console API</Label>
                  <Input
                    id="google_search_console_api"
                    type="password"
                    value={settings.google_search_console_api || ''}
                    onChange={(e) => setSettings({ ...settings, google_search_console_api: e.target.value })}
                    placeholder="Clé API Google Search Console"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google_ads_api">Google Ads API</Label>
                  <Input
                    id="google_ads_api"
                    type="password"
                    value={settings.google_ads_api || ''}
                    onChange={(e) => setSettings({ ...settings, google_ads_api: e.target.value })}
                    placeholder="Clé API Google Ads"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>APIs Réseaux Sociaux</CardTitle>
                <CardDescription>
                  Intégrations avec les plateformes sociales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_api">Facebook API</Label>
                    <Input
                      id="facebook_api"
                      type="password"
                      value={settings.facebook_api || ''}
                      onChange={(e) => setSettings({ ...settings, facebook_api: e.target.value })}
                      placeholder="Token Facebook"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter_api">Twitter API</Label>
                    <Input
                      id="twitter_api"
                      type="password"
                      value={settings.twitter_api || ''}
                      onChange={(e) => setSettings({ ...settings, twitter_api: e.target.value })}
                      placeholder="Token Twitter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_api">LinkedIn API</Label>
                    <Input
                      id="linkedin_api"
                      type="password"
                      value={settings.linkedin_api || ''}
                      onChange={(e) => setSettings({ ...settings, linkedin_api: e.target.value })}
                      placeholder="Token LinkedIn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_api">Instagram API</Label>
                    <Input
                      id="instagram_api"
                      type="password"
                      value={settings.instagram_api || ''}
                      onChange={(e) => setSettings({ ...settings, instagram_api: e.target.value })}
                      placeholder="Token Instagram"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Préférences Générales</span>
              </CardTitle>
              <CardDescription>
                Configurez les paramètres généraux de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="default_language">Langue par défaut</Label>
                  <Select value={settings.default_language} onValueChange={(value) => setSettings({ ...settings, default_language: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un fuseau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Limites et quotas</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="max_workflows">Nombre maximum de workflows</Label>
                    <Input
                      id="max_workflows"
                      type="number"
                      value={settings.max_workflows || 50}
                      onChange={(e) => setSettings({ ...settings, max_workflows: parseInt(e.target.value) })}
                      min="1"
                      max="1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_retention_days">Rétention des données (jours)</Label>
                    <Input
                      id="data_retention_days"
                      type="number"
                      value={settings.data_retention_days || 90}
                      onChange={(e) => setSettings({ ...settings, data_retention_days: parseInt(e.target.value) })}
                      min="7"
                      max="365"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sauvegarde automatique</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_backup">Sauvegarde automatique</Label>
                    <p className="text-sm text-slate-600">
                      Effectuer des sauvegardes régulières de vos données
                    </p>
                  </div>
                  <Switch
                    id="auto_backup"
                    checked={settings.auto_backup || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_backup: checked })}
                  />
                </div>

                {settings.auto_backup && (
                  <div className="space-y-2">
                    <Label htmlFor="backup_frequency">Fréquence de sauvegarde</Label>
                    <Select value={settings.backup_frequency} onValueChange={(value) => setSettings({ ...settings, backup_frequency: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Toutes les heures</SelectItem>
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

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Gérez vos préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_notifications">Notifications par email</Label>
                  <p className="text-sm text-slate-600">
                    Recevoir des notifications importantes par email
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={settings.email_notifications || false}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms_notifications">Notifications SMS</Label>
                  <p className="text-sm text-slate-600">
                    Recevoir des alertes urgentes par SMS
                  </p>
                </div>
                <Switch
                  id="sms_notifications"
                  checked={settings.sms_notifications || false}
                  onCheckedChange={(checked) => setSettings({ ...settings, sms_notifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Gestion des Utilisateurs</span>
                </CardTitle>
                <CardDescription>
                  Gérez les rôles et permissions des utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((userItem) => (
                    <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {userItem.first_name && userItem.last_name 
                            ? `${userItem.first_name} ${userItem.last_name}` 
                            : userItem.email}
                        </div>
                        <div className="text-sm text-slate-600">{userItem.email}</div>
                        <div className="flex gap-1 mt-2">
                          {userItem.roles.length > 0 ? (
                            userItem.roles.map((role) => (
                              <Badge key={role} className={`${getRoleBadgeColor(role)} text-white`}>
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">user</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={userItem.roles[0] || 'user'}
                          onValueChange={(value) => handleRoleChange(userItem.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
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

      <div className="flex justify-end mt-8">
        <Button onClick={handleSaveSettings} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
