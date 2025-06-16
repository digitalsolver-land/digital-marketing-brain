
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CampaignList } from './CampaignList';
import { CampaignCreator } from './CampaignCreator';
import { CampaignAnalytics } from './CampaignAnalytics';
import { CampaignTemplates } from './CampaignTemplates';
import { 
  Target, 
  Plus, 
  BarChart3, 
  Calendar, 
  Users,
  TrendingUp,
  Mail,
  MessageSquare
} from 'lucide-react';

export const CampaignManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreator, setShowCreator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Données de démonstration pour les métriques principales
  const metrics = [
    {
      title: "Campagnes Actives",
      value: "12",
      change: "+3",
      icon: Target,
      color: "text-blue-500"
    },
    {
      title: "Taux de Conversion",
      value: "3.24%",
      change: "+0.8%",
      icon: TrendingUp,
      color: "text-green-500"
    },
    {
      title: "Leads Générés",
      value: "1,247",
      change: "+125",
      icon: Users,
      color: "text-purple-500"
    },
    {
      title: "ROI Moyen",
      value: "285%",
      change: "+45%",
      icon: BarChart3,
      color: "text-orange-500"
    }
  ];

  const recentCampaigns = [
    {
      id: 1,
      name: "Black Friday 2024",
      type: "Email + Social",
      status: "active",
      budget: "€5,000",
      spent: "€3,200",
      leads: 347,
      conversion: "4.2%"
    },
    {
      id: 2,
      name: "Lancement Produit Q1",
      type: "SEM + Display",
      status: "active",
      budget: "€8,500",
      spent: "€6,100",
      leads: 523,
      conversion: "3.8%"
    },
    {
      id: 3,
      name: "Retargeting Automne",
      type: "Facebook + Google",
      status: "paused",
      budget: "€2,000",
      spent: "€1,800",
      leads: 156,
      conversion: "2.9%"
    }
  ];

  const handleCreateCampaign = (type?: string) => {
    toast({
      title: "Nouvelle campagne",
      description: `Création d'une campagne ${type || 'personnalisée'}`,
    });
    setShowCreator(true);
  };

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setShowCreator(true);
  };

  const handleSaveCampaign = (campaign: any) => {
    toast({
      title: "Campagne sauvegardée",
      description: `${campaign.name} a été ${campaign.status === 'active' ? 'lancée' : 'sauvegardée'} avec succès`,
    });
    console.log('Nouvelle campagne:', campaign);
    setShowCreator(false);
    setSelectedTemplate(null);
  };

  const handleScheduleCampaign = () => {
    toast({
      title: "Planification",
      description: "Ouverture du calendrier de planification",
    });
  };

  if (showCreator) {
    return (
      <CampaignCreator 
        onBack={() => {
          setShowCreator(false);
          setSelectedTemplate(null);
        }}
        onSave={handleSaveCampaign}
        template={selectedTemplate}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Gestion des Campagnes
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Créez et gérez vos campagnes marketing multi-canaux
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm" onClick={handleScheduleCampaign}>
            <Calendar className="w-4 h-4 mr-2" />
            Planifier
          </Button>
          <Button onClick={() => handleCreateCampaign()}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Campagne
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {metric.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {metric.value}
                      </p>
                      <Badge variant="secondary" className="text-green-600 bg-green-100">
                        {metric.change}
                      </Badge>
                    </div>
                  </div>
                  <Icon className={`w-8 h-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Campagnes récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>Campagnes Récentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        campaign.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {campaign.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {campaign.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-slate-900 dark:text-white">{campaign.leads}</p>
                        <p className="text-slate-600 dark:text-slate-400">Leads</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-900 dark:text-white">{campaign.conversion}</p>
                        <p className="text-slate-600 dark:text-slate-400">Conversion</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-900 dark:text-white">{campaign.spent}</p>
                        <p className="text-slate-600 dark:text-slate-400">sur {campaign.budget}</p>
                      </div>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status === 'active' ? 'Actif' : 'En pause'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCreateCampaign('Email')}>
              <CardContent className="p-6 text-center">
                <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Campagne Email
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Créer une campagne d'emailing ciblée
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCreateCampaign('Social')}>
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Campagne Social
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Lancer une campagne sur les réseaux sociaux
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCreateCampaign('SEM')}>
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Campagne SEM
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Configurer une campagne publicitaire payante
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignList />
        </TabsContent>

        <TabsContent value="analytics">
          <CampaignAnalytics />
        </TabsContent>

        <TabsContent value="templates">
          <CampaignTemplates onUseTemplate={handleUseTemplate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
