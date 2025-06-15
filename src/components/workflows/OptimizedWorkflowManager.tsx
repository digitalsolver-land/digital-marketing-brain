
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Settings, Activity } from 'lucide-react';

import { unifiedN8nService, ConnectionStatus } from '@/services/unifiedN8nService';
import { N8nConfigurationPanel } from './N8nConfigurationPanel';
import { WorkflowListManager } from './WorkflowListManager';
import { WorkflowCreator } from './WorkflowCreator';

export const OptimizedWorkflowManager: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('workflows');
  const [n8nConnected, setN8nConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkN8nConnection();
  }, []);

  const checkN8nConnection = async () => {
    setLoading(true);
    try {
      console.log('🔄 Vérification connexion n8n...');
      const result = await unifiedN8nService.checkConnection();
      setConnectionStatus(result.status);
      setN8nConnected(result.status === 'connected');
      
      if (result.status === 'connected') {
        toast({
          title: "n8n connecté ✅",
          description: "La connexion avec n8n a été établie avec succès.",
        });
      } else if (result.status === 'error') {
        console.warn('⚠️ n8n non disponible:', result.error);
        toast({
          variant: "destructive",
          title: "Erreur connexion n8n ❌",
          description: result.error || "Impossible de se connecter à n8n",
        });
      }
    } catch (error) {
      console.error('❌ Erreur connexion n8n:', error);
      setN8nConnected(false);
      setConnectionStatus('error');
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurationChange = (connected: boolean) => {
    setN8nConnected(connected);
    setConnectionStatus(connected ? 'connected' : 'disconnected');
    
    if (connected && activeTab === 'settings') {
      setActiveTab('workflows');
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case 'checking': return 'Vérification...';
      case 'connected': return 'n8n Connecté';
      case 'disconnected': return 'Configuration requise';
      case 'error': return 'Erreur de connexion';
    }
  };

  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'checking': return 'text-blue-600';
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-yellow-600';
      case 'error': return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestionnaire n8n</h2>
          <p className="text-slate-600">Gérez vos workflows et automatisations</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
            {getStatusText(connectionStatus)}
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkN8nConnection}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Interface principale */}
      {!n8nConnected ? (
        <N8nConfigurationPanel onConfigurationChange={handleConfigurationChange} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workflows">
              <Activity className="w-4 h-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="create">
              Créer
            </TabsTrigger>
            <TabsTrigger value="executions">
              Exécutions
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflows">
            <WorkflowListManager 
              connected={n8nConnected}
              onRefreshConnection={checkN8nConnection}
            />
          </TabsContent>

          <TabsContent value="create">
            <WorkflowCreator 
              connected={n8nConnected}
              onWorkflowCreated={() => {
                setActiveTab('workflows');
                toast({
                  title: "Workflow créé ✅",
                  description: "Le workflow a été créé avec succès",
                });
              }}
            />
          </TabsContent>

          <TabsContent value="executions">
            <Card>
              <CardHeader>
                <CardTitle>Exécutions des workflows</CardTitle>
                <CardDescription>
                  Historique et monitoring des exécutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-600">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>Module d'exécutions en développement</p>
                  <p className="text-sm">Bientôt disponible pour monitorer vos workflows</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <N8nConfigurationPanel onConfigurationChange={handleConfigurationChange} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
