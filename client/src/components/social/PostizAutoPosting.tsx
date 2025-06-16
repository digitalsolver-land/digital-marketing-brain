
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Plus, Play, Edit, Trash2, Zap, TestTube } from 'lucide-react';
import { postizService, AutoPostingRule, PostizIntegration } from '@/services/postizService';
import { useToast } from '@/hooks/use-toast';

interface PostizAutoPostingProps {
  integrations: PostizIntegration[];
}

export const PostizAutoPosting = ({ integrations }: PostizAutoPostingProps) => {
  const [rules, setRules] = useState<AutoPostingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRules();
    setIsDemo(postizService.getDemoStatus());
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const rulesData = await postizService.getAutoPostingRules();
      setRules(rulesData);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les règles de publication automatique",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (ruleData: Omit<AutoPostingRule, 'id'>) => {
    try {
      await postizService.createAutoPostingRule(ruleData);
      await loadRules();
      setShowCreateDialog(false);
      toast({
        title: "Règle créée",
        description: "La règle de publication automatique a été créée"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la règle",
        variant: "destructive"
      });
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await postizService.updateAutoPostingRule(ruleId, { enabled });
      await loadRules();
      toast({
        title: enabled ? "Règle activée" : "Règle désactivée",
        description: `La règle a été ${enabled ? 'activée' : 'désactivée'}`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la règle",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await postizService.deleteAutoPostingRule(ruleId);
      await loadRules();
      toast({
        title: "Règle supprimée",
        description: "La règle a été supprimée"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la règle",
        variant: "destructive"
      });
    }
  };

  const handleTriggerRule = async (ruleId: string) => {
    try {
      const result = await postizService.triggerAutoPost(ruleId);
      toast({
        title: "Publication déclenchée",
        description: `${result.posts.length} post(s) ont été créés`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de déclencher la publication",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Chargement des règles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>Publication Automatique</span>
            </div>
            <div className="flex items-center space-x-2">
              {isDemo && (
                <Badge className="bg-orange-500">
                  <TestTube className="w-3 h-3 mr-1" />
                  Mode Demo
                </Badge>
              )}
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle règle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer une règle de publication automatique</DialogTitle>
                  </DialogHeader>
                  <CreateRuleForm 
                    integrations={integrations}
                    onSave={handleCreateRule}
                    onCancel={() => setShowCreateDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Configurez des règles pour publier automatiquement du contenu généré par IA ou des modèles prédéfinis.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Aucune règle configurée
              </h3>
              <p className="text-gray-500 mb-4">
                Créez votre première règle de publication automatique
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une règle
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className={`border-l-4 ${rule.enabled ? 'border-l-green-500' : 'border-l-gray-400'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{rule.name}</h3>
                      <Badge className={rule.enabled ? 'bg-green-500' : 'bg-gray-500'}>
                        {rule.enabled ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Badge variant="outline">
                        {rule.contentType === 'ai_generated' ? 'IA' : 
                         rule.contentType === 'template' ? 'Modèle' : 'RSS'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Fréquence:</span> {rule.schedule.frequency} à {rule.schedule.time}
                      </div>
                      {rule.schedule.days && (
                        <div>
                          <span className="font-medium">Jours:</span> {rule.schedule.days.join(', ')}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Réseaux:</span> {rule.integrations.length} réseau(x) sélectionné(s)
                      </div>
                      {rule.parameters.prompt && (
                        <div>
                          <span className="font-medium">Prompt IA:</span> {rule.parameters.prompt}
                        </div>
                      )}
                      {rule.parameters.keywords && (
                        <div>
                          <span className="font-medium">Mots-clés:</span> {rule.parameters.keywords.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => handleToggleRule(rule.id, enabled)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTriggerRule(rule.id)}
                      disabled={!rule.enabled}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

interface CreateRuleFormProps {
  integrations: PostizIntegration[];
  onSave: (rule: Omit<AutoPostingRule, 'id'>) => void;
  onCancel: () => void;
}

const CreateRuleForm = ({ integrations, onSave, onCancel }: CreateRuleFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    enabled: true,
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '09:00',
    days: [] as string[],
    selectedIntegrations: [] as string[],
    contentType: 'ai_generated' as 'ai_generated' | 'template' | 'rss',
    prompt: '',
    template: '',
    rssUrl: '',
    keywords: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const rule: Omit<AutoPostingRule, 'id'> = {
      name: formData.name,
      enabled: formData.enabled,
      schedule: {
        frequency: formData.frequency,
        time: formData.time,
        ...(formData.frequency !== 'daily' && { days: formData.days })
      },
      integrations: formData.selectedIntegrations,
      contentType: formData.contentType,
      parameters: {
        ...(formData.contentType === 'ai_generated' && { 
          prompt: formData.prompt,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
        }),
        ...(formData.contentType === 'template' && { template: formData.template }),
        ...(formData.contentType === 'rss' && { rssUrl: formData.rssUrl })
      }
    };
    
    onSave(rule);
  };

  const activeIntegrations = integrations.filter(i => !i.disabled);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la règle</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fréquence</Label>
          <Select 
            value={formData.frequency} 
            onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Quotidien</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Heure</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Type de contenu</Label>
        <Select 
          value={formData.contentType} 
          onValueChange={(value: any) => setFormData({ ...formData, contentType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ai_generated">Généré par IA</SelectItem>
            <SelectItem value="template">Modèle prédéfini</SelectItem>
            <SelectItem value="rss">Flux RSS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.contentType === 'ai_generated' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt pour l'IA</Label>
            <Textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Décrivez le type de contenu à générer..."
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keywords">Mots-clés (séparés par des virgules)</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="marketing, digital, stratégie"
            />
          </div>
        </>
      )}

      {formData.contentType === 'template' && (
        <div className="space-y-2">
          <Label htmlFor="template">Modèle de contenu</Label>
          <Textarea
            id="template"
            value={formData.template}
            onChange={(e) => setFormData({ ...formData, template: e.target.value })}
            placeholder="Votre modèle avec [VARIABLES] à remplacer..."
            rows={3}
            required
          />
        </div>
      )}

      {formData.contentType === 'rss' && (
        <div className="space-y-2">
          <Label htmlFor="rssUrl">URL du flux RSS</Label>
          <Input
            id="rssUrl"
            type="url"
            value={formData.rssUrl}
            onChange={(e) => setFormData({ ...formData, rssUrl: e.target.value })}
            placeholder="https://example.com/feed.xml"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Réseaux sociaux</Label>
        <div className="grid grid-cols-2 gap-2">
          {activeIntegrations.map((integration) => (
            <label
              key={integration.id}
              className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={formData.selectedIntegrations.includes(integration.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      selectedIntegrations: [...formData.selectedIntegrations, integration.id]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      selectedIntegrations: formData.selectedIntegrations.filter(id => id !== integration.id)
                    });
                  }
                }}
              />
              <img src={integration.picture} alt={integration.name} className="w-4 h-4" />
              <span className="text-sm">{integration.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex space-x-2">
        <Button type="submit">Créer la règle</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
};
