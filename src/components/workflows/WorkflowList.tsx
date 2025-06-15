
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw, 
  Search,
  ExternalLink,
  Activity
} from 'lucide-react';
import { useN8nWorkflows } from '@/hooks/useN8nWorkflows';

export const WorkflowList: React.FC = () => {
  const { 
    workflows, 
    loading, 
    connected, 
    loadWorkflows, 
    toggleWorkflow, 
    deleteWorkflow, 
    openInN8n 
  } = useN8nWorkflows();
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!connected) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600">Connectez-vous à n8n pour voir vos workflows</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Workflows n8n</CardTitle>
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
        {/* Recherche */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Rechercher un workflow..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-slate-600">Chargement...</p>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
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
                    onClick={() => openInN8n(workflow)}
                    title="Ouvrir dans n8n"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleWorkflow(workflow)}
                    title={workflow.active ? 'Désactiver' : 'Activer'}
                  >
                    {workflow.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteWorkflow(workflow)}
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Statistiques */}
        {workflows.length > 0 && (
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Total: {workflows.length}</span>
              <span>Actifs: {workflows.filter(w => w.active).length}</span>
              <span>Inactifs: {workflows.filter(w => !w.active).length}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
