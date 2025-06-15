
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useN8nConfig } from '@/hooks/useN8nConfig';

interface N8nConfigProps {
  onConfigurationChange?: (connected: boolean) => void;
}

export const N8nConfig: React.FC<N8nConfigProps> = ({ onConfigurationChange }) => {
  const { 
    config, 
    setConfig, 
    testing, 
    saving, 
    connectionStatus, 
    testConnection, 
    saveConfig 
  } = useN8nConfig();

  const handleSave = async () => {
    const success = await saveConfig();
    onConfigurationChange?.(success);
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'checking': return 'Vérification...';
      case 'connected': return 'Connexion active';
      case 'error': return 'Connexion échouée';
      default: return 'Non configuré';
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
          Configurez votre connexion à n8n
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statut */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="base-url">URL de base n8n</Label>
            <Input
              id="base-url"
              value={config.baseUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="https://n8n.srv860213.hstgr.cloud/api/v1"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            onClick={testConnection}
            disabled={testing || !config.apiKey.trim()}
            variant="outline"
            className="flex-1"
          >
            {testing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Tester
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving || !config.apiKey.trim()}
            className="flex-1"
          >
            {saving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Sauvegarder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
