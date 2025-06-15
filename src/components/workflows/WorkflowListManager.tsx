
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Search,
  FileJson,
  Activity
} from 'lucide-react';

import { unifiedN8nService, N8nWorkflow } from '@/services/unifiedN8nService';
import { WorkflowVisualization } from './WorkflowVisualization';

interface WorkflowListManagerProps {
  connected: boolean;
  onRefreshConnection: () => void;
}

export const WorkflowListManager: React.FC<WorkflowListManagerProps> = ({
  connected,
  onRefreshConnection
}) => {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);

  useEffect(() => {
    if (connected) {
      loadWorkflows();
    }
  }, [connected]);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const result = await unifiedN8nService.getWorkflows({ limit: 50 });
      setWorkflows(result.data);
      console.log(`✅ ${result.data.length} workflows chargés`);
    } catch (error) {
      console.error('Erreur chargement workflows:', error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les workflows",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflowStatus = async (workflow: N8nWorkflow) => {
    if (!workflow.id) return;

    setLoading(true);
    try {
      if (workflow.active) {
        await unifiedN8nService.deactivateWorkflow(workflow.id);
      } else {
        await unifiedN8nService.activateWorkflow(workflow.id);
      }

      // Mettre à jour l'état local
      setWorkflows(prev => 
        prev.map(w => w.id === workflow.id ? { ...w, active: !w.active } : w)
      );

      toast({
        title: workflow.active ? "Workflow désactivé" : "Workflow activé",
        description: `Le workflow "${workflow.name}" a été ${workflow.active ? 'désactivé' : 'activé'}`,
      });
    } catch (error) {
      console.error('Erreur toggle workflow:', error);
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

    setLoading(true);
    try {
      await unifiedN8nService.deleteWorkflow(workflow.id);
      setWorkflows(prev => prev.filter(w => w.id !== workflow.id));
      
      toast({
        title: "Workflow supprimé",
        description: `Le workflow "${workflow.name}" a été supprimé`,
      });

      if (selectedWorkflow?.id === workflow.id) {
        setSelectedWorkflow(null);
      }
    } catch (error) {
      console.error('Erreur suppression workflow:', error);
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: "Impossible de supprimer le workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des workflows
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && workflow.active) ||
      (filterStatus === 'inactive' && !workflow.active);
    
    return matchesSearch && matchesStatus;
  });

  if (selectedWorkflow) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Workflow: {selectedWorkflow.name}</h3>
          <Button 
            variant="outline" 
            onClick={() => setSelectedWorkflow(null)}
          >
            Retour à la liste
          </Button>
        </div>
        
        <WorkflowVisualization 
          workflow={selectedWorkflow}
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
          onExecute={() => {
            toast({
              title: "Workflow exécuté",
              description: `Le workflow "${selectedWorkflow.name}" a été exécuté`,
            });
          }}
          onEdit={() => {
            toast({
              title: "Édition workflow",
              description: "Ouverture de l'éditeur...",
            });
          }}
          onDelete={() => deleteWorkflow(selectedWorkflow)}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Liste des workflows</CardTitle>
            <CardDescription>
              Gérez vos workflows d'automatisation
            </CardDescription>
          </div>
          
          <Button onClick={loadWorkflows} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filtres et recherche */}
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

        {/* Liste des workflows */}
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
              {searchTerm && (
                <p className="text-sm">Essayez de modifier votre recherche</p>
              )}
            </div>
          ) : (
            filteredWorkflows.map((workflow) => (
              <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{workflow.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={workflow.active ? "default" : "secondary"}>
                          {workflow.active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          {workflow.nodes?.length || 0} nœud(s)
                        </span>
                        {workflow.updatedAt && (
                          <span className="text-sm text-slate-500">
                            Modifié: {new Date(workflow.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleWorkflowStatus(workflow)}
                    disabled={loading}
                  >
                    {workflow.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteWorkflow(workflow)}
                    disabled={loading}
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
  );
};
