
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { workflowService, N8nWorkflowJSON } from '@/services/workflowService';
import { useToast } from '@/hooks/use-toast';

interface WorkflowJsonImporterProps {
  onImportSuccess?: () => void;
}

export const WorkflowJsonImporter: React.FC<WorkflowJsonImporterProps> = ({
  onImportSuccess
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parsedWorkflow, setParsedWorkflow] = useState<N8nWorkflowJSON | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const validateAndParseJson = (jsonString: string): N8nWorkflowJSON | null => {
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
        if (!node.id || !node.type || !node.position) {
          setValidationError('Chaque nœud doit avoir un id, type et position');
          return null;
        }
        
        if (!Array.isArray(node.position) || node.position.length !== 2) {
          setValidationError('La position des nœuds doit être un tableau [x, y]');
          return null;
        }
      }

      setValidationError(null);
      return parsed as N8nWorkflowJSON;
    } catch (error) {
      setValidationError('JSON invalide: ' + (error as Error).message);
      return null;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    
    if (value.trim()) {
      const parsed = validateAndParseJson(value);
      if (parsed) {
        setParsedWorkflow(parsed);
        // Auto-remplir le nom si pas déjà défini
        if (!workflowName && parsed.name) {
          setWorkflowName(parsed.name);
        }
      } else {
        setParsedWorkflow(null);
      }
    } else {
      setParsedWorkflow(null);
      setValidationError(null);
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

  const importWorkflow = async () => {
    if (!parsedWorkflow) {
      toast({
        title: "Erreur",
        description: "Aucun workflow valide à importer",
        variant: "destructive"
      });
      return;
    }

    if (!workflowName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du workflow est requis",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      // Utiliser le nom personnalisé
      const workflowToImport = {
        ...parsedWorkflow,
        name: workflowName
      };

      await workflowService.createWorkflowFromJSON(workflowToImport);
      
      toast({
        title: "Succès",
        description: `Workflow "${workflowName}" importé avec succès`
      });
      
      // Reset du formulaire
      setJsonInput('');
      setWorkflowName('');
      setParsedWorkflow(null);
      setValidationError(null);
      setIsDialogOpen(false);
      
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de l'importation du workflow",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Upload className="w-4 h-4" />
          <span>Importer JSON n8n</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Importer un Workflow n8n</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Upload de fichier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">1. Importer depuis un fichier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full flex items-center justify-center space-x-2 h-20 border-dashed">
                  <Upload className="w-6 h-6" />
                  <span>Cliquez pour sélectionner un fichier JSON</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ou séparateur */}
          <div className="flex items-center space-x-4">
            <hr className="flex-1" />
            <span className="text-sm text-gray-500">OU</span>
            <hr className="flex-1" />
          </div>

          {/* Collage de JSON */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">2. Coller le JSON directement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
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
            </CardContent>
          </Card>

          {/* Configuration de l'import */}
          {parsedWorkflow && !validationError && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">3. Configuration de l'import</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workflow-name">Nom du workflow</Label>
                  <Input
                    id="workflow-name"
                    placeholder="Nom du workflow..."
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                  />
                </div>

                {/* Aperçu des informations */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Nœuds détectés</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {parsedWorkflow.nodes?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Connexions</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Object.keys(parsedWorkflow.connections || {}).length}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={importWorkflow}
                  disabled={isImporting || !workflowName.trim()}
                  className="w-full"
                >
                  {isImporting ? 'Importation en cours...' : 'Importer le Workflow'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
