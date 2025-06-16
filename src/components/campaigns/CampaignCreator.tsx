
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Target, 
  Calendar, 
  Euro, 
  Users,
  Mail,
  MessageSquare,
  Globe,
  Settings
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CampaignCreatorProps {
  onBack: () => void;
  onSave: (campaign: any) => void;
}

export const CampaignCreator: React.FC<CampaignCreatorProps> = ({ onBack, onSave }) => {
  const [campaignData, setCampaignData] = useState({
    name: '',
    type: '',
    description: '',
    budget: '',
    startDate: '',
    endDate: '',
    targetAudience: '',
    platforms: [] as string[],
    objectives: [] as string[],
    keywords: '',
    content: {
      title: '',
      description: '',
      cta: '',
      images: [] as string[]
    }
  });

  const campaignTypes = [
    { value: 'email', label: 'Email Marketing', icon: Mail },
    { value: 'social', label: 'Réseaux Sociaux', icon: MessageSquare },
    { value: 'sem', label: 'Search Engine Marketing', icon: Globe },
    { value: 'display', label: 'Display Advertising', icon: Target },
    { value: 'retargeting', label: 'Retargeting', icon: Users }
  ];

  const platforms = [
    'Google Ads', 'Facebook', 'Instagram', 'LinkedIn', 'Twitter', 
    'Email', 'YouTube', 'TikTok', 'Pinterest', 'Snapchat'
  ];

  const objectives = [
    'Génération de leads', 'Ventes', 'Notoriété', 'Engagement', 
    'Trafic web', 'Téléchargements', 'Inscriptions', 'Fidélisation'
  ];

  const handleSave = () => {
    onSave(campaignData);
  };

  const handleLaunch = () => {
    onSave({ ...campaignData, status: 'active' });
  };

  const togglePlatform = (platform: string) => {
    setCampaignData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const toggleObjective = (objective: string) => {
    setCampaignData(prev => ({
      ...prev,
      objectives: prev.objectives.includes(objective)
        ? prev.objectives.filter(o => o !== objective)
        : [...prev.objectives, objective]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Créer une Campagne
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Configurez votre nouvelle campagne marketing
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
          <Button onClick={handleLaunch}>
            <Play className="w-4 h-4 mr-2" />
            Lancer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="targeting">Ciblage</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="review">Révision</TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <span>Informations Générales</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la campagne</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Black Friday 2024"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type de campagne</Label>
                  <Select
                    value={campaignData.type}
                    onValueChange={(value) => setCampaignData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez les objectifs et le contexte de votre campagne..."
                  value={campaignData.description}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={campaignData.startDate}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={campaignData.endDate}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Plateformes</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {platforms.map((platform) => (
                    <Button
                      key={platform}
                      variant={campaignData.platforms.includes(platform) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => togglePlatform(platform)}
                      className="justify-start"
                    >
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Ciblage */}
        <TabsContent value="targeting">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-500" />
                <span>Ciblage et Objectifs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Audience cible</Label>
                <Textarea
                  id="targetAudience"
                  placeholder="Décrivez votre audience cible (âge, intérêts, localisation, etc.)"
                  value={campaignData.targetAudience}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label>Objectifs de la campagne</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {objectives.map((objective) => (
                    <Button
                      key={objective}
                      variant={campaignData.objectives.includes(objective) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleObjective(objective)}
                      className="justify-start h-auto p-3"
                    >
                      {objective}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Mots-clés (séparés par des virgules)</Label>
                <Textarea
                  id="keywords"
                  placeholder="Ex: marketing digital, publicité en ligne, génération de leads"
                  value={campaignData.keywords}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, keywords: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Budget */}
        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Euro className="w-5 h-5 text-yellow-500" />
                <span>Budget et Planification</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget total (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="5000"
                    value={campaignData.budget}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, budget: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Budget journalier estimé</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {campaignData.budget && campaignData.startDate && campaignData.endDate
                        ? `${Math.round(Number(campaignData.budget) / 
                            Math.max(1, Math.ceil((new Date(campaignData.endDate).getTime() - new Date(campaignData.startDate).getTime()) / (1000 * 60 * 60 * 24))))}€`
                        : '0€'
                      }
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">par jour</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Durée de la campagne</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {campaignData.startDate && campaignData.endDate
                        ? `${Math.ceil((new Date(campaignData.endDate).getTime() - new Date(campaignData.startDate).getTime()) / (1000 * 60 * 60 * 24))} jours`
                        : '0 jours'
                      }
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">durée totale</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Estimation des performances</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Impressions estimées:</span>
                      <span className="font-medium">{Number(campaignData.budget) * 50 || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Clics estimés:</span>
                      <span className="font-medium">{Math.round(Number(campaignData.budget) * 1.5) || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Conversions estimées:</span>
                      <span className="font-medium">{Math.round(Number(campaignData.budget) * 0.1) || 0}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Répartition du budget</h4>
                  <div className="space-y-3">
                    {campaignData.platforms.map((platform, index) => (
                      <div key={platform} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{platform}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${100 / campaignData.platforms.length}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium min-w-16">
                            {Math.round(Number(campaignData.budget) / campaignData.platforms.length) || 0}€
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Contenu */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-500" />
                <span>Contenu de la Campagne</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contentTitle">Titre principal</Label>
                  <Input
                    id="contentTitle"
                    placeholder="Ex: Profitez de -50% sur tout le site"
                    value={campaignData.content.title}
                    onChange={(e) => setCampaignData(prev => ({
                      ...prev,
                      content: { ...prev.content, title: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentCta">Call-to-Action</Label>
                  <Input
                    id="contentCta"
                    placeholder="Ex: Acheter maintenant"
                    value={campaignData.content.cta}
                    onChange={(e) => setCampaignData(prev => ({
                      ...prev,
                      content: { ...prev.content, cta: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentDescription">Description du contenu</Label>
                <Textarea
                  id="contentDescription"
                  placeholder="Décrivez le message principal de votre campagne..."
                  value={campaignData.content.description}
                  onChange={(e) => setCampaignData(prev => ({
                    ...prev,
                    content: { ...prev.content, description: e.target.value }
                  }))}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label>Aperçu du contenu</Label>
                <Card className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto flex items-center justify-center">
                      <Target className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {campaignData.content.title || 'Titre de votre campagne'}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-2">
                        {campaignData.content.description || 'Description de votre campagne apparaîtra ici'}
                      </p>
                      <Button className="mt-4">
                        {campaignData.content.cta || 'Call-to-Action'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Révision */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-red-500" />
                <span>Révision et Lancement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Résumé de la campagne</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Nom:</span>
                      <span className="font-medium">{campaignData.name || 'Non défini'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Type:</span>
                      <span className="font-medium">{campaignData.type || 'Non défini'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Budget:</span>
                      <span className="font-medium">{campaignData.budget || 0}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Durée:</span>
                      <span className="font-medium">
                        {campaignData.startDate && campaignData.endDate
                          ? `${campaignData.startDate} → ${campaignData.endDate}`
                          : 'Non définie'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Plateformes sélectionnées</h4>
                  <div className="flex flex-wrap gap-2">
                    {campaignData.platforms.length > 0 ? (
                      campaignData.platforms.map((platform) => (
                        <Badge key={platform} variant="outline">
                          {platform}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">Aucune plateforme sélectionnée</span>
                    )}
                  </div>
                  
                  <h4 className="font-semibold text-slate-900 dark:text-white">Objectifs</h4>
                  <div className="flex flex-wrap gap-2">
                    {campaignData.objectives.length > 0 ? (
                      campaignData.objectives.map((objective) => (
                        <Badge key={objective} variant="outline">
                          {objective}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm">Aucun objectif sélectionné</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Prêt à lancer ?</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Vérifiez tous les paramètres avant de lancer votre campagne
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder en brouillon
                    </Button>
                    <Button onClick={handleLaunch} disabled={!campaignData.name || !campaignData.type || !campaignData.budget}>
                      <Play className="w-4 h-4 mr-2" />
                      Lancer la campagne
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
