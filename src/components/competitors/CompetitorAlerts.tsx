
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Plus, 
  Bell, 
  Settings,
  Target,
  Globe,
  TrendingUp
} from 'lucide-react';

export const CompetitorAlerts = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const alerts = [
    {
      id: 1,
      name: "Position Keywords",
      description: "Alerter quand un concurrent change de position sur nos mots-clés",
      type: "keyword",
      active: true,
      conditions: "Position change > 3",
      frequency: "Immédiat"
    },
    {
      id: 2,
      name: "Nouveau Contenu",
      description: "Notification lors de publication de nouveau contenu",
      type: "content",
      active: true,
      conditions: "Nouveau blog post",
      frequency: "Quotidien"
    },
    {
      id: 3,
      name: "Backlinks Qualité",
      description: "Surveillance des nouveaux backlinks de haute autorité",
      type: "backlink",
      active: false,
      conditions: "Domain Authority > 70",
      frequency: "Hebdomadaire"
    }
  ];

  const handleCreateAlert = () => {
    toast({
      title: "Alerte créée",
      description: "Nouvelle alerte de surveillance configurée",
    });
    setShowForm(false);
  };

  const toggleAlert = (alertId: number) => {
    toast({
      title: "Alerte mise à jour",
      description: "Paramètres de l'alerte modifiés",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'keyword': return <Target className="w-4 h-4" />;
      case 'content': return <Globe className="w-4 h-4" />;
      case 'backlink': return <TrendingUp className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'keyword': return 'text-purple-500 bg-purple-100';
      case 'content': return 'text-blue-500 bg-blue-100';
      case 'backlink': return 'text-green-500 bg-green-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span>Alertes Configurées</span>
            </CardTitle>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Alerte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${getTypeColor(alert.type)}`}>
                    {getTypeIcon(alert.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {alert.name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {alert.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                      <span>Conditions: {alert.conditions}</span>
                      <span>Fréquence: {alert.frequency}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={alert.active ? "default" : "secondary"}>
                    {alert.active ? "Actif" : "Inactif"}
                  </Badge>
                  <Switch 
                    checked={alert.active}
                    onCheckedChange={() => toggleAlert(alert.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-slate-500" />
              <span>Créer une Nouvelle Alerte</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alert-name">Nom de l'alerte</Label>
                <Input id="alert-name" placeholder="Ex: Changement de position" />
              </div>
              <div>
                <Label htmlFor="alert-type">Type d'alerte</Label>
                <select id="alert-type" className="w-full h-10 px-3 rounded-md border border-input bg-background">
                  <option value="keyword">Mots-clés</option>
                  <option value="content">Contenu</option>
                  <option value="backlink">Backlinks</option>
                  <option value="traffic">Trafic</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="alert-description">Description</Label>
              <Input id="alert-description" placeholder="Description de l'alerte..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alert-conditions">Conditions</Label>
                <Input id="alert-conditions" placeholder="Ex: Position change > 5" />
              </div>
              <div>
                <Label htmlFor="alert-frequency">Fréquence</Label>
                <select id="alert-frequency" className="w-full h-10 px-3 rounded-md border border-input bg-background">
                  <option value="immediate">Immédiat</option>
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateAlert}>
                Créer l'Alerte
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
