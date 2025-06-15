
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { n8nApi, N8nWorkflow, ConnectionStatus } from '@/services/n8nApi';

export const useN8nWorkflows = () => {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connected, setConnected] = useState(false);

  // Vérifier la connexion
  const checkConnection = async () => {
    setLoading(true);
    try {
      const result = await n8nApi.checkConnection();
      setConnectionStatus(result.status);
      setConnected(result.status === 'connected');
      
      if (result.status === 'connected') {
        toast({
          title: "n8n connecté ✅",
          description: "Connexion établie avec succès",
        });
        await loadWorkflows();
      } else {
        toast({
          variant: "destructive",
          title: "Erreur connexion n8n ❌",
          description: result.error || "Impossible de se connecter",
        });
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      setConnected(false);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Charger les workflows
  const loadWorkflows = async () => {
    if (!connected) return;
    
    setLoading(true);
    try {
      const result = await n8nApi.getWorkflows();
      setWorkflows(result.data);
      console.log(`✅ ${result.data.length} workflows chargés`);
    } catch (error) {
      console.error('Erreur chargement workflows:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les workflows",
      });
    } finally {
      setLoading(false);
    }
  };

  // Activer/désactiver workflow
  const toggleWorkflow = async (workflow: N8nWorkflow) => {
    if (!workflow.id) return;

    try {
      if (workflow.active) {
        await n8nApi.deactivateWorkflow(workflow.id);
      } else {
        await n8nApi.activateWorkflow(workflow.id);
      }

      setWorkflows(prev => 
        prev.map(w => w.id === workflow.id ? { ...w, active: !w.active } : w)
      );

      toast({
        title: workflow.active ? "Workflow désactivé" : "Workflow activé",
        description: `"${workflow.name}" ${workflow.active ? 'désactivé' : 'activé'}`,
      });
    } catch (error) {
      console.error('Erreur toggle workflow:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le workflow",
      });
    }
  };

  // Supprimer workflow
  const deleteWorkflow = async (workflow: N8nWorkflow) => {
    if (!workflow.id) return;

    const confirmed = window.confirm(`Supprimer "${workflow.name}" ?`);
    if (!confirmed) return;

    try {
      await n8nApi.deleteWorkflow(workflow.id);
      setWorkflows(prev => prev.filter(w => w.id !== workflow.id));
      
      toast({
        title: "Workflow supprimé",
        description: `"${workflow.name}" a été supprimé`,
      });
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le workflow",
      });
    }
  };

  // Ouvrir dans n8n
  const openInN8n = (workflow: N8nWorkflow) => {
    if (workflow.id) {
      window.open(n8nApi.getWorkflowUrl(workflow.id), '_blank');
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return {
    workflows,
    loading,
    connected,
    connectionStatus,
    checkConnection,
    loadWorkflows,
    toggleWorkflow,
    deleteWorkflow,
    openInN8n
  };
};
