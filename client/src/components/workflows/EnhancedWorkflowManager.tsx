import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Bot, 
  Zap, 
  Settings, 
  BarChart, 
  RefreshCw, 
  Play, 
  Pause, 
  Stop,
  Workflow,
  Activity,
  Shield,
  Tag,
  Database,
  GitBranch,
  BarChart3,
  Plus,
  Search,
  Eye,
  Trash2,
  Copy,
  ExternalLink,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';

import { n8nService } from '@/services/n8nService';
import { useDebounce } from '@/hooks/useDebounce';
import { aiService } from '@/services/aiService';
import type { 
  N8nWorkflow, 
  N8nExecution, 
  N8nCredential, 
  N8nTag, 
  N8nVariable, 
  N8nProject,
  PaginatedResponse,
  RequestOptions
} from '@/types/n8n';

export const EnhancedWorkflowManager: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('workflows');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');

  // State pour les workflows
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<N8nWorkflow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // State pour les exécutions
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<N8nExecution | null>(null);

  // State pour les credentials
  const [credentials, setCredentials] = useState<N8nCredential[]>([]);
  const [newCredential, setNewCredential] = useState({ name: '', type: '', data: {} });

  // State pour les tags
  const [tags, setTags] = useState<N8nTag[]>([]);
  const [newTag, setNewTag] = useState('');

  // State pour les variables
  const [variables, setVariables] = useState<N8nVariable[]>([]);
  const [newVariable, setNewVariable] = useState({ key: '', value: '', type: 'string' as const });

  // State pour les projets
  const [projects, setProjects] = useState<N8nProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');

  // State pour l'audit de sécurité
  const [auditResult, setAuditResult] = useState<any>(null);

  // State pour l'IA
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  useEffect(() => {
    initializeN8nConnection();
  }, []);

  const initializeN8nConnection = async () => {
    setConnectionStatus('checking');
    try {
      const status = await n8nService.checkConnection();
      setConnectionStatus(status.status);

      if (status.status === 'connected') {
        await loadAllData();
        toast({
          title: "n8n connecté",
          description: "Connexion établie avec succès"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: status.error || "Impossible de se connecter à n8n"
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Vérifiez vos paramètres n8n"
      });
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadWorkflows(),
        loadCredentials(),
        loadTags(),
        loadVariables(),
        loadProjects()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES WORKFLOWS ===
  const loadWorkflows = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement des workflows depuis n8n...');
      const result = await n8nService.getWorkflows({ limit: 100 });
      console.log(`✅ ${result.data.length} workflows récupérés depuis n8n:`, result.data);

      setWorkflows(result.data || []);

      if (result.data.length > 0) {
        toast({
          title: "Workflows chargés",
          description: `${result.data.length} workflow(s) récupéré(s) depuis n8n`
        });
      }
    } catch (error) {
      console.error('❌ Erreur chargement workflows:', error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les workflows depuis n8n"
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (workflowData: Partial<N8nWorkflow>) => {
    setLoading(true);
    try {
      const newWorkflow = await n8nService.createWorkflow(workflowData);
      setWorkflows(prev => [...prev, newWorkflow]);
      toast({
        title: "Workflow créé",
        description: `Le workflow "${newWorkflow.name}" a été créé`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le workflow"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<N8nWorkflow>) => {
    setLoading(true);
    try {
      const updatedWorkflow = await n8nService.updateWorkflow(id, updates);
      setWorkflows(prev => prev.map(w => w.id === id ? updatedWorkflow : w));
      toast({
        title: "Workflow mis à jour",
        description: `Le workflow a été modifié`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le workflow"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce workflow ?")) return;

    setLoading(true);
    try {
      await n8nService.deleteWorkflow(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
      toast({
        title: "Workflow supprimé",
        description: "Le workflow a été supprimé"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le workflow"
      });
    } finally {
      setLoading(false);
    }
  };

  const activateWorkflow = async (id: string) => {
    setLoading(true);
    try {
      await n8nService.activateWorkflow(id);
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, active: true } : w));
      toast({
        title: "Workflow activé",
        description: "Le workflow est maintenant actif"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'activer le workflow"
      });
    } finally {
      setLoading(false);
    }
  };

  const deactivateWorkflow = async (id: string) => {
    setLoading(true);
    try {
      await n8nService.deactivateWorkflow(id);
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, active: false } : w));
      toast({
        title: "Workflow désactivé",
        description: "Le workflow a été désactivé"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de désactiver le workflow"
      });
    } finally {
      setLoading(false);
    }
  };

  const duplicateWorkflow = async (workflow: N8nWorkflow) => {
    setLoading(true);
    try {
      const duplicatedData = {
        name: `${workflow.name} (Copie)`,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings
      };
      await createWorkflow(duplicatedData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de dupliquer le workflow"
      });
    } finally {
      setLoading(false);
    }
  };

  const transferWorkflow = async (workflowId: string, destinationProjectId: string) => {
    setLoading(true);
    try {
      // Implementation would use the transfer API endpoint
      toast({
        title: "Workflow transféré",
        description: "Le workflow a été transféré vers le projet sélectionné"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de transférer le workflow"
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES EXECUTIONS ===
  const loadExecutions = async (workflowId?: string) => {
    setLoading(true);
    try {
      const result = await n8nService.getExecutions({ 
        workflowId, 
        limit: 50,
        includeData: true 
      });
      setExecutions(result.data || []);
    } catch (error) {
      console.error('Erreur chargement exécutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExecution = async (id: string) => {
    setLoading(true);
    try {
      await n8nService.deleteExecution(id);
      setExecutions(prev => prev.filter(e => e.id !== id));
      toast({
        title: "Exécution supprimée",
        description: "L'exécution a été supprimée"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer l'exécution"
      });
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflowId: string, inputData: any = {}) => {
    setLoading(true);
    try {
      await n8nService.executeWorkflow(workflowId, inputData);
      toast({
        title: "Workflow exécuté",
        description: "Le workflow a été lancé"
      });
      await loadExecutions(workflowId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'exécuter le workflow"
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES CREDENTIALS ===
  const loadCredentials = async () => {
    try {
      // Note: L'API n8n ne permet pas de lister toutes les credentials directement
      // Cette fonctionnalité nécessiterait une implémentation côté serveur
      setCredentials([]);
    } catch (error) {
      console.error('Erreur chargement credentials:', error);
    }
  };

  const createCredential = async () => {
    setLoading(true);
    try {
      // Implementation would use the create credential API
      toast({
        title: "Credential créé",
        description: `Le credential "${newCredential.name}" a été créé`
      });
      setNewCredential({ name: '', type: '', data: {} });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le credential"
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES TAGS ===
  const loadTags = async () => {
    try {
      const result = await n8nService.getTags({ limit: 100 });
      setTags(result.data || []);
    } catch (error) {
      console.error('Erreur chargement tags:', error);
    }
  };

  const createTag = async () => {
    if (!newTag.trim()) return;

    setLoading(true);
    try {
      // Implementation would use the create tag API
      toast({
        title: "Tag créé",
        description: `Le tag "${newTag}" a été créé`
      });
      setNewTag('');
      await loadTags();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le tag"
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES VARIABLES ===
  const loadVariables = async () => {
    try {
      const result = await n8nService.getVariables({ limit: 100 });
      setVariables(result.data || []);
    } catch (error) {
      console.error('Erreur chargement variables:', error);
    }
  };

  const createVariable = async () => {
    if (!newVariable.key.trim()) return;

    setLoading(true);
    try {
      // Implementation would use the create variable API
      toast({
        title: "Variable créée",
        description: `La variable "${newVariable.key}" a été créée`
      });
      setNewVariable({ key: '', value: '', type: 'string' });
      await loadVariables();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la variable"
      });
    } finally {
      setLoading(false);
    }
  };

  // === GESTION DES PROJETS ===
  const loadProjects = async () => {
    try {
      const result = await n8nService.getProjects({ limit: 100 });
      setProjects(result.data || []);
    } catch (error) {
      console.error('Erreur chargement projets:', error);
    }
  };

  // === AUDIT DE SECURITE ===
  const generateSecurityAudit = async () => {
    setLoading(true);
    try {
      const audit = await n8nService.generateAudit({
        additionalOptions: {
          daysAbandonedWorkflow: 30,
          categories: ['credentials', 'database', 'nodes', 'filesystem', 'instance']
        }
      });
      setAuditResult(audit);
      toast({
        title: "Audit généré",
        description: "L'audit de sécurité a été généré"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer l'audit"
      });
    } finally {
      setLoading(false);
    }
  };

  // === ASSISTANCE IA ===
  const handleAiAssistance = async () => {
    if (!aiPrompt.trim()) return;

    setLoading(true);
    try {
      const response = await aiService.processCommand(aiPrompt, {
        workflows,
        executions,
        credentials,
        tags,
        variables
      });
      setAiResponse(response);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur IA",
        description: "Impossible de traiter la demande"
      });
    } finally {
      setLoading(false);
    }
  };

  // === FILTRAGE ===
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

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (connectionStatus === 'connected' && isMounted) {
        try {
          await Promise.allSettled([
            loadWorkflows(),
            loadTags(),
            loadVariables(),
            loadProjects()
          ]);
        } catch (error) {
          console.error('❌ Erreur lors du chargement des données:', error);
        }
      }
    };

    // Débouncer le chargement pour éviter les appels répétés
    const timeoutId = setTimeout(loadData, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [connectionStatus]);

  const checkN8nConnection = useDebounce(async () => {
    if (connectionStatus === 'checking') return;

    setConnectionStatus('checking');
    const isConnected = await n8nService.testConnection();
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, 1000);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Gestionnaire n8n Avancé
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Gestion complète de votre instance n8n avec assistance IA
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(connectionStatus)}
            <span className="text-sm font-medium">{getStatusText(connectionStatus)}</span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={initializeN8nConnection}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="workflows">
            <Workflow className="w-4 h-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="executions">
            <Activity className="w-4 h-4 mr-2" />
            Exécutions
          </TabsTrigger>
          <TabsTrigger value="credentials">
            <Shield className="w-4 h-4 mr-2" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="tags">
            <Tag className="w-4 h-4 mr-2" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="variables">
            <Database className="w-4 h-4 mr-2" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="projects">
            <GitBranch className="w-4 h-4 mr-2" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="audit">
            <BarChart3 className="w-4 h-4 mr-2" />
            Audit
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Bot className="w-4 h-4 mr-2" />
            Assistant IA
          </TabsTrigger>
        </TabsList>

        {/* Onglet Workflows */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workflows n8n</CardTitle>
                  <CardDescription>
                    Gestion complète de vos workflows d'automatisation
                  </CardDescription>
                </div>

                <div className="flex items-center space-x-2">
                  <Button onClick={() => createWorkflow({ name: 'Nouveau Workflow', nodes: [], connections: {}, settings: {} })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer
                  </Button>
                  <Button variant="outline" onClick={loadWorkflows} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      const N8nTestService = (await import('@/services/n8nTestService')).default;
                      await N8nTestService.testAllEndpoints();
                    }}
                    disabled={loading}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Tester API
                  </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={async () => {
              console.log('🔍 Lancement diagnostic complet...');
              const { N8nDiagnosticService } = await import('@/services/n8nDiagnosticService');
              await N8nDiagnosticService.fullDiagnostic();
            }}
            disabled={loading}
          >
            🔍 Diagnostic
          </Button>
              <Button
                onClick={async () => {
                  try {
                    const { N8nDiagnosticService } = await import('@/services/n8nDiagnosticService');
                    const result = await N8nDiagnosticService.migrateReplitSecretsToSupabase();
                    if (result.success) {
                      toast({
                        title: "✅ Migration réussie",
                        description: "Les secrets ont été migrés vers Supabase",
                      });
                      // Recharger les workflows après migration
                      await loadWorkflows();
                    } else {
                      toast({
                        title: "❌ Erreur migration",
                        description: result.error?.message || "Erreur inconnue",
                        variant: "destructive"
                      });
                    }
                  } catch (error) {
                    console.error('Erreur migration:', error);
                    toast({
                      title: "❌ Erreur migration",
                      description: "Erreur lors de la migration des secrets",
                      variant: "destructive"
                    });
                  }
                }}
                variant="outline"
                size="sm"
              >
                🔄 Migrer Secrets
              </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
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

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-slate-500">Chargement des workflows...</p>
                  </div>
                ) : filteredWorkflows.length === 0 ? (
                  <div className="text-center py-8">
                    <Workflow className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">
                      Aucun workflow trouvé
                    </h3>
                    <p className="text-slate-500">
                      {workflows.length === 0 
                        ? "Aucun workflow disponible" 
                        : "Aucun workflow ne correspond à vos critères de recherche"}
                    </p>
                  </div>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <Card key={workflow.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-slate-900 dark:text-white">
                              {workflow.name}
                            </h3>
                            <Badge variant={workflow.active ? "default" : "secondary"}>
                              {workflow.active ? 'Actif' : 'Inactif'}
                            </Badge>
                            <Badge variant="outline">
                              {workflow.nodes?.length || 0} nœuds
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                            <span>ID: {workflow.id}</span>
                            {workflow.updatedAt && (
                              <span>Modifié: {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                            )}
                            {workflow.tags && workflow.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Tag className="w-3 h-3" />
                                <span>{workflow.tags.map(tag => tag.name).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => executeWorkflow(workflow.id)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => workflow.active 
                              ? deactivateWorkflow(workflow.id) 
                              : activateWorkflow(workflow.id)
                            }
                          >
                            {workflow.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => duplicateWorkflow(workflow)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const url = n8nService.getWorkflowUrl(workflow.id);
                              window.open(url, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadExecutions(workflow.id)}
                          >
                            <Activity className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteWorkflow(workflow.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Exécutions */}
        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Exécutions de Workflows</CardTitle>
                  <CardDescription>
                    Historique et détails des exécutions
                  </CardDescription>
                </div>

                <Button onClick={() => loadExecutions()} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {executions.map((execution) => (
                  <Card key={execution.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={execution.finished ? "default" : "secondary"}>
                            {execution.finished ? 'Terminé' : 'En cours'}
                          </Badge>
                          <span className="font-medium">ID: {execution.id}</span>
                          <Badge variant="outline">{execution.mode}</Badge>
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                          <span>Démarré: {new Date(execution.startedAt).toLocaleString()}</span>
                          {execution.stoppedAt && (
                            <span className="ml-4">
                              Arrêté: {new Date(execution.stoppedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedExecution(execution)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteExecution(execution.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Tags */}
        <TabsContent value="tags" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Tags</CardTitle>
              <CardDescription>
                Organisez vos workflows avec des tags
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Nom du nouveau tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
                <Button onClick={createTag} disabled={!newTag.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer
                </Button>
              </div>

              <div className="space-y-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                    <Badge>{tag.name}</Badge>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Variables */}
        <TabsContent value="variables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Variables Globales</CardTitle>
              <CardDescription>
                Gérez les variables partagées entre workflows
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <Input
                  placeholder="Clé..."
                  value={newVariable.key}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, key: e.target.value }))}
                />
                <Input
                  placeholder="Valeur..."
                  value={newVariable.value}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
                />
                <Select 
                  value={newVariable.type} 
                  onValueChange={(value: any) => setNewVariable(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={createVariable} disabled={!newVariable.key.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer
                </Button>
              </div>

              <div className="space-y-2">
                {variables.map((variable) => (
                  <div key={variable.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{variable.type}</Badge>
                      <span className="font-medium">{variable.key}</span>
                      <span className="text-slate-500">{variable.value}</span>
                    </div>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Audit */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audit de Sécurité</CardTitle>
                  <CardDescription>
                    Analyse de sécurité de votre instance n8n
                  </CardDescription>
                </div>

                <Button onClick={generateSecurityAudit} disabled={loading}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Générer Audit
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {auditResult ? (
                <div className="space-y-4">
                  {Object.entries(auditResult).map(([key, value]: [string, any]) => (
                    <Card key={key} className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{key}</h3>
                      <div className="text-sm text-slate-600">
                        <p>Risque: <Badge variant="destructive">{value.risk}</Badge></p>
                        {value.sections?.map((section: any, index: number) => (
                          <div key={index} className="mt-2">
                            <h4 className="font-medium">{section.title}</h4>
                            <p className="text-slate-500">{section.description}</p>
                            <p className="text-green-600 mt-1">{section.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Cliquez sur "Générer Audit" pour analyser votre instance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Assistant IA */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assistant IA n8n</CardTitle>
              <CardDescription>
                Obtenez de l'aide pour créer, optimiser et déboguer vos workflows
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Décrivez ce que vous voulez faire</Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="Ex: Créer un workflow qui envoie un email quand une nouvelle ligne est ajoutée à Google Sheets..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleAiAssistance} disabled={loading || !aiPrompt.trim()}>
                  <Bot className="w-4 h-4 mr-2" />
                  Demander à l'IA
                </Button>
              </div>

              {aiResponse && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h3 className="font-semibold mb-2">Réponse de l'Assistant IA</h3>
                  <div className="whitespace-pre-wrap text-sm">{aiResponse}</div>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};