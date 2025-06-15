
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings, RefreshCw, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

import { n8nApiService } from '@/services/n8nApiService';
import { n8nConfigManager } from '@/config/api';
import { supabase } from '@/integrations/supabase/client';

interface N8nConfigurationPanelProps {
  onConfigurationChange?: (connected: boolean) => void;
}

export const N8nConfigurationPanel: React.FC<N8nConfigurationPanelProps> = ({
  onConfigurationChange
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [config, setConfig] = useState({
    apiKey: '',
    baseUrl: 'https://n8n.srv860213.hstgr.cloud/api/v1',
    saveLocal: true
  });

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      console.log('🔄 Chargement configuration actuelle...');
      await n8nApiService.loadConfig();
      
      setConnectionStatus('connected');
      console.log('📊 Configuration chargée');
    } catch (error) {
      console.error('❌ Erreur chargement config:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleTestConnection = async () => {
    if (!config.apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Clé API requise",
        description: "Veuillez saisir votre clé API n8n",
      });
      return;
    }

    setTesting(true);
    setConnectionDetails(null);
    
    try {
      console.log('🧪 Test de connexion démarré...');
      
      // Sauvegarder temporairement la config
      await n8nApiService.saveConfig({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl
      });

      // Tester la connexion
      const result = await n8nApiService.testConnection();
      
      if (result.success) {
        setConnectionStatus('connected');
        setConnectionDetails(result.details);
        toast({
          title: "Connexion réussie ✅",
          description: "n8n est accessible",
        });
      } else {
        setConnectionStatus('error');
        setConnectionDetails(result);
        toast({
          variant: "destructive",
          title: "Échec de la connexion ❌",
          description: result.error || "Test de connexion échoué",
        });
      }
    } catch (error) {
      console.error('❌ Erreur test connexion:', error);
      setConnectionStatus('error');
      setConnectionDetails({ error: error.message });
      toast({
        variant: "destructive",
        title: "Erreur de test",
        description: "Une erreur est survenue lors du test de connexion",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!config.apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Configuration incomplète",
        description: "La clé API est requise",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Sauvegarde configuration...');
      
      await n8nApiService.saveConfig({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl
      });

      // Tester automatiquement après sauvegarde
      await handleTestConnection();

      toast({
        title: "Configuration sauvegardée ✅",
        description: "Les paramètres n8n ont été enregistrés avec succès",
      });

      // Notifier le changement de configuration
      onConfigurationChange?.(connectionStatus === 'connected');
    } catch (error) {
      console.error('❌ Erreur sauvegarde config:', error);
      toast({
        variant: "destructive",
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder la configuration",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'Vérification en cours...';
      case 'connected':
        return 'Connexion active';
      case 'error':
        return 'Connexion échouée';
      default:
        return 'Non configuré';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Configuration n8n</span>
          {getStatusIcon()}
        </CardTitle>
        <CardDescription>
          Configurez votre connexion à n8n pour gérer vos workflows d'automatisation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statut de connexion détaillé */}
        <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <p className="font-medium">{getStatusText()}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCurrentConfig}
              disabled={testing || loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(testing || loading) ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
          
          {connectionDetails && (
            <div className="mt-3 p-3 bg-white/50 rounded border">
              {connectionDetails.success ? (
                <div className="space-y-1 text-sm">
                  <p><strong>URL:</strong> {connectionDetails.details?.url}</p>
                  <p><strong>Workflows:</strong> {connectionDetails.details?.workflowCount || 0}</p>
                  {connectionDetails.details?.serverVersion && (
                    <p><strong>Serveur:</strong> {connectionDetails.details.serverVersion}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-red-700">{connectionDetails.error}</p>
                  {connectionDetails.troubleshooting && (
                    <p className="text-red-600">{connectionDetails.troubleshooting}</p>
                  )}
                  {connectionDetails.details?.status && (
                    <p className="text-xs text-red-500">
                      Code: {connectionDetails.details.status}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Clé API n8n *</Label>
            <Input
              id="api-key"
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="n8n_api_your_key_here"
            />
            <p className="text-xs text-gray-500">
              Trouvez votre clé API dans les paramètres n8n &gt; API Keys
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base-url">URL de base n8n</Label>
            <Input
              id="base-url"
              value={config.baseUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="https://n8n.srv860213.hstgr.cloud/api/v1"
            />
            <p className="text-xs text-gray-500">
              URL complète de votre instance n8n avec /api/v1
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="save-local"
              checked={config.saveLocal}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, saveLocal: checked }))}
            />
            <Label htmlFor="save-local">Sauvegarder en local (fallback)</Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            onClick={handleTestConnection}
            disabled={testing || !config.apiKey.trim()}
            variant="outline"
            className="flex-1"
          >
            {testing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Tester la connexion
          </Button>
          
          <Button
            onClick={handleSaveConfiguration}
            disabled={loading || !config.apiKey.trim()}
            className="flex-1"
          >
            {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Sauvegarder
          </Button>
        </div>

        {/* Aide */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Guide de configuration :</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Connectez-vous à votre instance n8n</li>
                <li>• Allez dans Settings &gt; API Keys</li>
                <li>• Créez une nouvelle clé API avec les permissions "workflow:*"</li>
                <li>• Copiez la clé et collez-la ci-dessus</li>
                <li>• Testez la connexion avant de sauvegarder</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
