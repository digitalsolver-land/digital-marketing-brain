import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

import { unifiedN8nService, ConnectionStatus } from '@/services/unifiedN8nService';
import { n8nConfigManager } from '@/config/api';

interface N8nConfigurationPanelProps {
  onConfigurationChange?: (connected: boolean) => void;
}

export const N8nConfigurationPanel: React.FC<N8nConfigurationPanelProps> = ({
  onConfigurationChange
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
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
      const currentConfig = await n8nConfigManager.getEffectiveConfig();
      setConfig(prev => ({
        ...prev,
        apiKey: currentConfig.apiKey || '',
        baseUrl: currentConfig.baseUrl || 'https://n8n.srv860213.hstgr.cloud/api/v1'
      }));
      
      const status = unifiedN8nService.getConnectionStatus();
      setConnectionStatus(status.status);
    } catch (error) {
      console.error('Erreur chargement config:', error);
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
    try {
      // Sauvegarder temporairement la config pour le test
      await unifiedN8nService.updateConfig({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl
      });

      const result = await unifiedN8nService.checkConnection();
      setConnectionStatus(result.status);

      if (result.status === 'connected') {
        toast({
          title: "Connexion réussie",
          description: "n8n est correctement configuré et accessible",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Échec de la connexion",
          description: result.error || "Impossible de se connecter à n8n",
        });
      }
    } catch (error) {
      console.error('Erreur test connexion:', error);
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
      await n8nConfigManager.saveConfig({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl
      });

      // Tester la connexion après sauvegarde
      const result = await unifiedN8nService.checkConnection();
      setConnectionStatus(result.status);

      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres n8n ont été enregistrés avec succès",
      });

      // Notifier le changement de configuration
      onConfigurationChange?.(result.status === 'connected');
    } catch (error) {
      console.error('Erreur sauvegarde config:', error);
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
      default:
        return <Settings className="w-5 h-5 text-gray-500" />;
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
        {/* Statut de connexion */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Statut de la connexion</p>
              <p className="text-sm text-gray-600">{getStatusText()}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCurrentConfig}
              disabled={testing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
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
          <h4 className="font-medium text-blue-900 mb-2">Guide de configuration :</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Connectez-vous à votre instance n8n</li>
            <li>• Allez dans Settings &gt; API Keys</li>
            <li>• Créez une nouvelle clé API avec les permissions "workflow:*"</li>
            <li>• Copiez la clé et collez-la ci-dessus</li>
            <li>• Testez la connexion avant de sauvegarder</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
