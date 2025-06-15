
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, RefreshCw } from 'lucide-react';

import { unifiedN8nService } from '@/services/unifiedN8nService';

interface WorkflowCreatorProps {
  connected: boolean;
  onWorkflowCreated?: () => void;
}

export const WorkflowCreator: React.FC<WorkflowCreatorProps> = ({
  connected,
  onWorkflowCreated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le nom du workflow est requis",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Création workflow:', formData.name);

      const workflowData = {
        name: formData.name.trim(),
        nodes: [
          {
            id: 'start',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            position: [250, 300] as [number, number],
            parameters: {}
          }
        ],
        connections: {},
        active: formData.active,
        settings: {
          saveExecutionProgress: true,
          saveManualExecutions: true,
          saveDataErrorExecution: 'all' as const,
          saveDataSuccessExecution: 'all' as const,
          executionTimeout: 3600,
          timezone: 'Europe/Paris'
        }
      };

      await unifiedN8nService.createWorkflow(workflowData);
      
      toast({
        title: "Workflow créé",
        description: `Le workflow "${formData.name}" a été créé avec succès`,
      });

      // Reset du formulaire
      setFormData({ name: '', description: '', active: false });
      
      // Notifier le parent
      onWorkflowCreated?.();
      
    } catch (error) {
      console.error('❌ Erreur création workflow:', error);
      toast({
        variant: "destructive",
        title: "Erreur de création",
        description: error instanceof Error ? error.message : "Impossible de créer le workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ name: '', description: '', active: false });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un nouveau workflow</CardTitle>
        <CardDescription>
          Créez un workflow d'automatisation avec n8n
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Nom du workflow *</Label>
            <Input
              id="workflow-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Mon workflow automatisé"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="workflow-description">Description</Label>
            <Textarea
              id="workflow-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du workflow et de son objectif"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="workflow-active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label htmlFor="workflow-active">Activer immédiatement</Label>
          </div>

          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={loading || !formData.name.trim() || !connected}
              className="flex-1"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              <Plus className="w-4 h-4 mr-2" />
              Créer le workflow
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              Réinitialiser
            </Button>
          </div>

          {!connected && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Configuration requise:</strong> Configurez votre connexion n8n dans l'onglet "Configuration" pour créer des workflows.
              </p>
            </div>
          )}
        </form>

        {/* Informations sur le workflow */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-medium mb-2">À propos des nouveaux workflows :</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Chaque workflow démarre avec un nœud "Start" de base</li>
            <li>• Vous pourrez ajouter des nœuds et configurer les connexions dans l'éditeur n8n</li>
            <li>• Les workflows peuvent être activés/désactivés à tout moment</li>
            <li>• L'historique des exécutions est automatiquement sauvegardé</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
