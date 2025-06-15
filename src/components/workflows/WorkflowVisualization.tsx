
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Settings, Trash2, Eye } from 'lucide-react';

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
  const [viewBox, setViewBox] = useState('0 0 800 600');

  useEffect(() => {
    if (nodes.length > 0) {
      // Calculer les limites du workflow
      const minX = Math.min(...nodes.map(n => n.position_x)) - 100;
      const maxX = Math.max(...nodes.map(n => n.position_x)) + 200;
      const minY = Math.min(...nodes.map(n => n.position_y)) - 100;
      const maxY = Math.max(...nodes.map(n => n.position_y)) + 200;
      
      setViewBox(`${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
    }
  }, [nodes]);

  const getNodeColor = (nodeType: string): string => {
    const typeMap: { [key: string]: string } = {
      'n8n-nodes-base.start': '#00d26e',
      'n8n-nodes-base.webhook': '#ff6b6b',
      'n8n-nodes-base.httpRequest': '#4ecdc4',
      'n8n-nodes-base.set': '#feca57',
      'n8n-nodes-base.if': '#ff9ff3',
      'n8n-nodes-base.emailSend': '#54a0ff',
      'n8n-nodes-base.discord': '#7289da',
      'n8n-nodes-base.slack': '#4a154b',
      'n8n-nodes-base.telegram': '#0088cc',
      'n8n-nodes-base.googleSheets': '#34a853',
      'n8n-nodes-base.mysql': '#00618a',
      'n8n-nodes-base.postgres': '#336791',
      'n8n-nodes-base.mongodb': '#47a248',
      'n8n-nodes-base.function': '#ff6b35',
      'n8n-nodes-base.switch': '#a55eea',
      'n8n-nodes-base.merge': '#26de81',
      'n8n-nodes-base.wait': '#fd79a8',
      'n8n-nodes-base.cron': '#6c5ce7',
      'n8n-nodes-base.schedule': '#74b9ff',
      'n8n-nodes-base.executeWorkflow': '#fd79a8'
    };
    return typeMap[nodeType] || '#666666';
  };

  const getNodeIcon = (nodeType: string): string => {
    if (nodeType.includes('start')) return '▶';
    if (nodeType.includes('webhook')) return '🔗';
    if (nodeType.includes('http')) return '🌐';
    if (nodeType.includes('set')) return '⚙️';
    if (nodeType.includes('if')) return '❓';
    if (nodeType.includes('email')) return '📧';
    if (nodeType.includes('discord')) return '💬';
    if (nodeType.includes('slack')) return '💬';
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

  const getConnectionPath = (connection: WorkflowConnection): string => {
    const sourceNode = nodes.find(n => n.node_id === connection.source_node_id);
    const targetNode = nodes.find(n => n.node_id === connection.target_node_id);
    
    if (!sourceNode || !targetNode) return '';

    const sourceX = sourceNode.position_x + 100; // Centre du nœud source + largeur/2
    const sourceY = sourceNode.position_y + 25; // Centre du nœud source + hauteur/2
    const targetX = targetNode.position_x;
    const targetY = targetNode.position_y + 25;

    // Création d'une courbe de Bézier simple
    const midX = (sourceX + targetX) / 2;
    
    return `M ${sourceX} ${sourceY} Q ${midX} ${sourceY} ${midX} ${(sourceY + targetY) / 2} Q ${midX} ${targetY} ${targetX} ${targetY}`;
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

      {/* Visualisation du workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Visualisation du Workflow</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[400px] overflow-auto">
            <svg
              ref={svgRef}
              viewBox={viewBox}
              className="w-full h-full min-h-[400px]"
              style={{ background: 'linear-gradient(to right, #f8f9fa 1px, transparent 1px), linear-gradient(to bottom, #f8f9fa 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            >
              {/* Dessiner les connexions d'abord */}
              {connections.map((connection) => (
                <g key={connection.id}>
                  <path
                    d={getConnectionPath(connection)}
                    stroke="#666"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={connection.connection_type === 'main' ? 'none' : '5,5'}
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              ))}

              {/* Définir le marqueur de flèche */}
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
                    fill="#666"
                  />
                </marker>
              </defs>

              {/* Dessiner les nœuds */}
              {nodes.map((node) => (
                <g key={node.id} transform={`translate(${node.position_x}, ${node.position_y})`}>
                  {/* Rectangle du nœud */}
                  <rect
                    width="100"
                    height="50"
                    rx="8"
                    fill={getNodeColor(node.node_type)}
                    stroke="#333"
                    strokeWidth="1"
                    className="drop-shadow-sm"
                  />
                  
                  {/* Icône du nœud */}
                  <text
                    x="15"
                    y="30"
                    fontSize="16"
                    fill="white"
                    textAnchor="middle"
                  >
                    {getNodeIcon(node.node_type)}
                  </text>
                  
                  {/* Nom du nœud */}
                  <text
                    x="55"
                    y="28"
                    fontSize="10"
                    fill="white"
                    textAnchor="middle"
                    className="font-medium"
                  >
                    {node.name.length > 12 ? `${node.name.substring(0, 12)}...` : node.name}
                  </text>
                  
                  {/* Type du nœud */}
                  <text
                    x="55"
                    y="40"
                    fontSize="7"
                    fill="rgba(255,255,255,0.8)"
                    textAnchor="middle"
                  >
                    {node.node_type.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          
          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg border">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{nodes.length}</div>
              <div className="text-sm text-gray-600">Nœuds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{connections.length}</div>
              <div className="text-sm text-gray-600">Connexions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {workflow.status === 'active' ? 'Actif' : 'Inactif'}
              </div>
              <div className="text-sm text-gray-600">Statut</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
