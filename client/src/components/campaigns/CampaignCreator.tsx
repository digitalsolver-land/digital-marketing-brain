import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft,
  Target, 
  Calendar,
  Euro,
  Users,
  Settings,
  Eye,
  Save,
  Send
} from 'lucide-react';

interface CampaignCreatorProps {
  onBack: () => void;
  onSave: (campaign: any) => void;
  template?: any;
}

export const CampaignCreator: React.FC<CampaignCreatorProps> = ({ 
  onBack, 
  onSave, 
  template 
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [campaignData, setCampaignData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    type: template?.category || 'email',
    budget: template?.estimatedBudget?.split('-')[0]?.replace('€', '') || '1000',
    startDate: '',
    endDate: '',
    platforms: template?.platforms || [],
    targetAudience: {
      ageMin: 18,
      ageMax: 65,
      gender: 'all',
      interests: [],
      location: 'France'
    },
    objectives: {
      primary: 'conversions',
      kpis: ['ctr', 'conversions', 'roi']
    }
  });

  const platforms = [
    { id: 'email', name: 'Email Marketing', icon: '📧' },
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'google', name: 'Google Ads', icon: '🔍' },
    { id: 'youtube', name: 'YouTube', icon: '📺' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' }
  ];

  const objectives = [
    { id: 'awareness', name: 'Notoriété', description: 'Augmenter la visibilité de la marque' },
    { id: 'traffic', name: 'Trafic', description: 'Générer du trafic vers le site web' },
    { id: 'leads', name: 'Génération de leads', description: 'Collecter des contacts qualifiés' },
    { id: 'conversions', name: 'Conversions', description: 'Augmenter les ventes et conversions' },
    { id: 'engagement', name: 'Engagement', description: 'Améliorer l\'interaction avec la marque' }
  ];

  const handlePlatformToggle = (platformId: string) => {
    setCampaignData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((p: string) => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const handleSave = () => {
    const campaign = {
      ...campaignData,
      id: Date.now(),
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    onSave(campaign);
  };

  const handlePreview = () => {
    console.log('Aperçu de la campagne:', campaignData);
  };

  const handleLaunch = () => {
    const campaign = {
      ...campaignData,
      id: Date.now(),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    onSave(campaign);
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
              {template ? `Créer depuis "${template.name}"` : 'Nouvelle Campagne'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Configurez votre campagne marketing multi-canaux
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
          <Button onClick={handleLaunch}>
            <Send className="w-4 h-4 mr-2" />
            Lancer
          </Button>
        </div>
      </div>

      {/* Formulaire principal */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Informations</TabsTrigger>
              <TabsTrigger value="platforms">Plateformes</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="objectives">Objectifs</TabsTrigger>
            </TabsList>

            {/* Onglet Informations de base */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom de la campagne *</Label>
                    <Input
                      id="name"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData(prev => ({...prev, name: e.target.value}))}
                      placeholder="Ex: Black Friday 2024"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type de campagne</Label>
                    <Select value={campaignData.type} onValueChange={(value) => setCampaignData(prev => ({...prev, type: value}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email Marketing</SelectItem>
                        <SelectItem value="social">Réseaux Sociaux</SelectItem>
                        <SelectItem value="sem">SEM/SEA</SelectItem>
                        <SelectItem value="display">Display</SelectItem>
                        <SelectItem value="mixed">Multi-canal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={campaignData.startDate}
                      onChange={(e) => setCampaignData(prev => ({...prev, startDate: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Date de fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={campaignData.endDate}
                      onChange={(e) => setCampaignData(prev => ({...prev, endDate: e.target.value}))}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={campaignData.description}
                  onChange={(e) => setCampaignData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Décrivez les objectifs et le contenu de votre campagne..."
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* Onglet Plateformes */}
            <TabsContent value="platforms" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Sélectionnez vos plateformes</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {platforms.map((platform) => (
                    <Card
                      key={platform.id}
                      className={`cursor-pointer transition-all ${
                        campaignData.platforms.includes(platform.id)
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handlePlatformToggle(platform.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{platform.icon}</div>
                        <h4 className="font-medium text-sm">{platform.name}</h4>
                        {campaignData.platforms.includes(platform.id) && (
                          <Badge className="mt-2" variant="default">Sélectionné</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {campaignData.platforms.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Plateformes sélectionnées:</h4>
                    <div className="flex flex-wrap gap-2">
                      {campaignData.platforms.map((platformId: string) => {
                        const platform = platforms.find(p => p.id === platformId);
                        return platform ? (
                          <Badge key={platformId} variant="outline">
                            {platform.icon} {platform.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Onglet Audience */}
            <TabsContent value="audience" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Démographie</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Âge minimum</Label>
                      <Input
                        type="number"
                        value={campaignData.targetAudience.ageMin}
                        onChange={(e) => setCampaignData(prev => ({
                          ...prev,
                          targetAudience: {...prev.targetAudience, ageMin: parseInt(e.target.value)}
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Âge maximum</Label>
                      <Input
                        type="number"
                        value={campaignData.targetAudience.ageMax}
                        onChange={(e) => setCampaignData(prev => ({
                          ...prev,
                          targetAudience: {...prev.targetAudience, ageMax: parseInt(e.target.value)}
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Genre</Label>
                    <Select 
                      value={campaignData.targetAudience.gender}
                      onValueChange={(value) => setCampaignData(prev => ({
                        ...prev,
                        targetAudience: {...prev.targetAudience, gender: value}
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="male">Homme</SelectItem>
                        <SelectItem value="female">Femme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Géolocalisation</h3>
                  <div>
                    <Label>Localisation</Label>
                    <Input
                      value={campaignData.targetAudience.location}
                      onChange={(e) => setCampaignData(prev => ({
                        ...prev,
                        targetAudience: {...prev.targetAudience, location: e.target.value}
                      }))}
                      placeholder="Ex: France, Paris, etc."
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Budget */}
            <TabsContent value="budget" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Euro className="w-5 h-5 text-green-500" />
                      <span>Budget Total</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Montant (€)</Label>
                      <Input
                        type="number"
                        value={campaignData.budget}
                        onChange={(e) => setCampaignData(prev => ({...prev, budget: e.target.value}))}
                        placeholder="1000"
                      />
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Budget recommandé selon le type de campagne et les plateformes sélectionnées
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Estimation ROI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>ROI estimé:</span>
                        <span className="font-bold text-green-600">180-250%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversions attendues:</span>
                        <span className="font-bold">50-80</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CPA estimé:</span>
                        <span className="font-bold">12-20€</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Objectifs */}
            <TabsContent value="objectives" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Objectif principal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {objectives.map((objective) => (
                    <Card
                      key={objective.id}
                      className={`cursor-pointer transition-all ${
                        campaignData.objectives.primary === objective.id
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setCampaignData(prev => ({
                        ...prev,
                        objectives: {...prev.objectives, primary: objective.id}
                      }))}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">{objective.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {objective.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
