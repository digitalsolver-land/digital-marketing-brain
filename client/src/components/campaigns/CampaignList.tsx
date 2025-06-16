
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Eye, 
  Edit,
  Trash2,
  Target,
  Calendar,
  Euro
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const CampaignList = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: "Black Friday 2024",
      type: "Email Marketing",
      status: "active",
      budget: 5000,
      spent: 3200,
      impressions: 125000,
      clicks: 4200,
      conversions: 347,
      ctr: "3.36%",
      cpc: "0.76€",
      startDate: "2024-11-15",
      endDate: "2024-11-30",
      platforms: ["Email", "Facebook", "Google"]
    },
    {
      id: 2,
      name: "Lancement Produit Q1",
      type: "SEM + Display",
      status: "active",
      budget: 8500,
      spent: 6100,
      impressions: 245000,
      clicks: 8900,
      conversions: 523,
      ctr: "3.63%",
      cpc: "0.69€",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
      platforms: ["Google Ads", "LinkedIn", "Display"]
    },
    {
      id: 3,
      name: "Retargeting Automne",
      type: "Retargeting",
      status: "paused",
      budget: 2000,
      spent: 1800,
      impressions: 89000,
      clicks: 2100,
      conversions: 156,
      ctr: "2.36%",
      cpc: "0.86€",
      startDate: "2024-09-01",
      endDate: "2024-11-30",
      platforms: ["Facebook", "Google", "Instagram"]
    },
    {
      id: 4,
      name: "Campagne Locale",
      type: "Local SEO",
      status: "completed",
      budget: 1500,
      spent: 1500,
      impressions: 45000,
      clicks: 1200,
      conversions: 89,
      ctr: "2.67%",
      cpc: "1.25€",
      startDate: "2024-06-01",
      endDate: "2024-08-31",
      platforms: ["Google My Business", "Local Ads"]
    },
    {
      id: 5,
      name: "Webinar Tech",
      type: "Lead Generation",
      status: "scheduled",
      budget: 3000,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: "0%",
      cpc: "0€",
      startDate: "2024-12-15",
      endDate: "2024-12-31",
      platforms: ["LinkedIn", "Email", "Webinar"]
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'paused': return 'En pause';
      case 'completed': return 'Terminé';
      case 'scheduled': return 'Programmé';
      default: return status;
    }
  };

  const handleCampaignAction = (campaignId: number, action: string) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id === campaignId) {
        switch (action) {
          case 'pause':
            toast({
              title: "Campagne mise en pause",
              description: `${campaign.name} a été mise en pause avec succès.`,
            });
            return { ...campaign, status: 'paused' };
          case 'activate':
            toast({
              title: "Campagne activée",
              description: `${campaign.name} a été activée avec succès.`,
            });
            return { ...campaign, status: 'active' };
          case 'view':
            toast({
              title: "Ouverture des détails",
              description: `Affichage des détails de ${campaign.name}`,
            });
            return campaign;
          case 'edit':
            toast({
              title: "Mode édition",
              description: `Édition de ${campaign.name}`,
            });
            return campaign;
          case 'delete':
            toast({
              title: "Campagne supprimée",
              description: `${campaign.name} a été supprimée`,
              variant: "destructive"
            });
            return null;
          default:
            return campaign;
        }
      }
      return campaign;
    }).filter(Boolean));
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Rechercher une campagne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Toutes
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('active')}
          >
            Actives
          </Button>
          <Button
            variant={filterStatus === 'paused' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('paused')}
          >
            En pause
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Liste des campagnes */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${
                    campaign.status === 'active' ? 'bg-green-500' :
                    campaign.status === 'paused' ? 'bg-yellow-500' :
                    campaign.status === 'completed' ? 'bg-blue-500' :
                    'bg-purple-500'
                  }`} />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {campaign.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(campaign.status)}>
                    {getStatusText(campaign.status)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'view')}>
                        <Eye className="w-4 h-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'edit')}>
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      {campaign.status === 'active' ? (
                        <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'pause')}>
                          <Pause className="w-4 h-4 mr-2" />
                          Mettre en pause
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleCampaignAction(campaign.id, 'activate')}>
                          <Play className="w-4 h-4 mr-2" />
                          Activer
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleCampaignAction(campaign.id, 'delete')}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Métriques principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Budget</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {campaign.budget.toLocaleString()}€
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Dépensé</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {campaign.spent.toLocaleString()}€
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Impressions</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {campaign.impressions.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Clics</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {campaign.clicks.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">CTR</p>
                  <p className="text-lg font-semibold text-green-600">
                    {campaign.ctr}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Conversions</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {campaign.conversions}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">Plateformes:</span>
                  <div className="flex space-x-1">
                    {campaign.platforms.map((platform, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{campaign.startDate} → {campaign.endDate}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Euro className="w-4 h-4" />
                    <span>CPC: {campaign.cpc}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                  <span>Progression du budget</span>
                  <span>{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Aucune campagne trouvée
            </h3>
            <p className="text-slate-500">
              Essayez de modifier vos critères de recherche ou créez une nouvelle campagne
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
