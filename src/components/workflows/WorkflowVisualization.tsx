
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

// Inject CSS animations
const injectStyles = () => {
  const styleId = 'workflow-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    @keyframes connectionFlow {
      0% { stroke-dashoffset: 20; }
      100% { stroke-dashoffset: 0; }
    }
    .workflow-connection {
      animation: connectionFlow 2s linear infinite;
    }
  `;
  document.head.appendChild(style);
};

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
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState('0 0 1200 800');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (nodes.length > 0) {
      const minX = Math.min(...nodes.map(n => n.position_x)) - 200;
      const maxX = Math.max(...nodes.map(n => n.position_x)) + 300;
      const minY = Math.min(...nodes.map(n => n.position_y)) - 200;
      const maxY = Math.max(...nodes.map(n => n.position_y)) + 300;
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      setViewBox(`${minX} ${minY} ${width} ${height}`);
      setPan({ x: 0, y: 0 });
      setZoom(0.8);
    }
  }, [nodes]);

  // Debug: Log nodes and connections to understand the data structure
  useEffect(() => {
    console.log('=== DEBUG WORKFLOW VISUALIZATION ===');
    console.log('Nodes:', nodes.map(n => ({ id: n.id, node_id: n.node_id, name: n.name, x: n.position_x, y: n.position_y })));
    console.log('Connections:', connections.map(c => ({ 
      id: c.id, 
      source: c.source_node_id, 
      target: c.target_node_id,
      sourceExists: nodes.some(n => n.node_id === c.source_node_id),
      targetExists: nodes.some(n => n.node_id === c.target_node_id)
    })));
  }, [nodes, connections]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 0.3));
  const handleResetView = () => { setZoom(0.8); setPan({ x: 0, y: 0 }); };

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
    setZoom(prev => Math.max(0.3, Math.min(4, prev * delta)));
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

  // Fonction améliorée pour calculer les chemins de connexion
  const getConnectionPath = (connection: WorkflowConnection): string => {
    // Recherche des nœuds par différents champs pour assurer la compatibilité
    const sourceNode = nodes.find(n => 
      n.node_id === connection.source_node_id || 
      n.id === connection.source_node_id ||
      n.node_id === connection.source_node_id.toString()
    );
    
    const targetNode = nodes.find(n => 
      n.node_id === connection.target_node_id || 
      n.id === connection.target_node_id ||
      n.node_id === connection.target_node_id.toString()
    );
    
    if (!sourceNode || !targetNode) {
      console.warn('Nœud manquant pour la connexion:', {
        connection,
        sourceFound: !!sourceNode,
        targetFound: !!targetNode,
        availableNodes: nodes.map(n => ({ id: n.id, node_id: n.node_id }))
      });
      return '';
    }

    // Calcul des positions de connexion
    const sourceX = sourceNode.position_x + 140; // Sortie du nœud (côté droit)
    const sourceY = sourceNode.position_y + 40;  // Centre vertical
    const targetX = targetNode.position_x;       // Entrée du nœud (côté gauche)
    const targetY = targetNode.position_y + 40;  // Centre vertical

    // Créer une courbe de Bézier pour un rendu fluide
    const deltaX = targetX - sourceX;
    const controlOffset = Math.min(Math.abs(deltaX) / 2, 150);
    const controlX1 = sourceX + controlOffset;
    const controlX2 = targetX - controlOffset;
    
    return `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY} ${controlX2} ${targetY} ${targetX} ${targetY}`;
  };

  const transformStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
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
            className={`bg-white dark:bg-gray-900 rounded-lg p-4 overflow-hidden cursor-grab active:cursor-grabbing relative border-2 border-slate-200 dark:border-gray-700 ${
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
                viewBox={viewBox}
                className={`w-full ${isFullscreen ? 'h-screen' : 'h-[700px]'}`}
                style={{ 
                  background: `
                    radial-gradient(circle at 20px 20px, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                    radial-gradient(circle at 60px 60px, rgba(148, 163, 184, 0.05) 1px, transparent 1px)
                  `, 
                  backgroundSize: `${40 * zoom}px ${40 * zoom}px, ${120 * zoom}px ${120 * zoom}px`
                }}
              >
                {/* Définitions pour les marqueurs et effets */}
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
                      fill="#FF6B6B"
                      stroke="#000"
                      strokeWidth="0.5"
                    />
                  </marker>
                  
                  <marker
                    id="arrowhead-secondary"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#4ECDC4"
                      stroke="#000"
                      strokeWidth="0.5"
                    />
                  </marker>
                  
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Rendu des connexions avec une logique robuste */}
                {connections.map((connection, index) => {
                  const path = getConnectionPath(connection);
                  if (!path) return null;
                  
                  const isMainConnection = !connection.connection_type || connection.connection_type === 'main';
                  const connectionColor = isMainConnection ? '#FF6B6B' : '#4ECDC4';
                  
                  return (
                    <g key={`connection-${connection.id}-${index}`}>
                      {/* Ligne de fond pour le contraste */}
                      <path
                        d={path}
                        stroke="#000"
                        strokeWidth="8"
                        fill="none"
                        opacity="0.3"
                      />
                      
                      {/* Ligne principale colorée */}
                      <path
                        d={path}
                        stroke={connectionColor}
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray={isMainConnection ? "none" : "8,4"}
                        markerEnd={isMainConnection ? "url(#arrowhead)" : "url(#arrowhead-secondary)"}
                        filter="url(#glow)"
                        className="workflow-connection"
                        opacity="0.9"
                      />
                      
                      {/* Ligne d'animation */}
                      <path
                        d={path}
                        stroke="#fff"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="10,20"
                        opacity="0.6"
                        className="workflow-connection"
                      />
                    </g>
                  );
                })}

                {/* Rendu des nœuds */}
                {nodes.map((node, index) => (
                  <g key={`node-${node.id}-${index}`} transform={`translate(${node.position_x}, ${node.position_y})`}>
                    {/* Rectangle du nœud */}
                    <rect
                      width="140"
                      height="80"
                      rx="12"
                      fill={getNodeColor(node.node_type)}
                      stroke="#ffffff"
                      strokeWidth="3"
                      style={{
                        filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.3))'
                      }}
                    />
                    
                    {/* Points de connexion d'entrée (gauche) */}
                    <circle
                      cx="0"
                      cy="40"
                      r="6"
                      fill="#4ECDC4"
                      stroke="#000"
                      strokeWidth="2"
                    />
                    
                    {/* Points de connexion de sortie (droite) */}
                    <circle
                      cx="140"
                      cy="40"
                      r="6"
                      fill="#FF6B6B"
                      stroke="#000"
                      strokeWidth="2"
                    />
                    
                    {/* Icône du nœud */}
                    <text
                      x="25"
                      y="50"
                      fontSize="18"
                      fill="white"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {getNodeIcon(node.node_type)}
                    </text>
                    
                    {/* Nom du nœud */}
                    <text
                      x="85"
                      y="35"
                      fontSize="12"
                      fill="white"
                      textAnchor="middle"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.name.length > 12 ? `${node.name.substring(0, 12)}...` : node.name}
                    </text>
                    
                    {/* Type du nœud */}
                    <text
                      x="85"
                      y="52"
                      fontSize="9"
                      fill="rgba(255,255,255,0.8)"
                      textAnchor="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.node_type.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim().substring(0, 15)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            
            {/* Instructions d'utilisation */}
            <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4 rounded-lg shadow-lg text-xs space-y-2 border border-slate-200 dark:border-gray-700">
              <div className="font-semibold text-gray-800 dark:text-gray-200">🎛️ Navigation:</div>
              <div className="text-gray-600 dark:text-gray-400">• 🖱️ Clic + glisser pour déplacer</div>
              <div className="text-gray-600 dark:text-gray-400">• 🔍 Molette pour zoomer/dézoomer</div>
              <div className="text-gray-600 dark:text-gray-400">• 🎯 Boutons pour contrôles précis</div>
              <div className="text-gray-600 dark:text-gray-400">• 📺 Plein écran disponible</div>
            </div>
            
            {/* Légende des connexions */}
            <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4 rounded-lg shadow-lg text-xs space-y-3 border border-slate-200 dark:border-gray-700">
              <div className="font-semibold text-gray-800 dark:text-gray-200">🔗 Connexions:</div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-0.5 bg-red-400 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">Flux principal</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-0.5 bg-teal-400 rounded" style={{background: 'repeating-linear-gradient(to right, #4ECDC4 0, #4ECDC4 4px, transparent 4px, transparent 8px)'}}></div>
                <span className="text-gray-600 dark:text-gray-400">Flux conditionnel</span>
              </div>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-4 mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-slate-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{nodes.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Nœuds</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{connections.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Connexions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {workflow.status === 'active' ? '✅' : '⏸️'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {workflow.status === 'active' ? 'Actif' : 'Inactif'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {Math.round(zoom * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Zoom</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
