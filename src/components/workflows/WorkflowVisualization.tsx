import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Settings, Trash2, Eye, ZoomIn, ZoomOut, RotateCcw, Move, Brain, Maximize2, Minimize2 } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';

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
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const { toast } = useToast();

  // Debug des données
  useEffect(() => {
    console.log('=== WORKFLOW VISUALIZATION DEBUG ===');
    console.log('Workflow:', workflow);
    console.log('Nodes:', nodes);
    console.log('Connections:', connections);
    console.log('Nodes count:', nodes.length);
    console.log('Connections count:', connections.length);
  }, [workflow, nodes, connections]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => { 
    setZoom(1); 
    setPan({ x: 0, y: 0 }); 
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };

  const analyzeWorkflow = async () => {
    setIsAnalyzing(true);
    try {
      const workflowDescription = `
        Workflow: ${workflow.name}
        Description: ${workflow.description}
        Nombre de nœuds: ${nodes.length}
        Nombre de connexions: ${connections.length}
        
        Nœuds:
        ${nodes.map(node => `- ${node.name} (${node.node_type})`).join('\n')}
        
        Connexions:
        ${connections.map(conn => {
          const sourceNode = nodes.find(n => n.node_id === conn.source_node_id);
          const targetNode = nodes.find(n => n.node_id === conn.target_node_id);
          return `- ${sourceNode?.name || 'Unknown'} → ${targetNode?.name || 'Unknown'}`;
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
  };

  const getNodeColor = (nodeType: string): string => {
    const typeMap: { [key: string]: string } = {
      'n8n-nodes-base.start': '#10b981',
      'n8n-nodes-base.webhook': '#ef4444',
      'n8n-nodes-base.httpRequest': '#06b6d4',
      'n8n-nodes-base.set': '#f59e0b',
      'n8n-nodes-base.if': '#ec4899',
      'n8n-nodes-base.emailSend': '#3b82f6',
      'n8n-nodes-base.discord': '#7c3aed',
      'n8n-nodes-base.slack': '#1e293b',
      'n8n-nodes-base.telegram': '#0ea5e9',
      'n8n-nodes-base.googleSheets': '#22c55e',
      'n8n-nodes-base.mysql': '#0f766e',
      'n8n-nodes-base.postgres': '#1e40af',
      'n8n-nodes-base.mongodb': '#16a34a',
      'n8n-nodes-base.function': '#ea580c',
      'n8n-nodes-base.switch': '#9333ea',
      'n8n-nodes-base.merge': '#059669',
      'n8n-nodes-base.wait': '#db2777',
      'n8n-nodes-base.cron': '#7c2d12',
      'n8n-nodes-base.schedule': '#1d4ed8',
      'n8n-nodes-base.executeWorkflow': '#be185d'
    };
    return typeMap[nodeType] || '#6b7280';
  };

  const getNodeIcon = (nodeType: string): string => {
    if (nodeType.includes('start')) return '▶️';
    if (nodeType.includes('webhook')) return '🔗';
    if (nodeType.includes('http')) return '🌐';
    if (nodeType.includes('set')) return '⚙️';
    if (nodeType.includes('if')) return '❓';
    if (nodeType.includes('email')) return '📧';
    if (nodeType.includes('discord')) return '💬';
    if (nodeType.includes('slack')) return '💼';
    if (nodeType.includes('telegram')) return '📱';
    if (nodeType.includes('sheets')) return '📊';
    if (nodeType.includes('mysql') || nodeType.includes('postgres') || nodeType.includes('mongodb')) return '🗄️';
    if (nodeType.includes('function')) return '⚡';
    if (nodeType.includes('switch')) return '🔀';
    if (nodeType.includes('merge')) return '🔗';
    if (nodeType.includes('wait')) return '⏰';
    if (nodeType.includes('cron') || nodeType.includes('schedule')) return '📅';
    return '⚡';
  };

  // Fonction pour créer les connexions
  const createConnectionElements = () => {
    const connectionElements: JSX.Element[] = [];
    
    connections.forEach((connection, index) => {
      const sourceNode = nodes.find(n => 
        n.node_id === connection.source_node_id || 
        n.id === connection.source_node_id
      );
      
      const targetNode = nodes.find(n => 
        n.node_id === connection.target_node_id || 
        n.id === connection.target_node_id
      );

      if (!sourceNode || !targetNode) {
        return;
      }

      // Calculer les positions réelles avec les offsets
      const x1 = (sourceNode.position_x || 0) + 500 + 120; // Sortie du nœud source
      const y1 = (sourceNode.position_y || 0) + 300 + 40;  // Centre vertical
      const x2 = (targetNode.position_x || 0) + 500;       // Entrée du nœud cible  
      const y2 = (targetNode.position_y || 0) + 300 + 40;  // Centre vertical

      connectionElements.push(
        <g key={`connection-${connection.id}-${index}`}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#ff4444"
            strokeWidth="3"
            markerEnd="url(#arrowhead)"
          />
        </g>
      );
    });
    
    return connectionElements;
  };

  // Affichage de débogage si pas de données
  if (!workflow || nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Aucune donnée de workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Workflow: {workflow ? '✅ Présent' : '❌ Manquant'}<br/>
              Nœuds: {nodes.length}<br/>
              Connexions: {connections.length}
            </p>
            <Button onClick={() => window.location.reload()}>
              Recharger la page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header du workflow */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{workflow.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                  {workflow.status}
                </Badge>
                {workflow.tags && workflow.tags.length > 0 && (
                  <div className="flex space-x-1">
                    {workflow.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
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
                <p key={index} className="mb-2">{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualisation du workflow */}
      <Card className={isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Visualisation du Workflow ({nodes.length} nœuds, {connections.length} connexions)</span>
            </CardTitle>
            
            {/* Contrôles de navigation */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomIn} title="Zoomer">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut} title="Dézoomer">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetView} title="Réinitialiser la vue">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Badge variant="secondary" className="text-xs">
                Zoom: {Math.round(zoom * 100)}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={containerRef}
            className={`bg-gray-100 rounded-lg overflow-hidden relative border-2 border-gray-300 ${
              isFullscreen ? 'h-screen' : 'h-[600px]'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none' 
            }}
          >
            {/* SVG avec dimensions fixes et zoom simple */}
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox="0 0 2000 1400"
              className="bg-white"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              {/* Définitions des marqueurs */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#ff4444"
                    stroke="#000000"
                    strokeWidth="1"
                  />
                </marker>
              </defs>

              {/* Grille de fond */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* CONNEXIONS */}
              <g id="connections-layer">
                {createConnectionElements()}
              </g>

              {/* NŒUDS */}
              <g id="nodes-layer">
                {nodes.map((node, index) => {
                  // Position avec offset pour centrer le workflow
                  const nodeX = (node.position_x || 0) + 500;
                  const nodeY = (node.position_y || 0) + 300;
                  
                  return (
                    <g key={`node-${node.id || node.node_id}-${index}`}>
                      {/* Rectangle du nœud */}
                      <rect
                        x={nodeX}
                        y={nodeY}
                        width="120"
                        height="80"
                        rx="8"
                        fill={getNodeColor(node.node_type)}
                        stroke="#ffffff"
                        strokeWidth="3"
                        filter="drop-shadow(2px 4px 8px rgba(0,0,0,0.3))"
                      />
                      
                      {/* Point de connexion d'entrée */}
                      <circle
                        cx={nodeX}
                        cy={nodeY + 40}
                        r="5"
                        fill="#0066ff"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      
                      {/* Point de connexion de sortie */}
                      <circle
                        cx={nodeX + 120}
                        cy={nodeY + 40}
                        r="5"
                        fill="#ff4444"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      
                      {/* Icône du nœud */}
                      <text
                        x={nodeX + 20}
                        y={nodeY + 45}
                        fontSize="16"
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {getNodeIcon(node.node_type)}
                      </text>
                      
                      {/* Nom du nœud */}
                      <text
                        x={nodeX + 70}
                        y={nodeY + 35}
                        fontSize="11"
                        fill="white"
                        textAnchor="middle"
                        fontWeight="bold"
                        dominantBaseline="middle"
                      >
                        {node.name.length > 10 ? `${node.name.substring(0, 10)}...` : node.name}
                      </text>
                      
                      {/* Type du nœud */}
                      <text
                        x={nodeX + 70}
                        y={nodeY + 55}
                        fontSize="8"
                        fill="rgba(255,255,255,0.8)"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {node.node_type.split('.').pop()?.substring(0, 12)}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
            
            {/* Instructions d'utilisation */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs space-y-1 border">
              <div className="font-semibold text-gray-800">🎛️ Navigation:</div>
              <div className="text-gray-600">• Glisser pour déplacer</div>
              <div className="text-gray-600">• Molette pour zoomer</div>
              <div className="text-gray-600">• Boutons pour contrôles</div>
            </div>
            
            {/* Infos de debug */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs border">
              <div className="font-semibold text-gray-800">🔍 Debug:</div>
              <div className="text-gray-600">Nœuds: {nodes.length}</div>
              <div className="text-gray-600">Connexions: {connections.length}</div>
              <div className="text-gray-600">Zoom: {Math.round(zoom * 100)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
