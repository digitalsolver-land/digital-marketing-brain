
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bot, Plus, Edit, Trash2, Play, Pause } from 'lucide-react';

interface AutoResponseRule {
  id: string;
  name: string;
  trigger: string;
  response: string;
  enabled: boolean;
  useAI: boolean;
  priority: number;
}

interface WhatsAppAutoResponseProps {
  aiEnabled: boolean;
}

export const WhatsAppAutoResponse = ({ aiEnabled }: WhatsAppAutoResponseProps) => {
  const [rules, setRules] = useState<AutoResponseRule[]>([
    {
      id: '1',
      name: 'Salutation',
      trigger: 'bonjour|salut|hello',
      response: 'Bonjour ! Je suis l\'assistant virtuel. Comment puis-je vous aider ?',
      enabled: true,
      useAI: false,
      priority: 1
    },
    {
      id: '2',
      name: 'Informations prix',
      trigger: 'prix|tarif|coût',
      response: 'Pour obtenir nos tarifs, veuillez me préciser quel service vous intéresse.',
      enabled: true,
      useAI: true,
      priority: 2
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutoResponseRule>>({
    name: '',
    trigger: '',
    response: '',
    enabled: true,
    useAI: false,
    priority: 1
  });

  const handleToggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleCreateRule = () => {
    if (newRule.name && newRule.trigger && newRule.response) {
      const rule: AutoResponseRule = {
        id: Date.now().toString(),
        name: newRule.name,
        trigger: newRule.trigger,
        response: newRule.response,
        enabled: newRule.enabled || true,
        useAI: newRule.useAI || false,
        priority: newRule.priority || 1
      };
      setRules([...rules, rule]);
      setNewRule({ name: '', trigger: '', response: '', enabled: true, useAI: false, priority: 1 });
      setIsCreating(false);
    }
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statut IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-blue-500" />
              <span>Configuration des Réponses Automatiques</span>
            </div>
            <Badge variant={aiEnabled ? "default" : "secondary"} className={aiEnabled ? "bg-green-500" : ""}>
              {aiEnabled ? "🤖 IA Activée" : "IA Désactivée"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Réponses intelligentes</h3>
              <p className="text-sm text-gray-600">
                L'IA génère des réponses personnalisées selon vos instructions
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle règle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de création */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Créer une nouvelle règle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Nom de la règle</Label>
                <Input
                  id="rule-name"
                  placeholder="Ex: Demande de contact"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-priority">Priorité</Label>
                <Select value={newRule.priority?.toString()} onValueChange={(value) => setNewRule({ ...newRule, priority: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Haute (1)</SelectItem>
                    <SelectItem value="2">Moyenne (2)</SelectItem>
                    <SelectItem value="3">Basse (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-trigger">Mots-clés déclencheurs</Label>
              <Input
                id="rule-trigger"
                placeholder="Ex: contact|rendez-vous|appel (séparés par |)"
                value={newRule.trigger || ''}
                onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Utilisez | pour séparer plusieurs mots-clés. Exemple: prix|tarif|coût
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-response">Réponse</Label>
              <Textarea
                id="rule-response"
                placeholder="Tapez votre réponse automatique..."
                value={newRule.response || ''}
                onChange={(e) => setNewRule({ ...newRule, response: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="rule-enabled"
                  checked={newRule.enabled || false}
                  onCheckedChange={(checked) => setNewRule({ ...newRule, enabled: checked })}
                />
                <Label htmlFor="rule-enabled">Activer la règle</Label>
              </div>
              
              {aiEnabled && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rule-ai"
                    checked={newRule.useAI || false}
                    onCheckedChange={(checked) => setNewRule({ ...newRule, useAI: checked })}
                  />
                  <Label htmlFor="rule-ai">Utiliser l'IA pour cette réponse</Label>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCreateRule}>Créer la règle</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des règles */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium">{rule.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      Priorité {rule.priority}
                    </Badge>
                    {rule.useAI && aiEnabled && (
                      <Badge className="bg-blue-500 text-white text-xs">
                        🤖 IA
                      </Badge>
                    )}
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Déclencheurs: </span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {rule.trigger}
                      </code>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Réponse: </span>
                      <p className="text-sm text-gray-700 mt-1">{rule.response}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRule(rule.id)}
                  >
                    {rule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Aucune règle de réponse automatique
            </h3>
            <p className="text-gray-500 mb-4">
              Créez votre première règle pour automatiser vos réponses WhatsApp
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une règle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
