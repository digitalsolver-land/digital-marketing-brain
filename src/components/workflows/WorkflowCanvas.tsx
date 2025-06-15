
import React, { useRef, useEffect, useState } from 'react';

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
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  connections,
  zoom,
  pan
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    const gridSize = 50 * zoom;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;
    
    // Vertical lines
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: WorkflowNode) => {
    const x = (node.position_x + pan.x) * zoom + canvasSize.width / 2;
    const y = (node.position_y + pan.y) * zoom + canvasSize.height / 2;
    const width = 120 * zoom;
    const height = 80 * zoom;
    
    // Node background
    ctx.fillStyle = getNodeColor(node.node_type);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * zoom;
    
    // Rounded rectangle
    const radius = 8 * zoom;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    ctx.stroke();
    
    // Input connection point
    ctx.fillStyle = '#0066ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * zoom;
    ctx.beginPath();
    ctx.arc(x, y + height / 2, 5 * zoom, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Output connection point
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(x + width, y + height / 2, 5 * zoom, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Node text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(10, 11 * zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Node name
    const displayName = node.name.length > 10 ? `${node.name.substring(0, 10)}...` : node.name;
    ctx.fillText(displayName, x + width / 2, y + height / 2 - 10 * zoom);
    
    // Node type
    ctx.font = `${Math.max(8, 8 * zoom)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const nodeType = node.node_type.split('.').pop()?.substring(0, 12) || '';
    ctx.fillText(nodeType, x + width / 2, y + height / 2 + 10 * zoom);
    
    // Icon (emoji)
    ctx.font = `${Math.max(12, 16 * zoom)}px Arial`;
    ctx.fillStyle = 'white';
    ctx.fillText(getNodeIcon(node.node_type), x + 20 * zoom, y + height / 2);
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, connection: WorkflowConnection) => {
    const sourceNode = nodes.find(n => n.node_id === connection.source_node_id || n.id === connection.source_node_id);
    const targetNode = nodes.find(n => n.node_id === connection.target_node_id || n.id === connection.target_node_id);
    
    if (!sourceNode || !targetNode) return;
    
    const x1 = (sourceNode.position_x + pan.x) * zoom + canvasSize.width / 2 + 120 * zoom;
    const y1 = (sourceNode.position_y + pan.y) * zoom + canvasSize.height / 2 + 40 * zoom;
    const x2 = (targetNode.position_x + pan.x) * zoom + canvasSize.width / 2;
    const y2 = (targetNode.position_y + pan.y) * zoom + canvasSize.height / 2 + 40 * zoom;
    
    // Draw connection line
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 3 * zoom;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Draw arrow
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = 10 * zoom;
    const arrowAngle = Math.PI / 6;
    
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle - arrowAngle),
      y2 - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      x2 - arrowLength * Math.cos(angle + arrowAngle),
      y2 - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Draw connections first (behind nodes)
    connections.forEach(connection => drawConnection(ctx, connection));
    
    // Draw nodes
    nodes.forEach(node => drawNode(ctx, node));
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;
      
      const rect = canvas.parentElement.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
      
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    draw();
  }, [nodes, connections, zoom, pan, canvasSize]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      className="w-full h-full bg-white"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
