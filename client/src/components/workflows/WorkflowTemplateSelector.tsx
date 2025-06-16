
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Layers, 
  Mail, 
  Monitor, 
  Database, 
  FileText, 
  Plus,
  Eye,
  Download
} from 'lucide-react';
import { workflowTemplates, getCategories } from '@/services/workflowTemplates';
import { WorkflowTemplate } from '@/services/workflowTemplates';
import { enhancedWorkflowService } from '@/services/enhancedWorkflowService';
import { useToast } from '@/hooks/use-toast';

interface WorkflowTemplateSelectorProps {
  onTemplateCreated?: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Marketing': return <Mail className="w-4 h-4" />;
    case 'Monitoring': return <Monitor className="w-4 h-4" />;
    case 'Administration': return <Database className="w-4 h-4" />;
    case 'Reporting': return <FileText className="w-4 h-4" />;
    default: return <Layers className="w-4 h-4" />;
  }
};

export const WorkflowTemplateSelector: React.FC<WorkflowTemplateSelectorProps> = ({
  onTemplateCreated
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const categories = getCategories();

  const filteredTemplates = selectedCategory === 'all' 
    ? workflowTemplates 
    : workflowTemplates.filter(t => t.category === selectedCategory);

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setCustomName(template.name);
    setCustomDescription(template.description);
    setIsDialogOpen(true);
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    try {
      const templateToCreate = {
        ...selectedTemplate,
        name: customName || selectedTemplate.name,
        description: customDescription || selectedTemplate.description
      };

      await enhancedWorkflowService.createWorkflowFromTemplate(templateToCreate);
      
      toast({
        title: "Succès",
        description: `Workflow "${templateToCreate.name}" créé depuis le template`
      });
      
      setIsDialogOpen(false);
      setSelectedTemplate(null);
      setCustomName('');
      setCustomDescription('');
      
      if (onTemplateCreated) {
        onTemplateCreated();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création du workflow depuis le template",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportTemplate = (template: WorkflowTemplate) => {
    const dataStr = JSON.stringify(template.workflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_').toLowerCase()}_template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Layers className="w-5 h-5" />
              <span>Templates de Workflows</span>
            </CardTitle>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(template.category)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Badge variant="outline">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {template.description}
                  </p>
                  
                  <div className="text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Nœuds: {template.workflow.nodes.length}</span>
                      <span>Connexions: {Object.keys(template.workflow.connections).length}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleSelectTemplate(template)}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Créer
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportTemplate(template)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun template trouvé pour cette catégorie</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de création depuis template */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Créer depuis Template</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Nom du workflow</Label>
                <Input
                  id="template-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nom du nouveau workflow"
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Description du workflow"
                  rows={3}
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium mb-2">Template original:</div>
                <div className="text-sm text-gray-600">
                  <div>• {selectedTemplate.workflow.nodes.length} nœuds</div>
                  <div>• {Object.keys(selectedTemplate.workflow.connections).length} connexions</div>
                  <div>• Catégorie: {selectedTemplate.category}</div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleCreateFromTemplate}
                  disabled={isCreating || !customName.trim()}
                  className="flex-1"
                >
                  {isCreating ? 'Création...' : 'Créer Workflow'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
