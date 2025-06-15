import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  RefreshCw, 
  Settings, 
  Users, 
  Shield, 
  Database,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  FileJson,
  Eye,
  Copy,
  Search
} from 'lucide-react';

import { n8nApiService, N8nWorkflow, N8nExecution, N8nUser, N8nProject, N8nCredential, N8nTag, N8nVariable, N8nAuditReport } from '@/services/n8nApiService';
import { workflowService } from '@/services/workflowService';
import { WorkflowVisualization } from './WorkflowVisualization';

export const EnhancedWorkflowManager: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('workflows');
  const [loading, setLoading] = useState(false);
  const [n8nConnected, setN8nConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string>('');

  // États pour les données
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [users, setUsers] = useState<N8nUser[]>([]);
  const [projects, setProjects] = useState<N8nProject[]>([]);
  const [credentials, setCredentials] = useState<N8nCredential[]>([]);
  const [tags, setTags] = useState<N8nTag[]>([]);
  const [variables, setVariables] = useState<N8nVariable[]>([]);
  const [auditReports, setAuditReports] = useState<N8nAuditReport[]>([]);

  // États pour les formulaires
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  const [newWorkflowData, setNewWorkflowData] = useState({
    name: '',
    description: '',
    active: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Vérification de la connexion n8n au chargement
  useEffect(() => {
    checkN8nConnection();
  }, []);

  const checkN8nConnection = async () => {
    try {
      setConnectionStatus('checking');
      setConnectionError('');
      console.log('🔍 Vérification connexion n8n...');
      
      const isAvailable = await n8nApiService.isN8nAvailable();
      if (isAvailable) {
        try {
          // Test réel avec une requête simple
          await n8nApiService.getWorkflows({ limit: 1 });
          setN8nConnected(true);
          setConnectionStatus('connected');
          console.log('✅ n8n connecté avec succès');
          
          toast({
            title: "n8n connecté",
            description: "La connexion avec n8n a été établie avec succès.",
          });
          
          // Charger les données initiales
          await loadInitialData();
        } catch (apiError) {
          console.warn('⚠️ API n8n non accessible:', apiError);
          setN8nConnected(false);
          setConnectionStatus('error');
          setConnectionError(apiError instanceof Error ? apiError.message : 'Erreur API inconnue');
          
          toast({
            variant: "destructive",
            title: "Erreur API n8n",
            description: "L'API n8n n'est pas accessible. Vérifiez votre clé API.",
          });
        }
      } else {
        setN8nConnected(false);
        setConnectionStatus('disconnected');
        setConnectionError('Service n8n non disponible');
        console.warn('⚠️ n8n non disponible, mode local activé');
        
        toast({
          variant: "destructive",
          title: "n8n non disponible",
          description: "Fonctionnement en mode local. Vérifiez votre clé API et l'URL n8n.",
        });
      }
    } catch (error) {
      console.error('❌ Erreur connexion n8n:', error);
      setN8nConnected(false);
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Erreur de connexion inconnue');
      
      toast({
        variant: "destructive",
        title: "Erreur de connexion n8n",
        description: error instanceof Error ? error.message : "Impossible de se connecter à n8n",
      });
    }
  };

  const loadInitialData = async () => {
    if (!n8nConnected) return;
    
    setLoading(true);
    try {
      console.log('📊 Chargement des données n8n...');
      
      const results = await Promise.allSettled([
        n8nApiService.getWorkflows({ limit: 50 }),
        n8nApiService.getExecutions({ limit: 20 }),
        n8nApiService.getUsers({ limit: 50 }),
        n8nApiService.getProjects({ limit: 50 }),
        n8nApiService.getTags({ limit: 100 })
      ]);

      // Traitement sécurisé des résultats
      if (results[0].status === 'fulfilled') {
        setWorkflows(results[0].value.data || []);
        console.log(`✅ ${results[0].value.data?.length || 0} workflows chargés`);
      } else {
        console.warn('⚠️ Erreur chargement workflows:', results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        setExecutions(results[1].value.data || []);
        console.log(`✅ ${results[1].value.data?.length || 0} exécutions chargées`);
      } else {
        console.warn('⚠️ Erreur chargement exécutions:', results[1].reason);
      }

      if (results[2].status === 'fulfilled') {
        setUsers(results[2].value.data || []);
        console.log(`✅ ${results[2].value.data?.length || 0} utilisateurs chargés`);
      } else {
        console.warn('⚠️ Erreur chargement utilisateurs:', results[2].reason);
      }

      if (results[3].status === 'fulfilled') {
        setProjects(results[3].value.data || []);
        console.log(`✅ ${results[3].value.data?.length || 0} projets chargés`);
      } else {
        console.warn('⚠️ Erreur chargement projets:', results[3].reason);
      }

      if (results[4].status === 'fulfilled') {
        setTags(results[4].value.data || []);
        console.log(`✅ ${results[4].value.data?.length || 0} tags chargés`);
      } else {
        console.warn('⚠️ Erreur chargement tags:', results[4].reason);
      }

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger certaines données depuis n8n",
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES WORKFLOWS ===
  const createWorkflow = async () => {
    if (!newWorkflowData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le nom du workflow est requis",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Création workflow:', newWorkflowData.name);

      if (n8nConnected) {
        // Créer via l'API n8n
        const workflowData = {
          name: newWorkflowData.name,
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
          active: newWorkflowData.active,
          settings: {
            saveExecutionProgress: true,
            saveManualExecutions: true,
            saveDataErrorExecution: 'all' as const,
            saveDataSuccessExecution: 'all' as const,
            executionTimeout: 3600,
            timezone: 'Europe/Paris'
          }
        };

        const newWorkflow = await n8nApiService.createWorkflow(workflowData);
        setWorkflows(prev => [newWorkflow, ...prev]);
        
        toast({
          title: "Workflow créé",
          description: `Le workflow "${newWorkflow.name}" a été créé avec succès sur n8n`,
        });
      } else {
        // Créer en local via Supabase
        const jsonData = {
          name: newWorkflowData.name,
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
          active: newWorkflowData.active
        };

        await workflowService.createWorkflowFromJSON(jsonData);
        
        toast({
          title: "Workflow créé",
          description: `Le workflow "${newWorkflowData.name}" a été créé localement`,
        });

        // Recharger les workflows locaux
        await loadLocalWorkflows();
      }

      // Reset du formulaire
      setNewWorkflowData({ name: '', description: '', active: false });
      
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

  const loadLocalWorkflows = async () => {
    try {
      console.log('📊 Chargement workflows locaux...');
      const localWorkflows = await workflowService.getWorkflows();
      
      // Convertir les workflows locaux au format N8nWorkflow pour compatibilité
      const n8nFormattedWorkflows: N8nWorkflow[] = localWorkflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        active: workflow.status === 'active',
        nodes: [],
        connections: {},
        settings: {},
        staticData: {},
        tags: workflow.tags?.map((tag, index) => ({ id: index.toString(), name: tag })) || [],
        createdAt: workflow.createdAt || new Date().toISOString(),
        updatedAt: workflow.updatedAt || new Date().toISOString()
      }));
      
      setWorkflows(n8nFormattedWorkflows);
      console.log(`✅ ${n8nFormattedWorkflows.length} workflows locaux chargés`);
    } catch (error) {
      console.error('❌ Erreur chargement workflows locaux:', error);
    }
  };

  const toggleWorkflowStatus = async (workflow: N8nWorkflow) => {
    if (!workflow.id) return;

    setLoading(true);
    try {
      console.log('🔄 Toggle workflow status:', workflow.id, !workflow.active);
      
      if (n8nConnected) {
        // Utiliser l'API n8n
        if (workflow.active) {
          await n8nApiService.deactivateWorkflow(workflow.id);
        } else {
          await n8nApiService.activateWorkflow(workflow.id);
        }
      } else {
        // Utiliser le service local
        const newStatus = workflow.active ? 'inactive' : 'active';
        await workflowService.updateWorkflowStatus(workflow.id, newStatus);
      }

      // Mettre à jour l'état local
      setWorkflows(prev => 
        prev.map(w => w.id === workflow.id ? { ...w, active: !w.active } : w)
      );

      toast({
        title: workflow.active ? "Workflow désactivé" : "Workflow activé",
        description: `Le workflow "${workflow.name}" a été ${workflow.active ? 'désactivé' : 'activé'}`,
      });
      
    } catch (error) {
      console.error('❌ Erreur toggle workflow:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le statut du workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (workflow: N8nWorkflow) => {
    if (!workflow.id) return;

    setLoading(true);
    try {
      console.log('🗑️ Suppression workflow:', workflow.id);
      
      if (n8nConnected) {
        await n8nApiService.deleteWorkflow(workflow.id);
      } else {
        await workflowService.deleteWorkflow(workflow.id);
      }

      setWorkflows(prev => prev.filter(w => w.id !== workflow.id));
      
      toast({
        title: "Workflow supprimé",
        description: `Le workflow "${workflow.name}" a été supprimé`,
      });
      
      // Fermer la visualisation si c'était le workflow sélectionné
      if (selectedWorkflow?.id === workflow.id) {
        setSelectedWorkflow(null);
      }
      
    } catch (error) {
      console.error('❌ Erreur suppression workflow:', error);
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: "Impossible de supprimer le workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES EXÉCUTIONS ===
  const loadExecutions = async () => {
    if (!n8nConnected) return;

    setLoading(true);
    try {
      console.log('📊 Chargement exécutions...');
      const result = await n8nApiService.getExecutions({ 
        limit: 50,
        includeData: false 
      });
      setExecutions(result.data);
      console.log(`✅ ${result.data.length} exécutions chargées`);
    } catch (error) {
      console.error('❌ Erreur chargement exécutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExecution = async (execution: N8nExecution) => {
    if (!n8nConnected) return;

    setLoading(true);
    try {
      console.log('🗑️ Suppression exécution:', execution.id);
      await n8nApiService.deleteExecution(execution.id);
      setExecutions(prev => prev.filter(e => e.id !== execution.id));
      
      toast({
        title: "Exécution supprimée",
        description: "L'exécution a été supprimée avec succès",
      });
    } catch (error) {
      console.error('❌ Erreur suppression exécution:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer l'exécution",
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES UTILISATEURS ===
  const loadUsers = async () => {
    if (!n8nConnected) return;

    setLoading(true);
    try {
      console.log('👥 Chargement utilisateurs...');
      const result = await n8nApiService.getUsers({ limit: 100 });
      setUsers(result.data);
      console.log(`✅ ${result.data.length} utilisateurs chargés`);
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES PROJETS ===
  const loadProjects = async () => {
    if (!n8nConnected) return;

    setLoading(true);
    try {
      console.log('📁 Chargement projets...');
      const result = await n8nApiService.getProjects({ limit: 100 });
      setProjects(result.data);
      console.log(`✅ ${result.data.length} projets chargés`);
    } catch (error) {
      console.error('❌ Erreur chargement projets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (name: string) => {
    if (!n8nConnected || !name.trim()) return;

    setLoading(true);
    try {
      console.log('🚀 Création projet:', name);
      const newProject = await n8nApiService.createProject(name);
      setProjects(prev => [newProject, ...prev]);
      
      toast({
        title: "Projet créé",
        description: `Le projet "${newProject.name}" a été créé`,
      });
    } catch (error) {
      console.error('❌ Erreur création projet:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le projet",
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES CREDENTIALS ===
  const loadCredentials = async () => {
    if (!n8nConnected) return;

    setLoading(true);
    try {
      console.log('🔑 Chargement credentials...');
      // Note: L'API n8n ne permet pas de lister tous les credentials pour des raisons de sécurité
      console.log('ℹ️ Les credentials ne peuvent pas être listés via l\'API pour des raisons de sécurité');
    } catch (error) {
      console.error('❌ Erreur chargement credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  // === AUDIT ET SÉCURITÉ ===
  const loadN8nAuditReports = async () => {
    if (!n8nConnected) return;

    setLoading(true);
    try {
      console.log('🔍 Génération rapport audit...');
      const reports = await n8nApiService.generateAudit();
      setAuditReports(reports);
      console.log(`✅ ${reports.length} rapports d'audit générés`);
      
      toast({
        title: "Audit généré",
        description: `${reports.length} rapport(s) d'audit généré(s)`,
      });
    } catch (error) {
      console.error('❌ Erreur génération audit:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le rapport d'audit",
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES VARIABLES ===
  const loadVariables = async () => {
    if (!n8nConnected) return;

    setLoading(true);
    try {
      console.log('🔧 Chargement variables...');
      const result = await n8nApiService.getVariables({ limit: 100 });
      setVariables(result.data);
      console.log(`✅ ${result.data.length} variables chargées`);
    } catch (error) {
      console.error('❌ Erreur chargement variables:', error);
    } finally {
      setLoading(false);
    }
  };

  // === FILTRAGE ET RECHERCHE ===
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && workflow.active) ||
      (filterStatus === 'inactive' && !workflow.active);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: typeof connectionStatus) => {
    switch (status) {
      case 'checking': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected': return <XCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: typeof connectionStatus) => {
    switch (status) {
      case 'checking': return 'Vérification...';
      case 'connected': return 'n8n Connecté';
      case 'disconnected': return 'Mode Local';
      case 'error': return 'Erreur Connexion';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statut de connexion */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestionnaire n8n</h2>
          <p className="text-slate-600">Gérez vos workflows et automatisations</p>
          {connectionError && (
            <p className="text-sm text-red-600 mt-1">
              Erreur: {connectionError}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(connectionStatus)}
            <span className="text-sm font-medium">{getStatusText(connectionStatus)}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkN8nConnection}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="visualization">Visualisation</TabsTrigger>
        </TabsList>

        {/* === ONGLET WORKFLOWS === */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workflows n8n</CardTitle>
                  <CardDescription>
                    Gérez vos workflows d'automatisation
                  </CardDescription>
                </div>
                
                <Button onClick={n8nConnected ? loadInitialData : loadLocalWorkflows} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Formulaire de création */}
              <div className="grid gap-4 p-4 border rounded-lg bg-slate-50">
                <h3 className="font-semibold">Créer un nouveau workflow</h3>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="workflow-name">Nom du workflow</Label>
                    <Input
                      id="workflow-name"
                      value={newWorkflowData.name}
                      onChange={(e) => setNewWorkflowData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Mon workflow automatisé"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="workflow-description">Description</Label>
                    <Input
                      id="workflow-description"
                      value={newWorkflowData.description}
                      onChange={(e) => setNewWorkflowData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description du workflow"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="workflow-active">Actif</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="workflow-active"
                        checked={newWorkflowData.active}
                        onCheckedChange={(checked) => setNewWorkflowData(prev => ({ ...prev, active: checked }))}
                      />
                      <span className="text-sm">{newWorkflowData.active ? 'Actif' : 'Inactif'}</span>
                    </div>
                  </div>
                </div>
                
                <Button onClick={createWorkflow} disabled={loading || !newWorkflowData.name.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer le workflow
                </Button>
              </div>

              {/* Filtres et recherche */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                      placeholder="Rechercher un workflow..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Liste des workflows */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-slate-600">Chargement des workflows...</p>
                  </div>
                ) : filteredWorkflows.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">
                    <FileJson className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p>Aucun workflow trouvé</p>
                    {searchTerm && (
                      <p className="text-sm">Essayez de modifier votre recherche</p>
                    )}
                  </div>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{workflow.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={workflow.active ? "default" : "secondary"}>
                                {workflow.active ? 'Actif' : 'Inactif'}
                              </Badge>
                              <span className="text-sm text-slate-600">
                                {workflow.nodes?.length || 0} nœud(s)
                              </span>
                              {workflow.updatedAt && (
                                <span className="text-sm text-slate-500">
                                  Modifié: {new Date(workflow.updatedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleWorkflowStatus(workflow)}
                          disabled={loading}
                        >
                          {workflow.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteWorkflow(workflow)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ONGLET EXÉCUTIONS === */}
        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exécutions</CardTitle>
                  <CardDescription>
                    Historique des exécutions de workflows
                  </CardDescription>
                </div>
                
                <Button onClick={loadExecutions} disabled={loading || !n8nConnected}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {!n8nConnected ? (
                <div className="text-center py-8 text-slate-600">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                  <p>Connexion n8n requise pour afficher les exécutions</p>
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>Aucune exécution trouvée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executions.map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge variant={execution.finished ? "default" : "secondary"}>
                            {execution.finished ? 'Terminé' : 'En cours'}
                          </Badge>
                          <span className="font-medium">Workflow ID: {execution.workflowId}</span>
                          <span className="text-sm text-slate-600">Mode: {execution.mode}</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Démarré: {new Date(execution.startedAt).toLocaleString()}
                          {execution.stoppedAt && (
                            <span> - Terminé: {new Date(execution.stoppedAt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteExecution(execution)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ONGLET UTILISATEURS === */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Utilisateurs n8n</CardTitle>
                  <CardDescription>
                    Gestion des utilisateurs de l'instance n8n
                  </CardDescription>
                </div>
                
                <Button onClick={loadUsers} disabled={loading || !n8nConnected}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {!n8nConnected ? (
                <div className="text-center py-8 text-slate-600">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                  <p>Connexion n8n requise pour gérer les utilisateurs</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>Aucun utilisateur trouvé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.email}
                            </h4>
                            <p className="text-sm text-slate-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <Badge variant={user.isPending ? "secondary" : "default"}>
                            {user.isPending ? 'En attente' : 'Actif'}
                          </Badge>
                          <Badge variant="outline">{user.role}</Badge>
                          <span className="text-sm text-slate-500">
                            Créé: {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ONGLET PROJETS === */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projets</CardTitle>
                  <CardDescription>
                    Organisation des workflows par projets
                  </CardDescription>
                </div>
                
                <Button onClick={loadProjects} disabled={loading || !n8nConnected}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {!n8nConnected ? (
                <div className="text-center py-8 text-slate-600">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                  <p>Connexion n8n requise pour gérer les projets</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <Database className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>Aucun projet trouvé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <div className="mt-1">
                          <Badge variant="outline">{project.type}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ONGLET CREDENTIALS === */}
        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
              <CardDescription>
                Gestion des identifiants et connexions
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="text-center py-8 text-slate-600">
                <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>Les credentials ne peuvent pas être affichés pour des raisons de sécurité</p>
                <p className="text-sm">Utilisez l'interface n8n pour gérer vos credentials</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ONGLET VARIABLES === */}
        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Variables d'environnement</CardTitle>
                  <CardDescription>
                    Variables globales de l'instance n8n
                  </CardDescription>
                </div>
                
                <Button onClick={loadVariables} disabled={loading || !n8nConnected}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {!n8nConnected ? (
                <div className="text-center py-8 text-slate-600">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                  <p>Connexion n8n requise pour gérer les variables</p>
                </div>
              ) : variables.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>Aucune variable trouvée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variables.map((variable) => (
                    <div key={variable.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{variable.key}</h4>
                        <p className="text-sm text-slate-600">Type: {variable.type || 'string'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Configuré</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ONGLET AUDIT === */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit de sécurité</CardTitle>
                  <CardDescription>
                    Rapports de sécurité et recommandations
                  </CardDescription>
                </div>
                
                <Button onClick={loadN8nAuditReports} disabled={loading || !n8nConnected}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Générer un audit
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {!n8nConnected ? (
                <div className="text-center py-8 text-slate-600">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                  <p>Connexion n8n requise pour l'audit de sécurité</p>
                </div>
              ) : auditReports.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>Aucun rapport d'audit disponible</p>
                  <p className="text-sm">Cliquez sur "Générer un audit" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditReports.map((report, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge variant={report.risk === 'high' ? "destructive" : report.risk === 'medium' ? "default" : "secondary"}>
                          Risque: {report.risk}
                        </Badge>
                      </div>
                      
                      {report.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-4 last:mb-0">
                          <h4 className="font-medium text-sm">{section.title}</h4>
                          <p className="text-sm text-slate-600 mb-2">{section.description}</p>
                          <p className="text-sm text-blue-600">{section.recommendation}</p>
                          
                          {section.location && section.location.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {section.location.map((loc, locIndex) => (
                                <div key={locIndex} className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                  {loc.workflowName && <span>Workflow: {loc.workflowName} | </span>}
                                  {loc.nodeName && <span>Node: {loc.nodeName} | </span>}
                                  {loc.nodeType && <span>Type: {loc.nodeType}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ONGLET VISUALISATION === */}
        <TabsContent value="visualization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visualisation des workflows</CardTitle>
              <CardDescription>
                Interface graphique pour visualiser vos workflows
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {selectedWorkflow ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Workflow: {selectedWorkflow.name}</h3>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedWorkflow(null)}
                    >
                      Fermer
                    </Button>
                  </div>
                  
                  <WorkflowVisualization 
                    workflow={selectedWorkflow}
                    nodes={selectedWorkflow.nodes?.map(node => ({
                      id: node.id || '',
                      node_id: node.id || '',
                      node_type: node.type || '',
                      name: node.name || '',
                      position_x: Array.isArray(node.position) ? node.position[0] : 0,
                      position_y: Array.isArray(node.position) ? node.position[1] : 0,
                      parameters: node.parameters || {}
                    })) || []}
                    connections={[]}
                    onExecute={() => {
                      console.log('Exécution du workflow:', selectedWorkflow.id);
                      toast({
                        title: "Workflow exécuté",
                        description: `Le workflow "${selectedWorkflow.name}" a été exécuté`,
                      });
                    }}
                    onEdit={() => {
                      console.log('Édition du workflow:', selectedWorkflow.id);
                      toast({
                        title: "Édition workflow",
                        description: "Ouverture de l'éditeur...",
                      });
                    }}
                    onDelete={() => deleteWorkflow(selectedWorkflow)}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  <FileJson className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p>Sélectionnez un workflow dans l'onglet "Workflows" pour le visualiser</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
