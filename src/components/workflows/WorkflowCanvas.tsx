
import React, { useRef, useEffect, useState, useCallback } from 'react';

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

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  zoom: number;
  pan: { x: number; y: number };
  onNodeClick?: (node: WorkflowNode) => void;
  onCanvasClick?: (x: number, y: number) => void;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 80;
const GRID_SIZE = 20;

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  connections,
  zoom,
  pan,
  onNodeClick,
  onCanvasClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });

  const getNodeColor = useCallback((nodeType: string): string => {
    const colorMap: { [key: string]: string } = {
      'n8n-nodes-base.start': '#10b981',
      'n8n-nodes-base.webhook': '#ef4444',
      'n8n-nodes-base.httpRequest': '#06b6d4',
      'n8n-nodes-base.set': '#f59e0b',
      'n8n-nodes-base.if': '#ec4899',
      'n8n-nodes-base.emailSend': '#3b82f6',
      'n8n-nodes-base.discord': '#7c3aed',
      'n8n-nodes-base.slack': '#4a5568',
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
    return colorMap[nodeType] || '#6b7280';
  }, []);

  const getNodeIcon = useCallback((nodeType: string): string => {
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
  }, []);

  const transformX = useCallback((x: number): number => {
    return (x + pan.x) * zoom + canvasSize.width / 2;
  }, [pan.x, zoom, canvasSize.width]);

  const transformY = useCallback((y: number): number => {
    return (y + pan.y) * zoom + canvasSize.height / 2;
  }, [pan.y, zoom, canvasSize.height]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    const gridSpacing = GRID_SIZE * zoom;
    const offsetX = (pan.x * zoom) % gridSpacing;
    const offsetY = (pan.y * zoom) % gridSpacing;
    
    // Lignes verticales
    for (let x = offsetX; x < canvasSize.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    
    // Lignes horizontales
    for (let y = offsetY; y < canvasSize.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }
  }, [pan, zoom, canvasSize]);

  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: WorkflowNode) => {
    const x = transformX(node.position_x);
    const y = transformY(node.position_y);
    const width = NODE_WIDTH * zoom;
    const height = NODE_HEIGHT * zoom;
    
    // Vérifier si le nœud est visible
    if (x + width < 0 || x > canvasSize.width || y + height < 0 || y > canvasSize.height) {
      return;
    }
    
    // Fond du nœud
    ctx.fillStyle = getNodeColor(node.node_type);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // Rectangle arrondi
    const radius = 8 * zoom;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    ctx.stroke();
    
    // Point de connexion d'entrée (gauche)
    ctx.fillStyle = '#4f46e5';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y + height / 2, 6 * zoom, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Point de connexion de sortie (droite)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x + width, y + height / 2, 6 * zoom, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Texte du nœud
    if (zoom > 0.5) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(10, 12 * zoom)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Nom du nœud
      const maxWidth = width - 20 * zoom;
      let displayName = node.name;
      ctx.font = `bold ${Math.max(10, 12 * zoom)}px Inter, system-ui, sans-serif`;
      
      // Tronquer le texte si nécessaire
      if (ctx.measureText(displayName).width > maxWidth) {
        while (ctx.measureText(displayName + '...').width > maxWidth && displayName.length > 1) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      
      ctx.fillText(displayName, x + width / 2, y + height / 2 - 8 * zoom);
      
      // Type de nœud
      ctx.font = `${Math.max(8, 10 * zoom)}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const nodeType = node.node_type.split('.').pop() || '';
      const displayType = nodeType.length > 15 ? nodeType.substring(0, 15) + '...' : nodeType;
      ctx.fillText(displayType, x + width / 2, y + height / 2 + 8 * zoom);
      
      // Icône
      if (zoom > 0.7) {
        ctx.font = `${Math.max(14, 16 * zoom)}px Arial`;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(getNodeIcon(node.node_type), x + 15 * zoom, y + height / 2);
      }
    }
  }, [transformX, transformY, zoom, canvasSize, getNodeColor, getNodeIcon]);

  const drawConnection = useCallback((ctx: CanvasRenderingContext2D, connection: WorkflowConnection) => {
    const sourceNode = nodes.find(n => n.node_id === connection.source_node_id || n.id === connection.source_node_id);
    const targetNode = nodes.find(n => n.node_id === connection.target_node_id || n.id === connection.target_node_id);
    
    if (!sourceNode || !targetNode) return;
    
    const x1 = transformX(sourceNode.position_x) + NODE_WIDTH * zoom;
    const y1 = transformY(sourceNode.position_y) + (NODE_HEIGHT * zoom) / 2;
    const x2 = transformX(targetNode.position_x);
    const y2 = transformY(targetNode.position_y) + (NODE_HEIGHT * zoom) / 2;
    
    // Courbe de Bézier pour la connexion
    const cpx1 = x1 + 50 * zoom;
    const cpy1 = y1;
    const cpx2 = x2 - 50 * zoom;
    const cpy2 = y2;
    
    // Ligne de connexion
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2 * zoom;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
    ctx.stroke();
    
    // Flèche à la fin
    const angle = Math.atan2(y2 - cpy2, x2 - cpx2);
    const arrowSize = 8 * zoom;
    
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowSize * Math.cos(angle - Math.PI / 6),
      y2 - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - arrowSize * Math.cos(angle + Math.PI / 6),
      y2 - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }, [nodes, transformX, transformY, zoom]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Configuration du canvas
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fond
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grille
    drawGrid(ctx);
    
    // Dessiner les connexions d'abord
    connections.forEach(connection => drawConnection(ctx, connection));
    
    // Dessiner les nœuds
    nodes.forEach(node => drawNode(ctx, node));
    
  }, [nodes, connections, drawGrid, drawConnection, drawNode]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Vérifier si on a cliqué sur un nœud
    for (const node of nodes) {
      const nodeX = transformX(node.position_x);
      const nodeY = transformY(node.position_y);
      const nodeWidth = NODE_WIDTH * zoom;
      const nodeHeight = NODE_HEIGHT * zoom;
      
      if (clickX >= nodeX && clickX <= nodeX + nodeWidth &&
          clickY >= nodeY && clickY <= nodeY + nodeHeight) {
        onNodeClick?.(node);
        return;
      }
    }
    
    // Clic sur le canvas vide
    const worldX = (clickX - canvasSize.width / 2) / zoom - pan.x;
    const worldY = (clickY - canvasSize.height / 2) / zoom - pan.y;
    onCanvasClick?.(worldX, worldY);
  }, [nodes, transformX, transformY, zoom, pan, canvasSize, onNodeClick, onCanvasClick]);

  // Redimensionnement du canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      
      const container = canvas.parentElement;
      const rect = container.getBoundingClientRect();
      const width = Math.max(800, rect.width);
      const height = Math.max(600, rect.height);
      
      setCanvasSize({ width, height });
      
      // Configuration haute résolution
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redessiner quand les props changent
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="block border border-gray-300 rounded-lg bg-gray-50 cursor-crosshair"
      onClick={handleCanvasClick}
    />
  );
};
