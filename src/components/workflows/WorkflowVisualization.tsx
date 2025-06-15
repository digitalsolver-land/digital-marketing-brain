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

  // Debug complet des connexions
  useEffect(() => {
    console.log('=== ANALYSE COMPLÈTE DES CONNEXIONS ===');
    console.log('Nombre de nœuds:', nodes.length);
    console.log('Nombre de connexions:', connections.length);
    
    // Vérifier chaque nœud
    nodes.forEach((node, index) => {
      console.log(`Nœud ${index}:`, {
        id: node.id,
        node_id: node.node_id,
        name: node.name,
        type: node.node_type,
        position: { x: node.position_x, y: node.position_y }
      });
    });
    
    // Vérifier chaque connexion
    connections.forEach((conn, index) => {
      const sourceNode = nodes.find(n => n.node_id === conn.source_node_id);
      const targetNode = nodes.find(n => n.node_id === conn.target_node_id);
      
      console.log(`Connexion ${index}:`, {
        id: conn.id,
        source_node_id: conn.source_node_id,
        target_node_id: conn.target_node_id,
        source_found: !!sourceNode,
        target_found: !!targetNode,
        connection_type: conn.connection_type
      });
      
      if (sourceNode && targetNode) {
        console.log(`  -> Connexion VALIDE: ${sourceNode.name} → ${targetNode.name}`);
      } else {
        console.log(`  -> Connexion INVALIDE: nœud source ou cible introuvable`);
      }
    });
  }, [nodes, connections]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

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

  // Fonction pour créer les connexions - VERSION SIMPLIFIÉE ET GARANTIE
  const createConnectionElements = () => {
    const connectionElements: JSX.Element[] = [];
    
    console.log('=== CRÉATION DES CONNEXIONS ===');
    
    connections.forEach((connection, index) => {
      // Recherche des nœuds avec plusieurs critères
      const sourceNode = nodes.find(n => 
        n.node_id === connection.source_node_id || 
        n.id === connection.source_node_id
      );
      
      const targetNode = nodes.find(n => 
        n.node_id === connection.target_node_id || 
        n.id === connection.target_node_id
      );

      if (!sourceNode || !targetNode) {
        console.warn(`Connexion ${index} ignorée - nœuds manquants:`, {
          source_id: connection.source_node_id,
          target_id: connection.target_node_id,
          source_found: !!sourceNode,
          target_found: !!targetNode
        });
        return;
      }

      // Calcul des positions SIMPLES
      const x1 = sourceNode.position_x + 140; // Sortie du nœud source
      const y1 = sourceNode.position_y + 40;  // Centre vertical
      const x2 = targetNode.position_x;       // Entrée du nœud cible  
      const y2 = targetNode.position_y + 40;  // Centre vertical

      console.log(`Connexion ${index} créée:`, {
        from: `${sourceNode.name} (${x1}, ${y1})`,
        to: `${targetNode.name} (${x2}, ${y2})`
      });

      // Couleur selon le type
      const isMainConnection = !connection.connection_type || connection.connection_type === 'main';
      const strokeColor = isMainConnection ? '#ff0000' : '#0000ff'; // Rouge vif ou bleu vif
      
      // Élément de connexion
      connectionElements.push(
        <g key={`connection-${connection.id}-${index}`}>
          {/* Ligne de fond noire pour contraste */}
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#000000"
            strokeWidth="8"
            opacity="0.3"
          />
          
          {/* Ligne principale colorée */}
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={strokeColor}
            strokeWidth="4"
            strokeDasharray={isMainConnection ? "none" : "10,5"}
            markerEnd="url(#arrowhead)"
          />
          
          {/* Ligne d'animation blanche */}
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="8,12"
            opacity="0.8"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="20;0"
              dur="2s"
              repeatCount="indefinite"
            />
          </line>
        </g>
      );
    });
    
    console.log(`${connectionElements.length} connexion(s) créée(s)`);
    return connectionElements;
  };

  // Calcul des dimensions du canvas
  const getCanvasBounds = () => {
    if (nodes.length === 0) {
      return { width: 1200, height: 800 };
    }

    const minX = Math.min(...nodes.map(n => n.position_x)) - 100;
    const maxX = Math.max(...nodes.map(n => n.position_x)) + 300;
    const minY = Math.min(...nodes.map(n => n.position_y)) - 100;
    const maxY = Math.max(...nodes.map(n => n.position_y)) + 200;
    
    return {
      width: maxX - minX,
      height: maxY - minY
    };
  };

  const canvasBounds = getCanvasBounds();

  const transformStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
  };

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
                <Move className="w-3 h-3 mr-1" />
                Glisser pour naviguer
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Zoom: {Math.round(zoom * 100)}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={containerRef}
            className={`bg-gray-50 rounded-lg p-4 overflow-hidden cursor-grab active:cursor-grabbing relative border-2 border-slate-300 ${
              isFullscreen ? 'h-screen' : 'min-h-[700px]'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ userSelect: 'none' }}
          >
            <div style={transformStyle}>
              <svg
                ref={svgRef}
                width={canvasBounds.width}
                height={canvasBounds.height}
                className="w-full h-full bg-white border border-gray-300"
                style={{ minWidth: '100%', minHeight: '100%' }}
              >
                {/* Définition des marqueurs de flèches */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#ff0000"
                      stroke="#000000"
                      strokeWidth="1"
                    />
                  </marker>
                </defs>

                {/* RENDU DES CONNEXIONS */}
                <g id="connections-layer">
                  {createConnectionElements()}
                </g>

                {/* RENDU DES NŒUDS */}
                <g id="nodes-layer">
                  {nodes.map((node, index) => (
                    <g key={`node-${node.id || node.node_id}-${index}`}>
                      {/* Rectangle du nœud */}
                      <rect
                        x={node.position_x}
                        y={node.position_y}
                        width="140"
                        height="80"
                        rx="12"
                        fill={getNodeColor(node.node_type)}
                        stroke="#ffffff"
                        strokeWidth="3"
                        filter="drop-shadow(2px 4px 8px rgba(0,0,0,0.3))"
                      />
                      
                      {/* Point de connexion d'entrée (gauche) */}
                      <circle
                        cx={node.position_x}
                        cy={node.position_y + 40}
                        r="6"
                        fill="#0000ff"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      
                      {/* Point de connexion de sortie (droite) */}
                      <circle
                        cx={node.position_x + 140}
                        cy={node.position_y + 40}
                        r="6"
                        fill="#ff0000"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      
                      {/* Icône du nœud */}
                      <text
                        x={node.position_x + 25}
                        y={node.position_y + 50}
                        fontSize="18"
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {getNodeIcon(node.node_type)}
                      </text>
                      
                      {/* Nom du nœud */}
                      <text
                        x={node.position_x + 85}
                        y={node.position_y + 35}
                        fontSize="12"
                        fill="white"
                        textAnchor="middle"
                        fontWeight="bold"
                        dominantBaseline="middle"
                      >
                        {node.name.length > 12 ? `${node.name.substring(0, 12)}...` : node.name}
                      </text>
                      
                      {/* Type du nœud */}
                      <text
                        x={node.position_x + 85}
                        y={node.position_y + 52}
                        fontSize="9"
                        fill="rgba(255,255,255,0.8)"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {node.node_type.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim().substring(0, 15)}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
            </div>
            
            {/* Instructions d'utilisation */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg text-xs space-y-2 border">
              <div className="font-semibold text-gray-800">🎛️ Navigation:</div>
              <div className="text-gray-600">• 🖱️ Clic + glisser pour déplacer</div>
              <div className="text-gray-600">• 🔍 Molette pour zoomer/dézoomer</div>
              <div className="text-gray-600">• 🎯 Boutons pour contrôles précis</div>
              <div className="text-gray-600">• 📺 Plein écran disponible</div>
            </div>
            
            {/* Légende des connexions */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg text-xs space-y-3 border">
              <div className="font-semibold text-gray-800">🔗 Connexions:</div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-0.5 bg-red-600 rounded"></div>
                <span className="text-gray-600">Flux principal</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-0.5 bg-blue-600 rounded border-dashed"></div>
                <span className="text-gray-600">Flux conditionnel</span>
              </div>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-4 mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{nodes.length}</div>
              <div className="text-sm text-gray-600">Nœuds</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{connections.length}</div>
              <div className="text-sm text-gray-600">Connexions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {workflow.status === 'active' ? '✅' : '⏸️'}
              </div>
              <div className="text-sm text-gray-600">
                {workflow.status === 'active' ? 'Actif' : 'Inactif'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {Math.round(zoom * 100)}%
              </div>
              <div className="text-sm text-gray-600">Zoom</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
