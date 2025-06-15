
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { unifiedN8nService, ConnectionStatus } from '@/services/unifiedN8nService';

interface N8nConfigurationPanelProps {
  onConfigurationChange?: (connected: boolean) => void;
}

export const N8nConfigurationPanel: React.FC<N8nConfigurationPanelProps> = ({
  onConfigurationChange
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionError, setConnectionError] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [formData, setFormData] = useState({
    apiKey: '',
    baseUrl: 'http://localhost:5678/api/v1'
  });

  useEffect(() => {
    checkCurrentStatus();
  }, []);

  const checkCurrentStatus = async () => {
    setLoading(true);
    try {
      const result = await unifiedN8nService.checkConnection();
      setConnectionStatus(result.status);
      setConnectionError(result.error || '');
      
      onConfigurationChange?.(result.status === 'connected');
    } catch (error) {
      console.error('Erreur vérification statut:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!formData.apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "La clé API n8n est requise",
      });
      return;
    }

    if (!formData.baseUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "L'URL de base n8n est requise",
      });
      return;
    }

    setLoading(true);
    try {
      // Sauvegarder la configuration
      await unifiedN8nService.updateConfig({
        apiKey: formData.apiKey.trim(),
        baseUrl: formData.baseUrl.trim()
      });

      toast({
        title: "Configuration sauvegardée",
        description: "La configuration n8n a été mise à jour avec succès",
      });

      // Vérifier la connexion
      await checkCurrentStatus();

      // Reset du formulaire
      setFormData({ apiKey: '', baseUrl: formData.baseUrl });
      
    } catch (error) {
      console.error('Erreur sauvegarde config:', error);
      toast({
        variant: "destructive",
        title: "Erreur de configuration",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder la configuration",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case 'checking': return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected': return <XCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case 'checking': return 'Vérification...';
      case 'connected': return 'Connecté';
      case 'disconnected': return 'Non configuré';
      case 'error': return 'Erreur de connexion';
    }
  };

  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'checking': return 'default';
      case 'connected': return 'default';
      case 'disconnected': return 'secondary';
      case 'error': return 'destructive';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5" />
            <div>
              <CardTitle>Configuration n8n</CardTitle>
              <CardDescription>
                Configurez votre connexion à l'instance n8n
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus)}
              <Badge variant={getStatusColor(connectionStatus)}>
                {getStatusText(connectionStatus)}
              </Badge>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkCurrentStatus}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* État de la connexion */}
        {connectionStatus === 'connected' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              n8n est connecté et fonctionnel. Vous pouvez maintenant créer et gérer vos workflows.
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'error' && connectionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erreur de connexion:</strong> {connectionError}
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'disconnected' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Configurez votre clé API n8n pour accéder à toutes les fonctionnalités.
            </AlertDescription>
          </Alert>
        )}

        {/* Formulaire de configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="n8n-base-url">URL de base n8n</Label>
            <Input
              id="n8n-base-url"
              value={formData.baseUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="http://localhost:5678/api/v1"
            />
            <p className="text-sm text-slate-500">
              URL de votre instance n8n (par défaut: http://localhost:5678/api/v1)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="n8n-api-key">Clé API n8n</Label>
            <div className="relative">
              <Input
                id="n8n-api-key"
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Votre clé API n8n"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <span>Trouvez votre clé API dans n8n → Settings → API</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto p-0"
                onClick={() => window.open('http://localhost:5678', '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleSaveConfiguration}
            disabled={loading || !formData.apiKey.trim()}
            className="w-full"
          >
            {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Sauvegarder et tester la connexion
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <h4 className="font-medium mb-2">Comment obtenir votre clé API n8n :</h4>
          <ol className="text-sm text-slate-600 space-y-1">
            <li>1. Ouvrez votre instance n8n</li>
            <li>2. Allez dans Settings → API</li>
            <li>3. Créez une nouvelle clé API</li>
            <li>4. Copiez la clé et collez-la ci-dessus</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
