
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Edit, Trash2, Plus, Upload, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { n8nService } from '@/services/n8nService';
import { aiService } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';
import { Workflow } from '@/types/platform';

export const WorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });
  const [aiDescription, setAiDescription] = useState('');
  const [isCreatingWithAI, setIsCreatingWithAI] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const data = await n8nService.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les workflows",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkflowManually = async () => {
    if (!newWorkflow.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du workflow est requis",
        variant: "destructive"
      });
      return;
    }

    try {
      const workflow = {
        name: newWorkflow.name,
        nodes: [
          {
            id: 'start',
            type: 'n8n-nodes-base.start',
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: {},
        active: false,
        settings: {},
        staticData: {}
      };

      await n8nService.createWorkflow(workflow);
      toast({
        title: "Succès",
        description: "Workflow créé avec succès"
      });
      setNewWorkflow({ name: '', description: '' });
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création du workflow",
        variant: "destructive"
      });
    }
  };

  const createWorkflowWithAI = async () => {
    if (!aiDescription.trim()) {
      toast({
        title: "Erreur",
        description: "Description requise pour créer le workflow",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingWithAI(true);
    try {
      const workflowJson = await aiService.createWorkflowFromDescription(aiDescription);
      await n8nService.createWorkflow(workflowJson);
      
      toast({
        title: "Succès",
        description: "Workflow créé par l'IA avec succès"
      });
      setAiDescription('');
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création du workflow par l'IA",
        variant: "destructive"
      });
    } finally {
      setIsCreatingWithAI(false);
    }
  };

  const toggleWorkflow = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await n8nService.deactivateWorkflow(id);
      } else {
        await n8nService.activateWorkflow(id);
      }
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la modification du statut",
        variant: "destructive"
      });
    }
  };

  const executeWorkflow = async (id: string) => {
    try {
      await n8nService.executeWorkflow(id);
      toast({
        title: "Succès",
        description: "Workflow exécuté avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'exécution du workflow",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const workflowData = JSON.parse(content);
          await n8nService.createWorkflow(workflowData);
          toast({
            title: "Succès",
            description: "Workflow importé avec succès"
          });
          loadWorkflows();
        } catch (error) {
          toast({
            title: "Erreur",
            description: "Fichier JSON invalide",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestionnaire de Workflows n8n
        </h2>
        
        <div className="flex flex-wrap gap-2">
          {/* Import File */}
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Importer JSON</span>
            </Button>
          </div>

          {/* Create Manual */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Créer Manuel</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un Nouveau Workflow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nom du workflow"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})}
                />
                <Textarea
                  placeholder="Description (optionnelle)"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({...newWorkflow, description: e.target.value})}
                />
                <Button onClick={createWorkflowManually} className="w-full">
                  Créer Workflow
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create with AI */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500">
                <Plus className="w-4 h-4" />
                <span>Créer avec IA</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un Workflow avec l'IA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Décrivez le workflow que vous souhaitez créer (ex: Envoyer un email quand un nouveau lead s'inscrit)"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={createWorkflowWithAI} 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  disabled={isCreatingWithAI}
                >
                  {isCreatingWithAI ? 'Création en cours...' : 'Créer avec l\'IA'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg truncate">{workflow.name}</CardTitle>
                <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                  {workflow.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                {workflow.description || 'Aucune description'}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Exécutions:</span>
                  <span className="font-medium">{workflow.executionCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taux de succès:</span>
                  <span className="font-medium text-green-600">
                    {workflow.successRate || 100}%
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleWorkflow(workflow.id, workflow.status === 'active')}
                  className="flex-1"
                >
                  {workflow.status === 'active' ? (
                    <><Pause className="w-4 h-4 mr-1" /> Pause</>
                  ) : (
                    <><Play className="w-4 h-4 mr-1" /> Activer</>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => executeWorkflow(workflow.id)}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Exécuter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Aucun workflow trouvé
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Créez votre premier workflow pour commencer l'automatisation
          </p>
        </div>
      )}
    </div>
  );
};
