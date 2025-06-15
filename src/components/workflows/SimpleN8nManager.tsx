
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  RefreshCw, 
  Play, 
  Pause, 
  Trash2, 
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

import { n8nApiService, N8nWorkflow } from '@/services/n8nApiService';

export const SimpleN8nManager: React.FC = () => {
  const { toast } = useToast();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  
  const [config, setConfig] = useState({
    apiKey: '',
    baseUrl: 'https://n8n.srv860213.hstgr.cloud/api/v1'
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const result = await n8nApiService.testConnection();
      
      if (result.success) {
        setIsConnected(true);
        setIsConfigured(true);
        setShowConfig(false);
        await loadWorkflows();
        
        toast({
          title: "n8n connecté ✅",
          description: "Connexion établie avec succès",
        });
      } else {
        setIsConnected(false);
        setShowConfig(true);
        
        toast({
          variant: "destructive",
          title: "Connexion échouée ❌",
          description: result.error || "Impossible de se connecter à n8n",
        });
      }
    } catch (error) {
      setIsConnected(false);
      setShowConfig(true);
      
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Vérifiez votre configuration n8n",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
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
      await n8nApiService.saveConfig({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl
      });

      toast({
        title: "Configuration sauvegardée ✅",
        description: "Test de connexion en cours...",
      });

      await checkConnection();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de sauvegarde",
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    if (!isConnected) return;

    setLoading(true);
    try {
      const workflowList = await n8nApiService.getWorkflows();
      setWorkflows(workflowList);
      
      toast({
        title: "Workflows chargés ✅",
        description: `${workflowList.length} workflow(s) importé(s)`,
      });
    } catch (error) {
      console.error('❌ Erreur chargement workflows:', error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les workflows",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflow: N8nWorkflow) => {
    setLoading(true);
    try {
      if (workflow.active) {
        await n8nApiService.deactivateWorkflow(workflow.id);
      } else {
        await n8nApiService.activateWorkflow(workflow.id);
      }

      // Mettre à jour l'état local
      setWorkflows(prev => 
        prev.map(w => w.id === workflow.id ? { ...w, active: !w.active } : w)
      );

      toast({
        title: workflow.active ? "Workflow désactivé" : "Workflow activé",
        description: `"${workflow.name}" a été ${workflow.active ? 'désactivé' : 'activé'}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le statut du workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (workflow: N8nWorkflow) => {
    const confirmed = window.confirm(`Supprimer le workflow "${workflow.name}" ?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      await n8nApiService.deleteWorkflow(workflow.id);
      setWorkflows(prev => prev.filter(w => w.id !== workflow.id));
      
      toast({
        title: "Workflow supprimé ✅",
        description: `"${workflow.name}" a été supprimé`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: "Impossible de supprimer le workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  const openInN8n = (workflow: N8nWorkflow) => {
    const url = n8nApiService.getWorkflowUrl(workflow.id);
    window.open(url, '_blank');
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (isConnected) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (isConfigured) return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (loading) return 'Chargement...';
    if (isConnected) return 'Connecté';
    if (isConfigured) return 'Erreur de connexion';
    return 'Configuration requise';
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestionnaire n8n</h2>
          <div className="flex items-center space-x-2 mt-1">
            {getStatusIcon()}
            <span className="text-sm">{getStatusText()}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </Button>
          
          <Button 
            onClick={checkConnection}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Configuration */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration n8n</CardTitle>
            <CardDescription>
              Configurez votre connexion à n8n
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Clé API n8n *</Label>
              <Input
                id="api-key"
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Votre clé API n8n"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base-url">URL de base</Label>
              <Input
                id="base-url"
                value={config.baseUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://n8n.srv860213.hstgr.cloud/api/v1"
              />
            </div>

            <Button 
              onClick={saveConfig}
              disabled={loading || !config.apiKey.trim()}
              className="w-full"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Sauvegarder et tester
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Liste des workflows */}
      {isConnected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workflows n8n</CardTitle>
                <CardDescription>
                  {workflows.length} workflow(s) trouvé(s)
                </CardDescription>
              </div>
              
              <Button onClick={loadWorkflows} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recharger
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {workflows.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <p>Aucun workflow trouvé</p>
                <p className="text-sm">Créez vos premiers workflows dans n8n</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{workflow.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={workflow.active ? "default" : "secondary"}>
                          {workflow.active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          {workflow.nodes?.length || 0} nœud(s)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInN8n(workflow)}
                        title="Ouvrir dans n8n"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleWorkflow(workflow)}
                        disabled={loading}
                        title={workflow.active ? 'Désactiver' : 'Activer'}
                      >
                        {workflow.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteWorkflow(workflow)}
                        disabled={loading}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
