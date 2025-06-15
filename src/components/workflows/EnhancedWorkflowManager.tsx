
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
  Shield,
  GitBranch,
  Folder,
  UserPlus,
  Key,
  BarChart3,
  Monitor,
  AlertTriangle
} from 'lucide-react';
import { n8nApiService, N8nWorkflow, N8nExecution, N8nTag, N8nVariable, N8nUser, N8nProject, N8nCredential, N8nAuditReport } from '@/services/n8nApiService';
import { useToast } from '@/hooks/use-toast';
import { WorkflowVisualization } from './WorkflowVisualization';

export const EnhancedWorkflowManager: React.FC = () => {
  // États principaux
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [tags, setTags] = useState<N8nTag[]>([]);
  const [variables, setVariables] = useState<N8nVariable[]>([]);
  const [users, setUsers] = useState<N8nUser[]>([]);
  const [projects, setProjects] = useState<N8nProject[]>([]);
  const [credentials, setCredentials] = useState<N8nCredential[]>([]);
  const [auditReports, setAuditReports] = useState<N8nAuditReport[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('workflows');
  
  // Filtres et recherche
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  
  // Formulaires
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });
  const [newUser, setNewUser] = useState({ email: '', role: 'global:member' as const });
  const [newProject, setNewProject] = useState({ name: '', type: 'team' });
  const [newCredential, setNewCredential] = useState({ name: '', type: '', data: {} });
  const [newTag, setNewTag] = useState('');
  const [newVariable, setNewVariable] = useState({ key: '', value: '', type: 'string' });
  
  // États d'édition
  const [editingVariable, setEditingVariable] = useState<N8nVariable | null>(null);
  const [editingTag, setEditingTag] = useState<N8nTag | null>(null);
  const [editingUser, setEditingUser] = useState<N8nUser | null>(null);
  
  // Workflow sélectionné pour visualisation
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  
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
        loadVariables(),
        loadUsers(),
        loadProjects(),
        loadAuditReports()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger certaines données",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const result = await n8nApiService.getWorkflows({
        active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        name: searchTerm || undefined,
        projectId: selectedProject === 'all' ? undefined : selectedProject,
        limit: 100
      });
      setWorkflows(result.data || []);
    } catch (error) {
      console.error('Erreur chargement workflows:', error);
    }
  };

  const loadExecutions = async () => {
    try {
      const result = await n8nApiService.getExecutions({ limit: 50 });
      setExecutions(result.data || []);
    } catch (error) {
      console.error('Erreur chargement exécutions:', error);
    }
  };

  const loadTags = async () => {
    try {
      const result = await n8nApiService.getTags({ limit: 100 });
      setTags(result.data || []);
    } catch (error) {
      console.error('Erreur chargement tags:', error);
    }
  };

  const loadVariables = async () => {
    try {
      const result = await n8nApiService.getVariables({ limit: 100 });
      setVariables(result.data || []);
    } catch (error) {
      console.error('Erreur chargement variables:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const result = await n8nApiService.getUsers({ limit: 100, includeRole: true });
      setUsers(result.data || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const result = await n8nApiService.getProjects({ limit: 100 });
      setProjects(result.data || []);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  const loadAuditReports = async () => {
    try {
      const reports = await n8nApiService.generateAudit();
      setAuditReports(reports || []);
    } catch (error) {
      console.error('Erreur génération audit:', error);
    }
  };

  // Actions workflows
  const createWorkflow = async () => {
    if (!newWorkflow.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du workflow est requis",
        variant: "destructive"
      });
      return;
    }

    try {
      await n8nApiService.createWorkflow({
        name: newWorkflow.name,
        nodes: [
          {
            id: 'start',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: {},
        settings: {
          saveExecutionProgress: true,
          saveManualExecutions: true,
          executionTimeout: 3600
        }
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

  const toggleWorkflow = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await n8nApiService.deactivateWorkflow(id);
      } else {
        await n8nApiService.activateWorkflow(id);
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
      await n8nApiService.deleteWorkflow(id);
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

  const viewWorkflowDetails = async (workflowId: string) => {
    try {
      const workflow = await n8nApiService.getWorkflow(workflowId);
      setSelectedWorkflow(workflow);
      setActiveTab('visualization');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du workflow",
        variant: "destructive"
      });
    }
  };

  // Actions projets
  const createProject = async () => {
    if (!newProject.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du projet est requis",
        variant: "destructive"
      });
      return;
    }

    try {
      await n8nApiService.createProject(newProject.name, newProject.type);
      toast({
        title: "Succès",
        description: "Projet créé avec succès"
      });
      setNewProject({ name: '', type: 'team' });
      loadProjects();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création du projet",
        variant: "destructive"
      });
    }
  };

  // Actions utilisateurs
  const createUser = async () => {
    if (!newUser.email.trim()) {
      toast({
        title: "Erreur",
        description: "L'email est requis",
        variant: "destructive"
      });
      return;
    }

    try {
      await n8nApiService.createUsers([newUser]);
      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès"
      });
      setNewUser({ email: '', role: 'global:member' });
      loadUsers();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création de l'utilisateur",
        variant: "destructive"
      });
    }
  };

  // Actions tags
  const createTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      await n8nApiService.createTag(newTag);
      toast({
        title: "Succès",
        description: "Tag créé avec succès"
      });
      setNewTag('');
      loadTags();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création du tag",
        variant: "destructive"
      });
    }
  };

  // Actions variables
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
      await n8nApiService.createVariable(newVariable);
      toast({
        title: "Succès",
        description: "Variable créée avec succès"
      });
      setNewVariable({ key: '', value: '', type: 'string' });
      loadVariables();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création de la variable",
        variant: "destructive"
      });
    }
  };

  const getExecutionStatusIcon = (execution: N8nExecution) => {
    if (!execution.finished) return <Clock className="w-4 h-4 text-yellow-500" />;
    return execution.data?.success !== false ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getRiskSeverityColor = (risk: string) => {
    switch (risk) {
      case 'credentials': return 'text-red-600 bg-red-50';
      case 'database': return 'text-orange-600 bg-orange-50';
      case 'filesystem': return 'text-yellow-600 bg-yellow-50';
      case 'nodes': return 'text-blue-600 bg-blue-50';
      case 'execution': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesStatus = statusFilter === 'all' || (workflow.active ? 'active' : 'inactive') === statusFilter;
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'all' || workflow.tags?.some(tag => tag.name === selectedTag);
    return matchesStatus && matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestionnaire n8n Avancé
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="visualization">Visualisation</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>

        {/* WORKFLOWS TAB */}
        <TabsContent value="workflows" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
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

              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Créer Workflow</span>
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
                  <Button onClick={createWorkflow} className="w-full">
                    Créer Workflow
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Workflows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">{workflow.name}</CardTitle>
                    <Badge variant={workflow.active ? 'default' : 'secondary'}>
                      {workflow.active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  {workflow.tags && workflow.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {workflow.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Nœuds:</span>
                      <span className="font-medium">{workflow.nodes?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Créé:</span>
                      <span className="font-medium">
                        {workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewWorkflowDetails(workflow.id!)}
                        className="flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => toggleWorkflow(workflow.id!, workflow.active || false)}
                        className="flex-1"
                      >
                        {workflow.active ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                        {workflow.active ? 'Stop' : 'Start'}
                      </Button>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {/* TODO: Duplicate */}}
                        className="flex-1"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Dupliquer
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWorkflow(workflow.id!)}
                        className="flex-1"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Suppr
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* VISUALIZATION TAB */}
        <TabsContent value="visualization" className="space-y-6">
          {selectedWorkflow ? (
            <WorkflowVisualization
              workflow={selectedWorkflow}
              nodes={selectedWorkflow.nodes?.map(node => ({
                id: node.id,
                workflow_id: selectedWorkflow.id || '',
                node_id: node.id,
                node_type: node.type,
                name: node.name,
                position_x: node.position[0],
                position_y: node.position[1],
                parameters: node.parameters || {}
              })) || []}
              connections={Object.entries(selectedWorkflow.connections || {}).flatMap(([sourceId, conns]) =>
                (conns.main || []).flatMap((connGroup, sourceIndex) =>
                  connGroup.map((conn, targetIndex) => ({
                    id: `${sourceId}-${conn.node}-${sourceIndex}-${targetIndex}`,
                    workflow_id: selectedWorkflow.id || '',
                    source_node_id: sourceId,
                    target_node_id: conn.node,
                    source_index: sourceIndex,
                    target_index: conn.index,
                    connection_type: conn.type
                  }))
                )
              )}
              onExecute={() => {/* TODO */}}
              onDelete={() => deleteWorkflow(selectedWorkflow.id!)}
            />
          ) : (
            <div className="text-center py-12">
              <Monitor className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                Aucun workflow sélectionné
              </h3>
              <p className="text-slate-500">
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
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROJECTS TAB */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des Projets</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Projet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un Projet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nom du projet"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  />
                  <Select value={newProject.type} onValueChange={(value) => setNewProject({...newProject, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team">Équipe</SelectItem>
                      <SelectItem value="personal">Personnel</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={createProject} className="w-full">
                    Créer Projet
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Folder className="w-4 h-4" />
                      <span>{project.name}</span>
                    </div>
                    <Badge variant="outline">{project.type}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des Utilisateurs</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nouvel Utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un Utilisateur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                  <Select value={newUser.role} onValueChange={(value: any) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global:admin">Admin</SelectItem>
                      <SelectItem value="global:member">Membre</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={createUser} className="w-full">
                    Créer Utilisateur
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={user.role === 'global:admin' ? 'default' : 'secondary'}>
                            {user.role === 'global:admin' ? 'Admin' : 'Membre'}
                          </Badge>
                          {user.isPending && <Badge variant="outline">En attente</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AUDIT TAB */}
        <TabsContent value="audit" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Rapport d'Audit de Sécurité</h3>
            <Button onClick={loadAuditReports}>
              <Shield className="w-4 h-4 mr-2" />
              Générer Audit
            </Button>
          </div>

          <div className="space-y-4">
            {auditReports.map((report, index) => (
              <Card key={index} className={getRiskSeverityColor(report.risk)}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="capitalize">{report.risk} Security Report</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-4">
                      <h4 className="font-semibold mb-2">{section.title}</h4>
                      <p className="text-sm mb-2">{section.description}</p>
                      <p className="text-sm font-medium mb-2">Recommandation: {section.recommendation}</p>
                      {section.location.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Localisations:</p>
                          {section.location.map((loc, locIndex) => (
                            <div key={locIndex} className="text-xs bg-white/50 p-2 rounded">
                              {loc.workflowName && <span>Workflow: {loc.workflowName} | </span>}
                              {loc.nodeName && <span>Nœud: {loc.nodeName} | </span>}
                              {loc.nodeType && <span>Type: {loc.nodeType}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-5 h-5" />
                    <span>Tags</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Nom du tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="w-32"
                    />
                    <Button size="sm" onClick={createTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                      <span>{tag.name}</span>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Variables</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Variable
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nouvelle Variable</DialogTitle>
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
                <div className="space-y-2">
                  {variables.map((variable) => (
                    <div key={variable.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{variable.key}</span>
                        <p className="text-xs text-gray-500 truncate">{variable.value}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
