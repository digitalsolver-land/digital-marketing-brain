import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus, 
  Upload, 
  Download, 
  Tag,
  Users,
  Database,
  Settings,
  RefreshCw,
  Search,
  Filter,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Copy,
  RefreshCw as Sync,
  BarChart3,
  Layers
} from 'lucide-react';
import { n8nService } from '@/services/n8nService';
import { aiService } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';
import { Workflow } from '@/types/platform';
import { enhancedWorkflowService } from '@/services/enhancedWorkflowService';
import { workflowService } from '@/services/workflowService';
import { WorkflowVisualization } from './WorkflowVisualization';
import { WorkflowJsonImporter } from './WorkflowJsonImporter';
import { WorkflowTemplateSelector } from './WorkflowTemplateSelector';

interface N8nExecution {
  id: number;
  workflowId: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  data?: any;
}

interface N8nTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface N8nVariable {
  id: string;
  key: string;
  value: string;
}

export const WorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [tags, setTags] = useState<N8nTag[]>([]);
  const [variables, setVariables] = useState<N8nVariable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('workflows');
  
  // Workflow creation
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });
  const [aiDescription, setAiDescription] = useState('');
  const [isCreatingWithAI, setIsCreatingWithAI] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  
  // Tag management
  const [newTagName, setNewTagName] = useState('');
  
  // Variable management
  const [newVariable, setNewVariable] = useState({ key: '', value: '' });
  const [editingVariable, setEditingVariable] = useState<N8nVariable | null>(null);
  
  // Nouveau state pour la visualisation
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [workflowDetails, setWorkflowDetails] = useState<{
    workflow: any;
    nodes: any[];
    connections: any[];
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Nouveaux states pour les fonctionnalités avancées
  const [workflowStats, setWorkflowStats] = useState<{[key: string]: any}>({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadWorkflows(),
        loadExecutions(),
        loadTags(),
        loadVariables()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      // Charger d'abord les workflows locaux
      const localWorkflows = await workflowService.getWorkflows();
      
      // Puis charger les workflows n8n si disponible
      let n8nWorkflows: Workflow[] = [];
      try {
        n8nWorkflows = await n8nService.getWorkflows({
          active: statusFilter === 'all' ? undefined : statusFilter === 'active',
          name: searchTerm || undefined,
          limit: 100
        });
      } catch (error) {
        console.log('n8n non disponible, utilisation des workflows locaux uniquement');
      }

      // Combiner les deux listes
      const allWorkflows = [...localWorkflows, ...n8nWorkflows];
      setWorkflows(allWorkflows);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les workflows",
        variant: "destructive"
      });
    }
  };

  const loadExecutions = async () => {
    try {
      const data = await n8nService.getExecutions({
        limit: 50,
        includeData: false
      });
      setExecutions(data);
    } catch (error) {
      console.error('Erreur chargement exécutions:', error);
    }
  };

  const loadTags = async () => {
    try {
      const data = await n8nService.getTags({ limit: 100 });
      setTags(data.data);
    } catch (error) {
      console.error('Erreur chargement tags:', error);
    }
  };

  const loadVariables = async () => {
    try {
      const data = await n8nService.getVariables({ limit: 100 });
      setVariables(data.data);
    } catch (error) {
      console.error('Erreur chargement variables:', error);
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
      await n8nService.createWorkflow({
        name: newWorkflow.name,
        nodes: [
          {
            id: 'start',
            type: 'n8n-nodes-base.start',
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: {}
      });

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
      toast({
        title: "Succès",
        description: `Workflow ${isActive ? 'désactivé' : 'activé'} avec succès`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la modification du statut",
        variant: "destructive"
      });
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      await n8nService.deleteWorkflow(id);
      toast({
        title: "Succès",
        description: "Workflow supprimé avec succès"
      });
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la suppression du workflow",
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
      loadExecutions();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'exécution du workflow",
        variant: "destructive"
      });
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      await n8nService.createTag(newTagName);
      toast({
        title: "Succès",
        description: "Tag créé avec succès"
      });
      setNewTagName('');
      loadTags();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création du tag",
        variant: "destructive"
      });
    }
  };

  const deleteTag = async (id: string) => {
    try {
      await n8nService.deleteTag(id);
      toast({
        title: "Succès",
        description: "Tag supprimé avec succès"
      });
      loadTags();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la suppression du tag",
        variant: "destructive"
      });
    }
  };

  const createVariable = async () => {
    if (!newVariable.key.trim() || !newVariable.value.trim()) {
      toast({
        title: "Erreur",
        description: "Clé et valeur sont requises",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await n8nService.createVariable(newVariable);
      toast({
        title: "Succès",
        description: "Variable créée avec succès"
      });
      setNewVariable({ key: '', value: '' });
      loadVariables();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création de la variable",
        variant: "destructive"
      });
    }
  };

  const updateVariable = async () => {
    if (!editingVariable) return;
    
    try {
      await n8nService.updateVariable(editingVariable.id, {
        key: editingVariable.key,
        value: editingVariable.value
      });
      toast({
        title: "Succès",
        description: "Variable mise à jour avec succès"
      });
      setEditingVariable(null);
      loadVariables();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour de la variable",
        variant: "destructive"
      });
    }
  };

  const deleteVariable = async (id: string) => {
    try {
      await n8nService.deleteVariable(id);
      toast({
        title: "Succès",
        description: "Variable supprimée avec succès"
      });
      loadVariables();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la suppression de la variable",
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

  const handleImportSuccess = () => {
    loadWorkflows();
  };

  const executeLocalWorkflow = async (workflowId: string) => {
    try {
      await workflowService.updateWorkflowStatus(workflowId, 'active');
      toast({
        title: "Succès",
        description: "Workflow activé avec succès"
      });
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'activation du workflow",
        variant: "destructive"
      });
    }
  };

  const deleteLocalWorkflow = async (workflowId: string) => {
    try {
      await workflowService.deleteWorkflow(workflowId);
      toast({
        title: "Succès",
        description: "Workflow supprimé avec succès"
      });
      loadWorkflows();
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null);
        setWorkflowDetails(null);
        setActiveTab('workflows');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la suppression du workflow",
        variant: "destructive"
      });
    }
  };

  const viewWorkflowDetails = async (workflowId: string) => {
    setIsLoadingDetails(true);
    try {
      const details = await workflowService.getWorkflowWithDetails(workflowId);
      if (details) {
        setWorkflowDetails(details);
        setSelectedWorkflow(details.workflow);
        setActiveTab('visualization');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du workflow",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const getExecutionStatusIcon = (execution: N8nExecution) => {
    if (!execution.finished) return <Clock className="w-4 h-4 text-yellow-500" />;
    return execution.data?.success !== false ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const loadWorkflowStats = async (workflowId: string) => {
    if (workflowStats[workflowId]) return; // Déjà chargé
    
    setIsLoadingStats(true);
    try {
      const stats = await enhancedWorkflowService.getWorkflowStats(workflowId);
      setWorkflowStats(prev => ({ ...prev, [workflowId]: stats }));
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const duplicateWorkflow = async (workflowId: string, workflow: Workflow) => {
    try {
      await enhancedWorkflowService.duplicateWorkflow(workflowId, `${workflow.name} (Copie)`);
      toast({
        title: "Succès",
        description: "Workflow dupliqué avec succès"
      });
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la duplication du workflow",
        variant: "destructive"
      });
    }
  };

  const exportWorkflow = async (workflowId: string, workflowName: string) => {
    try {
      const workflowJson = await enhancedWorkflowService.exportWorkflow(workflowId);
      
      const dataStr = JSON.stringify(workflowJson, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${workflowName.replace(/\s+/g, '_').toLowerCase()}_export.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast({
        title: "Succès",
        description: "Workflow exporté avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'exportation du workflow",
        variant: "destructive"
      });
    }
  };

  const syncWithN8n = async (workflowId: string) => {
    try {
      await enhancedWorkflowService.syncWithN8n(workflowId);
      toast({
        title: "Succès",
        description: "Synchronisation n8n réussie"
      });
      loadWorkflows();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la synchronisation n8n",
        variant: "destructive"
      });
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'all' || workflow.tags?.includes(selectedTag);
    return matchesStatus && matchesSearch && matchesTag;
  });

  const handleTemplateCreated = () => {
    loadWorkflows();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestionnaire de Workflows n8n
        </h2>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAllData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="visualization">Visualisation</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>

        {/* WORKFLOWS TAB */}
        <TabsContent value="workflows" className="space-y-6">
          {/* Actions Bar */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>

              {/* Tag Filter */}
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les tags</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.name}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Import JSON */}
              <WorkflowJsonImporter onImportSuccess={handleImportSuccess} />

              {/* Create Manual */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Créer</span>
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
                    <span>IA</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un Workflow avec l'IA</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Décrivez le workflow que vous souhaitez créer..."
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
            {filteredWorkflows.map((workflow) => (
              <Card 
                key={workflow.id} 
                className="hover:shadow-lg transition-shadow"
                onMouseEnter={() => loadWorkflowStats(workflow.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">{workflow.name}</CardTitle>
                    <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                      {workflow.status}
                    </Badge>
                  </div>
                  {workflow.tags && workflow.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {workflow.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {workflow.description || 'Aucune description'}
                  </p>
                  
                  {/* Statistiques */}
                  <div className="space-y-2 mb-4">
                    {workflowStats[workflow.id] && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Exécutions:</span>
                          <span className="font-medium">{workflowStats[workflow.id].totalExecutions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Succès:</span>
                          <span className="font-medium text-green-600">{workflowStats[workflow.id].successfulExecutions}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Créé:</span>
                      <span className="font-medium">
                        {workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewWorkflowDetails(workflow.id)}
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (workflow.id.includes('-')) {
                            executeLocalWorkflow(workflow.id);
                          } else {
                            executeWorkflow(workflow.id);
                          }
                        }}
                        className="flex-1"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Exec
                      </Button>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateWorkflow(workflow.id, workflow)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportWorkflow(workflow.id, workflow.name)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncWithN8n(workflow.id)}
                      >
                        <Sync className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (workflow.id.includes('-')) {
                            deleteLocalWorkflow(workflow.id);
                          } else {
                            deleteWorkflow(workflow.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredWorkflows.length === 0 && !isLoading && (
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
        </TabsContent>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-6">
          <WorkflowTemplateSelector onTemplateCreated={handleTemplateCreated} />
        </TabsContent>

        {/* VISUALIZATION TAB */}
        <TabsContent value="visualization" className="space-y-6">
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Chargement des détails...</span>
            </div>
          ) : workflowDetails ? (
            <WorkflowVisualization
              workflow={workflowDetails.workflow}
              nodes={workflowDetails.nodes}
              connections={workflowDetails.connections}
              onExecute={() => executeLocalWorkflow(workflowDetails.workflow.id)}
              onDelete={() => deleteLocalWorkflow(workflowDetails.workflow.id)}
            />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Aucun workflow sélectionné
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Sélectionnez un workflow dans l'onglet "Workflows" pour le visualiser
              </p>
            </div>
          )}
        </TabsContent>

        {/* EXECUTIONS TAB */}
        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Historique des Exécutions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getExecutionStatusIcon(execution)}
                      <div>
                        <p className="font-medium">Exécution #{execution.id}</p>
                        <p className="text-sm text-gray-600">Workflow: {execution.workflowId}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(execution.startedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={execution.finished ? 'default' : 'secondary'}>
                        {execution.finished ? 'Terminé' : 'En cours'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAGS TAB */}
        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="w-5 h-5" />
                  <span>Gestion des Tags</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Nom du tag"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-48"
                  />
                  <Button onClick={createTag}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{tag.name}</p>
                      <p className="text-xs text-gray-500">
                        Créé: {new Date(tag.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTag(tag.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VARIABLES TAB */}
        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Variables d'Environnement</span>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle Variable
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer une Variable</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Clé"
                        value={newVariable.key}
                        onChange={(e) => setNewVariable({...newVariable, key: e.target.value})}
                      />
                      <Input
                        placeholder="Valeur"
                        value={newVariable.value}
                        onChange={(e) => setNewVariable({...newVariable, value: e.target.value})}
                      />
                      <Button onClick={createVariable} className="w-full">
                        Créer Variable
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {variables.map((variable) => (
                  <div key={variable.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      {editingVariable?.id === variable.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingVariable.key}
                            onChange={(e) => setEditingVariable({
                              ...editingVariable,
                              key: e.target.value
                            })}
                          />
                          <Input
                            value={editingVariable.value}
                            onChange={(e) => setEditingVariable({
                              ...editingVariable,
                              value: e.target.value
                            })}
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{variable.key}</p>
                          <p className="text-sm text-gray-600 truncate">{variable.value}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {editingVariable?.id === variable.id ? (
                        <>
                          <Button size="sm" onClick={updateVariable}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingVariable(null)}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingVariable(variable)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteVariable(variable.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
