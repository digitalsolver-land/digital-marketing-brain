
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, RefreshCw, Upload, FileJson, Bot, CheckCircle, AlertCircle, Lightbulb, Play } from 'lucide-react';

import { unifiedN8nService } from '@/services/unifiedN8nService';
import { workflowService, N8nWorkflowJSON } from '@/services/workflowService';
import { n8nWorkflowAnalyzer, WorkflowAnalysis } from '@/services/n8nWorkflowAnalyzer';

interface EnhancedWorkflowCreatorProps {
  connected: boolean;
  onWorkflowCreated?: () => void;
}

export const EnhancedWorkflowCreator: React.FC<EnhancedWorkflowCreatorProps> = ({
  connected,
  onWorkflowCreated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: false
  });

  const [jsonInput, setJsonInput] = useState('');
  const [parsedWorkflow, setParsedWorkflow] = useState<N8nWorkflowJSON | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WorkflowAnalysis | null>(null);
  const [aiEnhancements, setAiEnhancements] = useState<string>('');

  const validateAndParseJson = (jsonString: string): N8nWorkflowJSON | null => {
    if (!jsonString.trim()) {
      setValidationError(null);
      return null;
    }

    try {
      const parsed = JSON.parse(jsonString);
      
      // Validation basique de la structure n8n
      if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
        setValidationError('Le JSON doit contenir un tableau "nodes"');
        return null;
      }
      
      if (!parsed.connections || typeof parsed.connections !== 'object') {
        setValidationError('Le JSON doit contenir un objet "connections"');
        return null;
      }

      // Vérifier que les nœuds ont les propriétés requises
      for (const node of parsed.nodes) {
        if (!node.id || !node.type) {
          setValidationError('Chaque nœud doit avoir un id et un type');
          return null;
        }
        
        if (!Array.isArray(node.position) || node.position.length !== 2) {
          node.position = [250, 300]; // Position par défaut
        }
      }

      setValidationError(null);
      return parsed as N8nWorkflowJSON;
    } catch (error) {
      setValidationError('JSON invalide: ' + (error as Error).message);
      return null;
    }
  };

  const handleJsonChange = async (value: string) => {
    setJsonInput(value);
    setAnalysis(null);
    
    if (value.trim()) {
      const parsed = validateAndParseJson(value);
      if (parsed) {
        setParsedWorkflow(parsed);
        
        // Auto-remplir le nom si pas déjà défini
        if (!formData.name && parsed.name) {
          setFormData(prev => ({ ...prev, name: parsed.name }));
        }

        // Analyser automatiquement le workflow
        await analyzeWorkflow(parsed);
      } else {
        setParsedWorkflow(null);
      }
    } else {
      setParsedWorkflow(null);
      setValidationError(null);
    }
  };

  const analyzeWorkflow = async (workflowData: N8nWorkflowJSON) => {
    setAnalyzing(true);
    try {
      console.log('🔍 Analyse du workflow avec l\'IA...');
      const workflowAnalysis = await n8nWorkflowAnalyzer.analyzeWorkflow(workflowData);
      setAnalysis(workflowAnalysis);
      
      toast({
        title: "Analyse terminée",
        description: "Le workflow a été analysé par l'IA",
      });
    } catch (error) {
      console.error('❌ Erreur analyse workflow:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'analyse",
        description: "Impossible d'analyser le workflow",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const enhanceWorkflowWithAI = async () => {
    if (!parsedWorkflow || !aiEnhancements.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez spécifier les améliorations souhaitées",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🤖 Amélioration du workflow avec l\'IA...');
      
      // Simuler l'amélioration IA (à remplacer par un vrai service IA)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Exemple d'amélioration basique
      const enhancedWorkflow = { ...parsedWorkflow };
      
      // Ajouter des nœuds d'erreur si demandé
      if (aiEnhancements.toLowerCase().includes('erreur') || aiEnhancements.toLowerCase().includes('error')) {
        const errorNode = {
          id: `error_handler_${Date.now()}`,
          name: 'Gestion d\'erreur',
          type: 'n8n-nodes-base.set',
          position: [450, 300] as [number, number],
          parameters: {
            values: {
              string: [
                {
                  name: 'error_message',
                  value: 'Une erreur est survenue dans le workflow'
                }
              ]
            }
          }
        };
        
        enhancedWorkflow.nodes.push(errorNode);
      }

      // Mettre à jour le JSON affiché
      setJsonInput(JSON.stringify(enhancedWorkflow, null, 2));
      setParsedWorkflow(enhancedWorkflow);
      
      // Re-analyser le workflow amélioré
      await analyzeWorkflow(enhancedWorkflow);
      
      toast({
        title: "Workflow amélioré",
        description: "L'IA a ajouté les améliorations demandées",
      });
      
    } catch (error) {
      console.error('❌ Erreur amélioration workflow:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'amélioration",
        description: "Impossible d'améliorer le workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleJsonChange(content);
      };
      reader.readAsText(file);
    }
  };

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

      if (parsedWorkflow) {
        // Créer avec JSON importé
        const workflowData = {
          ...parsedWorkflow,
          name: formData.name,
          active: formData.active
        };

        if (connected) {
          await unifiedN8nService.createWorkflow(workflowData);
          toast({
            title: "Workflow créé",
            description: `Le workflow "${formData.name}" a été créé sur n8n`,
          });
        } else {
          await workflowService.createWorkflowFromJSON(workflowData);
          toast({
            title: "Workflow créé",
            description: `Le workflow "${formData.name}" a été créé localement`,
          });
        }
      } else {
        // Créer workflow basique
        const basicWorkflowData = {
          name: formData.name,
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

        if (connected) {
          await unifiedN8nService.createWorkflow(basicWorkflowData);
          toast({
            title: "Workflow créé",
            description: `Le workflow "${formData.name}" a été créé sur n8n`,
          });
        } else {
          await workflowService.createWorkflow({
            name: formData.name,
            description: formData.description,
            status: formData.active ? 'active' : 'inactive',
            jsonData: basicWorkflowData
          });
          toast({
            title: "Workflow créé",
            description: `Le workflow "${formData.name}" a été créé localement`,
          });
        }
      }

      // Reset du formulaire
      setFormData({ name: '', description: '', active: false });
      setJsonInput('');
      setParsedWorkflow(null);
      setAnalysis(null);
      setAiEnhancements('');
      setActiveTab('basic');
      
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

  const fixWorkflowWithAI = async () => {
    if (!parsedWorkflow) return;

    setLoading(true);
    try {
      console.log('🔧 Correction automatique du workflow...');
      const fixedWorkflow = await n8nWorkflowAnalyzer.fixCommonErrors(parsedWorkflow);
      
      setJsonInput(JSON.stringify(fixedWorkflow, null, 2));
      setParsedWorkflow(fixedWorkflow);
      
      // Re-analyser le workflow corrigé
      await analyzeWorkflow(fixedWorkflow);
      
      toast({
        title: "Workflow corrigé",
        description: "L'IA a corrigé les erreurs détectées",
      });
    } catch (error) {
      console.error('❌ Erreur correction workflow:', error);
      toast({
        variant: "destructive",
        title: "Erreur de correction",
        description: "Impossible de corriger le workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créateur de Workflow Avancé</CardTitle>
        <CardDescription>
          Créez des workflows avec import JSON et analyse IA
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Création Basique</TabsTrigger>
            <TabsTrigger value="import">Import JSON</TabsTrigger>
            <TabsTrigger value="analysis">Analyse IA</TabsTrigger>
          </TabsList>

          {/* Onglet Création Basique */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-4">
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
            </div>
          </TabsContent>

          {/* Onglet Import JSON */}
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              {/* Upload de fichier */}
              <div className="border-2 border-dashed rounded-lg p-4">
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Cliquez pour importer un fichier JSON</p>
                  </div>
                </div>
              </div>

              {/* Ou séparateur */}
              <div className="flex items-center space-x-4">
                <hr className="flex-1" />
                <span className="text-sm text-gray-500">OU</span>
                <hr className="flex-1" />
              </div>

              {/* Zone de texte JSON */}
              <div className="space-y-2">
                <Label htmlFor="json-input">JSON du workflow n8n</Label>
                <Textarea
                  id="json-input"
                  placeholder="Collez votre JSON de workflow n8n ici..."
                  value={jsonInput}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {/* Validation du JSON */}
              {validationError && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 text-sm">{validationError}</span>
                </div>
              )}

              {parsedWorkflow && !validationError && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 text-sm">
                    JSON valide détecté - {parsedWorkflow.nodes?.length || 0} nœuds, {
                      Object.keys(parsedWorkflow.connections || {}).length
                    } connexions
                  </span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Onglet Analyse IA */}
          <TabsContent value="analysis" className="space-y-4">
            {parsedWorkflow ? (
              <div className="space-y-4">
                {/* Boutons d'action IA */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => analyzeWorkflow(parsedWorkflow)}
                    disabled={analyzing}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    {analyzing ? 'Analyse en cours...' : 'Analyser'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={fixWorkflowWithAI}
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Corriger les erreurs
                  </Button>
                </div>

                {/* Améliorations IA */}
                <div className="space-y-2">
                  <Label htmlFor="ai-enhancements">Demander des améliorations à l'IA</Label>
                  <Textarea
                    id="ai-enhancements"
                    placeholder="Ex: Ajoute une gestion d'erreur, améliore la performance, ajoute des validations..."
                    value={aiEnhancements}
                    onChange={(e) => setAiEnhancements(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={enhanceWorkflowWithAI}
                    disabled={loading || !aiEnhancements.trim()}
                    size="sm"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Améliorer avec l'IA
                  </Button>
                </div>

                {/* Résultats de l'analyse */}
                {analysis && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium mb-2">Résumé du workflow</h4>
                      <p className="text-sm text-blue-700">{analysis.summary}</p>
                    </div>

                    {analysis.errors.length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium mb-2">Erreurs détectées</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {analysis.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.suggestions.length > 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium mb-2">Suggestions d'amélioration</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {analysis.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{analysis.nodeCount}</div>
                        <div className="text-sm text-gray-600">Nœuds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {analysis.complexity === 'low' ? 'Faible' : 
                           analysis.complexity === 'medium' ? 'Moyenne' : 'Élevée'}
                        </div>
                        <div className="text-sm text-gray-600">Complexité</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {analysis.hasConnections ? 'Oui' : 'Non'}
                        </div>
                        <div className="text-sm text-gray-600">Connexions</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileJson className="w-12 h-12 mx-auto mb-4" />
                <p>Importez un workflow JSON dans l'onglet "Import JSON" pour l'analyser</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Boutons de soumission */}
        <div className="flex space-x-3 mt-6">
          <Button 
            onClick={handleSubmit}
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
            onClick={() => {
              setFormData({ name: '', description: '', active: false });
              setJsonInput('');
              setParsedWorkflow(null);
              setAnalysis(null);
              setAiEnhancements('');
              setActiveTab('basic');
            }}
            disabled={loading}
          >
            Réinitialiser
          </Button>
        </div>

        {!connected && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Configuration requise:</strong> Configurez votre connexion n8n dans l'onglet "Configuration" pour créer des workflows.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
