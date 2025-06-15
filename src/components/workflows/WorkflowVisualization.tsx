import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  ZoomIn,
  ZoomOut,
  Move,
  Brain,
  FileJson,
  ExternalLink
} from 'lucide-react';

import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowAnalysisPanel } from './WorkflowAnalysisPanel';
import { n8nApi } from '@/services/n8nApi';

interface WorkflowNode {
  id: string;
  workflow_id: string;
  node_id: string;
  node_type: string;
  name: string;
  position_x: number;
  position_y: number;
  parameters: any;
}

interface WorkflowConnection {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_index: number;
  target_index: number;
  connection_type: string;
}

interface WorkflowVisualizationProps {
  workflow: any;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  onExecute?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  workflow,
  nodes,
  connections,
  onExecute,
  onEdit,
  onDelete
}) => {
  const { toast } = useToast();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [activeTab, setActiveTab] = useState('canvas');

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleNodeClick = useCallback((node: WorkflowNode) => {
    setSelectedNode(node);
    console.log('Nœud sélectionné:', node);
  }, []);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    setSelectedNode(null);
    console.log('Clic sur le canvas:', { x, y });
  }, []);

  const handleExecuteWorkflow = async () => {
    try {
      if (workflow.id) {
        // Exécuter via n8n si possible
        await n8nApi.activateWorkflow(workflow.id);
        toast({
          title: "Workflow exécuté",
          description: `Le workflow "${workflow.name}" a été activé et exécuté`,
        });
      }
      onExecute?.();
    } catch (error) {
      console.error('❌ Erreur exécution workflow:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'exécution",
        description: "Impossible d'exécuter le workflow",
      });
    }
  };

  const handleExportWorkflow = () => {
    try {
      const workflowData = {
        ...workflow,
        nodes: nodes.map(node => ({
          id: node.node_id,
          name: node.name,
          type: node.node_type,
          position: [node.position_x, node.position_y],
          parameters: node.parameters
        })),
        connections: connections.reduce((acc, conn) => {
          if (!acc[conn.source_node_id]) {
            acc[conn.source_node_id] = { main: [] };
          }
          if (!acc[conn.source_node_id].main[conn.source_index]) {
            acc[conn.source_node_id].main[conn.source_index] = [];
          }
          acc[conn.source_node_id].main[conn.source_index].push({
            node: conn.target_node_id,
            type: conn.connection_type,
            index: conn.target_index
          });
          return acc;
        }, {} as any)
      };

      const blob = new Blob([JSON.stringify(workflowData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workflow.name || 'workflow'}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Workflow exporté",
        description: "Le fichier JSON a été téléchargé",
      });
    } catch (error) {
      console.error('❌ Erreur export:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'exportation",
        description: "Impossible d'exporter le workflow",
      });
    }
  };

  const handleOpenInN8n = () => {
    if (workflow.n8n_workflow_id) {
      const n8nUrl = `https://n8n.srv860213.hstgr.cloud/workflow/${workflow.n8n_workflow_id}`;
      window.open(n8nUrl, '_blank');
    } else {
      toast({
        variant: "destructive",
        title: "Non disponible",
        description: "Ce workflow n'est pas synchronisé avec n8n",
      });
    }
  };

  const workflowJsonData = workflow.json_data || {
    nodes: nodes.map(node => ({
      id: node.node_id,
      name: node.name,
      type: node.node_type,
      position: [node.position_x, node.position_y],
      parameters: node.parameters
    })),
    connections: {}
  };

  return (
    <div className="space-y-6">
      {/* En-tête du workflow */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{workflow.name}</h3>
          <p className="text-slate-600">{workflow.description}</p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant={workflow.status === 'active' ? "default" : "secondary"}>
              {workflow.status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
            <Badge variant="outline">
              {nodes.length} nœud(s)
            </Badge>
            <Badge variant="outline">
              {connections.length} connexion(s)
            </Badge>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportWorkflow}>
            <Download className="w-4 h-4 mr-2" />
            Exporter JSON
          </Button>
          
          {workflow.n8n_workflow_id && (
            <Button variant="outline" size="sm" onClick={handleOpenInN8n}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir dans n8n
            </Button>
          )}
          
          <Button size="sm" onClick={handleExecuteWorkflow}>
            <Play className="w-4 h-4 mr-2" />
            Exécuter
          </Button>
          
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          )}
          
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Interface à onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="canvas">
            <Move className="w-4 h-4 mr-2" />
            Canvas
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <Brain className="w-4 h-4 mr-2" />
            Analyse IA
          </TabsTrigger>
          <TabsTrigger value="json">
            <FileJson className="w-4 h-4 mr-2" />
            JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canvas">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Visualisation du Workflow</CardTitle>
                  <CardDescription>
                    Canvas interactif du workflow avec zoom et panoramique
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetView}>
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="h-[600px] border-t">
                <WorkflowCanvas
                  nodes={nodes}
                  connections={connections}
                  zoom={zoom}
                  pan={pan}
                  onNodeClick={handleNodeClick}
                  onCanvasClick={handleCanvasClick}
                />
              </div>
            </CardContent>
          </Card>

          {/* Détails du nœud sélectionné */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle>Détails du nœud : {selectedNode.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div><strong>Type :</strong> {selectedNode.node_type}</div>
                  <div><strong>ID :</strong> {selectedNode.node_id}</div>
                  <div><strong>Position :</strong> ({selectedNode.position_x}, {selectedNode.position_y})</div>
                  {Object.keys(selectedNode.parameters).length > 0 && (
                    <div>
                      <strong>Paramètres :</strong>
                      <pre className="mt-2 p-2 bg-slate-100 rounded text-sm overflow-auto">
                        {JSON.stringify(selectedNode.parameters, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis">
          <WorkflowAnalysisPanel 
            workflowData={workflowJsonData}
            onWorkflowFixed={(fixedWorkflow) => {
              toast({
                title: "Workflow corrigé",
                description: "Le workflow a été automatiquement corrigé",
              });
              // TODO: Mettre à jour le workflow avec les corrections
            }}
          />
        </TabsContent>

        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle>Structure JSON du Workflow</CardTitle>
              <CardDescription>
                Données brutes du workflow au format n8n
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded overflow-auto text-sm max-h-[600px]">
                {JSON.stringify(workflowJsonData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
