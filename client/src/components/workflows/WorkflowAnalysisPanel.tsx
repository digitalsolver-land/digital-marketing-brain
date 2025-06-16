
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  RefreshCw,
  FileJson,
  Zap
} from 'lucide-react';

import { n8nWorkflowAnalyzer, WorkflowAnalysis, WorkflowOptimization } from '@/services/n8nWorkflowAnalyzer';

interface WorkflowAnalysisPanelProps {
  workflowData: any;
  onWorkflowFixed?: (fixedWorkflow: any) => void;
}

export const WorkflowAnalysisPanel: React.FC<WorkflowAnalysisPanelProps> = ({
  workflowData,
  onWorkflowFixed
}) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<WorkflowAnalysis | null>(null);
  const [optimization, setOptimization] = useState<WorkflowOptimization | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      console.log('🔍 Démarrage analyse du workflow...');
      const result = await n8nWorkflowAnalyzer.analyzeWorkflow(workflowData);
      setAnalysis(result);
      
      toast({
        title: "Analyse terminée",
        description: "Le workflow a été analysé avec succès",
      });
    } catch (error) {
      console.error('❌ Erreur analyse:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'analyse",
        description: "Impossible d'analyser le workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      console.log('⚡ Génération suggestions d\'optimisation...');
      const result = await n8nWorkflowAnalyzer.getOptimizationSuggestions(workflowData);
      setOptimization(result);
      
      toast({
        title: "Suggestions générées",
        description: "Des optimisations ont été proposées",
      });
    } catch (error) {
      console.error('❌ Erreur optimisation:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'optimisation",
        description: "Impossible de générer les suggestions",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixErrors = async () => {
    setFixing(true);
    try {
      console.log('🔧 Correction automatique des erreurs...');
      const fixedWorkflow = await n8nWorkflowAnalyzer.fixCommonErrors(workflowData);
      
      onWorkflowFixed?.(fixedWorkflow);
      
      toast({
        title: "Workflow corrigé",
        description: "Les erreurs communes ont été automatiquement corrigées",
      });
    } catch (error) {
      console.error('❌ Erreur correction:', error);
      toast({
        variant: "destructive",
        title: "Erreur de correction",
        description: "Impossible de corriger automatiquement le workflow",
      });
    } finally {
      setFixing(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const validation = n8nWorkflowAnalyzer.validateWorkflow(workflowData);

  return (
    <div className="space-y-6">
      {/* Actions principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Analyse IA du Workflow</span>
          </CardTitle>
          <CardDescription>
            Analysez et optimisez votre workflow avec l'intelligence artificielle
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex space-x-3">
            <Button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="flex-1"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              <Brain className="w-4 h-4 mr-2" />
              Analyser avec l'IA
            </Button>
            
            <Button 
              onClick={handleOptimize} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-2" />
              Optimiser
            </Button>
            
            <Button 
              onClick={handleFixErrors} 
              disabled={fixing || validation.isValid}
              variant="secondary"
            >
              {fixing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Corriger automatiquement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validation du workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {validation.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            <span>Validation du Workflow</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {validation.isValid ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Le workflow est valide</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-red-600 font-medium">Erreurs détectées :</p>
              <ul className="space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="flex items-start space-x-2 text-red-600">
                    <AlertTriangle className="w-4 h-4 mt-0.5" />
                    <span className="text-sm">{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résultats de l'analyse */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analyse du Workflow</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Métriques */}
            <div className="flex space-x-4">
              <Badge variant="outline">
                {analysis.nodeCount} nœud(s)
              </Badge>
              <Badge className={getComplexityColor(analysis.complexity)}>
                Complexité: {analysis.complexity}
              </Badge>
              <Badge variant={analysis.hasConnections ? "default" : "secondary"}>
                {analysis.hasConnections ? 'Connecté' : 'Non connecté'}
              </Badge>
            </div>

            {/* Résumé */}
            <div>
              <h4 className="font-medium mb-2">Résumé :</h4>
              <p className="text-slate-600">{analysis.summary}</p>
            </div>

            {/* Erreurs */}
            {analysis.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Erreurs détectées :</span>
                </h4>
                <ul className="space-y-1">
                  {analysis.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600 ml-6">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span>Suggestions :</span>
                </h4>
                <ul className="space-y-1">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-slate-600 ml-6">• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggestions d'optimisation */}
      {optimization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Suggestions d'Optimisation</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Performance :</h4>
              <ul className="space-y-1">
                {optimization.performance.map((item, index) => (
                  <li key={index} className="text-sm text-slate-600 ml-4">• {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Structure :</h4>
              <ul className="space-y-1">
                {optimization.structure.map((item, index) => (
                  <li key={index} className="text-sm text-slate-600 ml-4">• {item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Bonnes pratiques :</h4>
              <ul className="space-y-1">
                {optimization.best_practices.map((item, index) => (
                  <li key={index} className="text-sm text-slate-600 ml-4">• {item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
