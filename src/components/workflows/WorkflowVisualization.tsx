
import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Settings, Trash2, Eye, ZoomIn, ZoomOut, RotateCcw, Brain, Maximize2, Minimize2, Move, Hand } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';
import { WorkflowCanvas } from './WorkflowCanvas';

interface WorkflowNode {
  id: string;
  node_id: string;
  node_type: string;
  name: string;
  position_x: number;
  position_y: number;
  parameters: any;
}

interface WorkflowConnection {
  id: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const { toast } = useToast();

  // Contrôles de zoom optimisés
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.25, 0.25));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  }, []);

  const handleFitToView = useCallback(() => {
    if (nodes.length === 0) return;
    
    // Calculer les limites des nœuds
    const minX = Math.min(...nodes.map(n => n.position_x));
    const maxX = Math.max(...nodes.map(n => n.position_x));
    const minY = Math.min(...nodes.map(n => n.position_y));
    const maxY = Math.max(...nodes.map(n => n.position_y));
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    // Calculer le zoom pour que tout soit visible
    const width = maxX - minX + 300; // margin
    const height = maxY - minY + 200;
    const containerWidth = 1000; // approximation
    const containerHeight = 600;
    
    const zoomX = containerWidth / width;
    const zoomY = containerHeight / height;
    const newZoom = Math.min(zoomX, zoomY, 1.5);
    
    setZoom(newZoom);
    setPan({ x: -centerX, y: -centerY });
  }, [nodes]);

  // Gestion du drag pour la navigation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Clic gauche uniquement
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - pan.x, 
        y: e.clientY - pan.y 
      });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const newPanX = e.clientX - dragStart.x;
      const newPanY = e.clientY - dragStart.y;
      setPan({ x: newPanX, y: newPanY });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Gestion du zoom avec la molette
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.25, Math.min(3, prev * delta)));
  }, []);

  // Gestion des clics sur les nœuds
  const handleNodeClick = useCallback((node: WorkflowNode) => {
    setSelectedNode(node);
    console.log('Nœud sélectionné:', node);
  }, []);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    setSelectedNode(null);
    console.log('Clic sur le canvas à:', x, y);
  }, []);

  // Analyse IA du workflow
  const analyzeWorkflow = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const workflowDescription = `
        Workflow: ${workflow.name}
        Description: ${workflow.description || 'Aucune description'}
        Nombre de nœuds: ${nodes.length}
        Nombre de connexions: ${connections.length}
        
        Nœuds:
        ${nodes.map(node => `- ${node.name} (${node.node_type})`).join('\n')}
        
        Connexions:
        ${connections.map(conn => {
          const sourceNode = nodes.find(n => n.node_id === conn.source_node_id);
          const targetNode = nodes.find(n => n.node_id === conn.target_node_id);
          return `- ${sourceNode?.name || 'Inconnu'} → ${targetNode?.name || 'Inconnu'}`;
        }).join('\n')}
      `;

      const prompt = `Analyse ce workflow n8n et explique-le de manière claire et détaillée:

${workflowDescription}

Fournis une analyse qui inclut:
1. Le but principal du workflow
2. Comment il fonctionne étape par étape
3. Les points forts et optimisations possibles
4. Des suggestions d'amélioration si applicable

Réponds en français de manière professionnelle et accessible.`;

      const result = await aiService.generateContent(prompt, 'workflow');
      setAnalysis(result);
      
      toast({
        title: "Analyse terminée",
        description: "L'IA a analysé votre workflow avec succès.",
      });
    } catch (error) {
      console.error('Erreur analyse workflow:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser le workflow. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [workflow, nodes, connections, toast]);

  // Validation des données
  if (!workflow || nodes.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-600">
            <Eye className="w-5 h-5" />
            <span>Aucun workflow à visualiser</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Aucune donnée de workflow
            </h3>
            <p className="text-gray-500 mb-4">
              Workflow: {workflow ? '✅ Présent' : '❌ Manquant'}<br/>
              Nœuds: {nodes.length}<br/>
              Connexions: {connections.length}
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Recharger la page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du workflow */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold">{workflow.name}</CardTitle>
              {workflow.description && (
                <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                  {workflow.status}
                </Badge>
                <Badge variant="outline">
                  {nodes.length} nœud{nodes.length > 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline">
                  {connections.length} connexion{connections.length > 1 ? 's' : ''}
                </Badge>
                {workflow.tags && workflow.tags.length > 0 && (
                  <>
                    {workflow.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={analyzeWorkflow}
                disabled={isAnalyzing}
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                <Brain className="w-4 h-4 mr-1" />
                {isAnalyzing ? 'Analyse...' : 'Analyser IA'}
              </Button>
              {onExecute && (
                <Button size="sm" onClick={onExecute}>
                  <Play className="w-4 h-4 mr-1" />
                  Exécuter
                </Button>
              )}
              {onEdit && (
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Settings className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="destructive" onClick={onDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Analyse IA */}
      {analysis && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Brain className="w-5 h-5" />
              <span>Analyse IA du Workflow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-purple-900">
              {analysis.split('\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className="mb-2">{paragraph}</p>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Détails du nœud sélectionné */}
      {selectedNode && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Settings className="w-5 h-5" />
              <span>Détails du Nœud: {selectedNode.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>ID:</strong> {selectedNode.node_id}
              </div>
              <div>
                <strong>Type:</strong> {selectedNode.node_type}
              </div>
              <div>
                <strong>Position:</strong> ({selectedNode.position_x}, {selectedNode.position_y})
              </div>
              <div>
                <strong>Paramètres:</strong> {Object.keys(selectedNode.parameters || {}).length} éléments
              </div>
            </div>
            {selectedNode.parameters && Object.keys(selectedNode.parameters).length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer font-medium text-blue-800">
                  Voir les paramètres
                </summary>
                <pre className="mt-2 p-3 bg-white rounded border text-xs overflow-auto">
                  {JSON.stringify(selectedNode.parameters, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      {/* Canvas de visualisation */}
      <Card className={isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Visualisation Interactive</span>
              {selectedNode && (
                <Badge variant="secondary" className="ml-2">
                  {selectedNode.name} sélectionné
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleFitToView}
                title="Ajuster à la vue"
              >
                <Move className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                title="Zoomer"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                title="Dézoomer"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetView}
                title="Réinitialiser"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Badge variant="secondary" className="text-xs ml-2">
                Zoom: {Math.round(zoom * 100)}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div 
            ref={containerRef}
            className={`relative overflow-hidden bg-gray-50 ${
              isFullscreen ? 'h-screen' : 'h-[700px]'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            <WorkflowCanvas 
              nodes={nodes}
              connections={connections}
              zoom={zoom}
              pan={pan}
              onNodeClick={handleNodeClick}
              onCanvasClick={handleCanvasClick}
            />
            
            {/* Instructions de navigation */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs space-y-1 border max-w-xs">
              <div className="font-semibold text-gray-800 flex items-center">
                <Hand className="w-4 h-4 mr-1" />
                Navigation:
              </div>
              <div className="text-gray-600">• Glisser pour déplacer</div>
              <div className="text-gray-600">• Molette pour zoomer</div>
              <div className="text-gray-600">• Clic sur nœud pour détails</div>
              <div className="text-gray-600">• Boutons pour contrôles</div>
            </div>
            
            {/* Informations de debug */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs border">
              <div className="font-semibold text-gray-800 mb-1">Statistiques:</div>
              <div className="text-gray-600">Nœuds: {nodes.length}</div>
              <div className="text-gray-600">Connexions: {connections.length}</div>
              <div className="text-gray-600">Zoom: {Math.round(zoom * 100)}%</div>
              <div className="text-gray-600">Pan: ({Math.round(pan.x)}, {Math.round(pan.y)})</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
