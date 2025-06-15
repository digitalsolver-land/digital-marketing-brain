
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Download, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileJson,
  Eye,
  Edit,
  Trash2,
  Search
} from 'lucide-react';

import { unifiedN8nService, N8nWorkflow } from '@/services/unifiedN8nService';
import { workflowService } from '@/services/workflowService';
import { WorkflowVisualization } from './WorkflowVisualization';
import { WorkflowCreator } from './WorkflowCreator';

export const WorkflowManager: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('workflows');
  const [loading, setLoading] = useState(false);
  const [n8nConnected, setN8nConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string>('');

  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    checkN8nConnection();
  }, []);

  const checkN8nConnection = async () => {
    try {
      setConnectionStatus('checking');
      setConnectionError('');
      
      const connectionResult = await unifiedN8nService.checkConnection();
      
      if (connectionResult.status === 'connected') {
        setN8nConnected(true);
        setConnectionStatus('connected');
        
        toast({
          title: "n8n connecté",
          description: "La connexion avec n8n a été établie avec succès.",
        });
        
        await loadN8nWorkflows();
      } else {
        setN8nConnected(false);
        setConnectionStatus('error');
        setConnectionError(connectionResult.error || 'Connexion échouée');
        
        toast({
          variant: "destructive",
          title: "Erreur connexion n8n",
          description: connectionResult.error || "Impossible de se connecter à n8n",
        });

        await loadLocalWorkflows();
      }
    } catch (error) {
      setN8nConnected(false);
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Erreur de connexion inconnue');
      
      toast({
        variant: "destructive",
        title: "Erreur de connexion n8n",
        description: error instanceof Error ? error.message : "Impossible de se connecter à n8n",
      });

      await loadLocalWorkflows();
    }
  };

  const loadN8nWorkflows = async () => {
    if (!n8nConnected) return;
    
    setLoading(true);
    try {
      const result = await unifiedN8nService.getWorkflows({ limit: 100 });
      
      if (result.data && result.data.length > 0) {
        setWorkflows(result.data);
        
        toast({
          title: "Workflows importés",
          description: `${result.data.length} workflow(s) importé(s) depuis n8n`,
        });

        await syncWorkflowsToLocal(result.data);
      } else {
        setWorkflows([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement workflows n8n:', error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les workflows depuis n8n",
      });
      
      await loadLocalWorkflows();
    } finally {
      setLoading(false);
    }
  };

  const syncWorkflowsToLocal = async (n8nWorkflows: N8nWorkflow[]) => {
    try {
      for (const workflow of n8nWorkflows) {
        if (workflow.id && workflow.name) {
          const workflowData = {
            name: workflow.name,
            nodes: workflow.nodes || [],
            connections: workflow.connections || {},
            active: workflow.active,
            settings: workflow.settings || {},
            staticData: workflow.staticData || {},
            tags: workflow.tags || []
          };

          try {
            const existingWorkflows = await workflowService.getWorkflows();
            const existingWorkflow = existingWorkflows.find(w => w.n8nWorkflowId === workflow.id);

            if (existingWorkflow) {
              await workflowService.updateWorkflow(existingWorkflow.id, {
                name: workflow.name,
                description: `Workflow n8n synchronisé - ${workflow.nodes?.length || 0} nœuds`,
                status: workflow.active ? 'active' : 'inactive',
                jsonData: workflowData
              });
            } else {
              await workflowService.createWorkflow({
                name: workflow.name,
                description: `Workflow n8n synchronisé - ${workflow.nodes?.length || 0} nœuds`,
                status: workflow.active ? 'active' : 'inactive',
                n8nWorkflowId: workflow.id,
                jsonData: workflowData
              });
            }
          } catch (syncError) {
            console.warn(`⚠️ Erreur sync workflow ${workflow.name}:`, syncError);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation locale:', error);
    }
  };

  const loadLocalWorkflows = async () => {
    try {
      const localWorkflows = await workflowService.getWorkflows();
      
      const n8nFormattedWorkflows: N8nWorkflow[] = localWorkflows.map(workflow => {
        const jsonData = workflow.jsonData as any;
        return {
          id: workflow.n8nWorkflowId || workflow.id,
          name: workflow.name,
          active: workflow.status === 'active',
          nodes: jsonData?.nodes || [],
          connections: jsonData?.connections || {},
          settings: jsonData?.settings || {},
          staticData: jsonData?.staticData || {},
          tags: jsonData?.tags?.map((tag: string, index: number) => ({ id: index.toString(), name: tag })) || [],
          createdAt: workflow.createdAt || new Date().toISOString(),
          updatedAt: workflow.updatedAt || new Date().toISOString()
        };
      });
      
      setWorkflows(n8nFormattedWorkflows);
    } catch (error) {
      console.error('❌ Erreur chargement workflows locaux:', error);
      setWorkflows([]);
    }
  };

  const toggleWorkflowStatus = async (workflow: N8nWorkflow) => {
    if (!workflow.id) return;

    setLoading(true);
    try {
      if (n8nConnected) {
        if (workflow.active) {
          await unifiedN8nService.deactivateWorkflow(workflow.id);
        } else {
          await unifiedN8nService.activateWorkflow(workflow.id);
        }
      } else {
        const newStatus = workflow.active ? 'inactive' : 'active';
        await workflowService.updateWorkflowStatus(workflow.id, newStatus);
      }

      setWorkflows(prev => 
        prev.map(w => w.id === workflow.id ? { ...w, active: !w.active } : w)
      );

      toast({
        title: workflow.active ? "Workflow désactivé" : "Workflow activé",
        description: `Le workflow "${workflow.name}" a été ${workflow.active ? 'désactivé' : 'activé'}`,
      });
      
    } catch (error) {
      console.error('❌ Erreur toggle workflow:', error);
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
    if (!workflow.id) return;

    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le workflow "${workflow.name}" ?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      if (n8nConnected) {
        await unifiedN8nService.deleteWorkflow(workflow.id);
      } else {
        await workflowService.deleteWorkflow(workflow.id);
      }

      setWorkflows(prev => prev.filter(w => w.id !== workflow.id));
      
      toast({
        title: "Workflow supprimé",
        description: `Le workflow "${workflow.name}" a été supprimé`,
      });
      
      if (selectedWorkflow?.id === workflow.id) {
        setSelectedWorkflow(null);
      }
      
    } catch (error) {
      console.error('❌ Erreur suppression workflow:', error);
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: "Impossible de supprimer le workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  const openWorkflowInN8n = (workflow: N8nWorkflow) => {
    if (workflow.id && n8nConnected) {
      const n8nUrl = `https://n8n.srv860213.hstgr.cloud/workflow/${workflow.id}`;
      window.open(n8nUrl, '_blank');
    } else {
      toast({
        variant: "destructive",
        title: "Non disponible",
        description: "Connexion n8n requise pour ouvrir le workflow",
      });
    }
  };

  const exportWorkflowToJson = (workflow: N8nWorkflow) => {
    const exportData = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      active: workflow.active,
      settings: workflow.settings,
      staticData: workflow.staticData,
      tags: workflow.tags
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Workflow exporté",
      description: `Le workflow "${workflow.name}" a été exporté en JSON`,
    });
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && workflow.active) ||
      (filterStatus === 'inactive' && !workflow.active);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: typeof connectionStatus) => {
    switch (status) {
      case 'checking': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected': return <XCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: typeof connectionStatus) => {
    switch (status) {
      case 'checking': return 'Vérification...';
      case 'connected': return 'n8n Connecté';
      case 'disconnected': return 'Mode Local';
      case 'error': return 'Erreur Connexion';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestionnaire n8n</h2>
          <p className="text-slate-600">Gérez vos workflows et automatisations</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(connectionStatus)}
            <span className="text-sm font-medium">{getStatusText(connectionStatus)}</span>
          </div>
          
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="creator">Créateur</TabsTrigger>
          <TabsTrigger value="visualization">Visualisation</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workflows n8n</CardTitle>
                  <CardDescription>
                    Gérez vos workflows d'automatisation
                  </CardDescription>
                </div>
                
                <Button 
                  onClick={n8nConnected ? loadN8nWorkflows : loadLocalWorkflows} 
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                      placeholder="Rechercher un workflow..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-slate-600">Chargement des workflows...</p>
                  </div>
                ) : filteredWorkflows.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">
                    <FileJson className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p>Aucun workflow trouvé</p>
                  </div>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
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
                          onClick={() => setSelectedWorkflow(workflow)}
                          title="Visualiser"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportWorkflowToJson(workflow)}
                          title="Exporter JSON"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        {n8nConnected && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openWorkflowInN8n(workflow)}
                            title="Ouvrir dans n8n"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleWorkflowStatus(workflow)}
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creator" className="space-y-6">
          <WorkflowCreator 
            connected={n8nConnected}
            onWorkflowCreated={() => {
              if (n8nConnected) {
                loadN8nWorkflows();
              } else {
                loadLocalWorkflows();
              }
            }}
          />
        </TabsContent>

        <TabsContent value="visualization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visualisation des workflows</CardTitle>
              <CardDescription>
                Interface graphique pour visualiser vos workflows
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {selectedWorkflow ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Workflow: {selectedWorkflow.name}</h3>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedWorkflow(null)}
                    >
                      Fermer
                    </Button>
                  </div>
                  
                  <WorkflowVisualization 
                    workflow={{
                      id: selectedWorkflow.id,
                      name: selectedWorkflow.name,
                      description: `Workflow n8n avec ${selectedWorkflow.nodes?.length || 0} nœuds`,
                      status: selectedWorkflow.active ? 'active' : 'inactive',
                      n8n_workflow_id: selectedWorkflow.id,
                      json_data: {
                        name: selectedWorkflow.name,
                        nodes: selectedWorkflow.nodes || [],
                        connections: selectedWorkflow.connections || {},
                        active: selectedWorkflow.active,
                        settings: selectedWorkflow.settings || {},
                        staticData: selectedWorkflow.staticData || {},
                        tags: selectedWorkflow.tags || []
                      }
                    }}
                    nodes={selectedWorkflow.nodes?.map(node => ({
                      id: node.id || '',
                      workflow_id: selectedWorkflow.id || '',
                      node_id: node.id || '',
                      node_type: node.type || '',
                      name: node.name || '',
                      position_x: Array.isArray(node.position) ? node.position[0] : 0,
                      position_y: Array.isArray(node.position) ? node.position[1] : 0,
                      parameters: node.parameters || {}
                    })) || []}
                    connections={[]}
                    onExecute={() => toggleWorkflowStatus(selectedWorkflow)}
                    onEdit={() => openWorkflowInN8n(selectedWorkflow)}
                    onDelete={() => deleteWorkflow(selectedWorkflow)}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  <FileJson className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>Sélectionnez un workflow pour le visualiser</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
