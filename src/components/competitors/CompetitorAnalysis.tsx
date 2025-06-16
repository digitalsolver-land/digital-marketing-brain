import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CompetitorKeywords } from './CompetitorKeywords';
import { CompetitorAlerts } from './CompetitorAlerts';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Globe, 
  Star,
  Plus,
  ExternalLink,
  AlertTriangle,
  BarChart3,
  Users,
  Target,
  Zap
} from 'lucide-react';

export const CompetitorAnalysis = () => {
  const { toast } = useToast();
  const [searchUrl, setSearchUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Données de démonstration
  const competitors = [
    {
      id: 1,
      name: "Competitor A",
      website: "https://competitor-a.com",
      industry: "E-commerce",
      marketShare: "23%",
      traffic: "2.5M",
      keywords: 1247,
      backlinks: "45K",
      socialFollowers: "125K",
      status: "active",
      trend: "up",
      lastAnalyzed: "Il y a 2 heures"
    },
    {
      id: 2,
      name: "Competitor B",
      website: "https://competitor-b.com",
      industry: "SaaS",
      marketShare: "18%",
      traffic: "1.8M",
      keywords: 892,
      backlinks: "32K",
      socialFollowers: "89K",
      status: "monitoring",
      trend: "down",
      lastAnalyzed: "Il y a 1 jour"
    },
    {
      id: 3,
      name: "Competitor C",
      website: "https://competitor-c.com",
      industry: "Services",
      marketShare: "15%",
      traffic: "1.2M",
      keywords: 654,
      backlinks: "28K",
      socialFollowers: "67K",
      status: "new",
      trend: "up",
      lastAnalyzed: "Il y a 3 heures"
    }
  ];

  const metrics = [
    {
      title: "Concurrents Surveillés",
      value: "12",
      change: "+3",
      icon: Users,
      color: "text-blue-500"
    },
    {
      title: "Mots-clés Suivis",
      value: "2,847",
      change: "+156",
      icon: Target,
      color: "text-green-500"
    },
    {
      title: "Alertes Actives",
      value: "8",
      change: "+2",
      icon: AlertTriangle,
      color: "text-orange-500"
    },
    {
      title: "Score Moyen",
      value: "7.2/10",
      change: "+0.3",
      icon: Star,
      color: "text-purple-500"
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: "keyword",
      message: "Competitor A a gagné 15 positions sur 'marketing digital'",
      severity: "high",
      time: "Il y a 1 heure"
    },
    {
      id: 2,
      type: "content",
      message: "Nouveau contenu publié par Competitor B",
      severity: "medium",
      time: "Il y a 2 heures"
    },
    {
      id: 3,
      type: "backlink",
      message: "Competitor C a obtenu un backlink de haute autorité",
      severity: "high",
      time: "Il y a 4 heures"
    }
  ];

  const handleAddCompetitor = () => {
    if (!searchUrl.trim()) {
      toast({
        title: "URL requise",
        description: "Veuillez entrer une URL valide",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulation d'ajout d'un concurrent
    setTimeout(() => {
      toast({
        title: "Concurrent ajouté",
        description: `${searchUrl} a été ajouté à votre liste de surveillance`,
      });
      setSearchUrl('');
      setLoading(false);
    }, 2000);
  };

  const handleAnalyze = (competitor: any) => {
    toast({
      title: "Analyse en cours",
      description: `Analyse de ${competitor.name} en cours...`,
    });
    console.log('Analyse du concurrent:', competitor);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-100';
      case 'medium': return 'text-orange-500 bg-orange-100';
      case 'low': return 'text-green-500 bg-green-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Surveillance Concurrentielle
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Analysez et surveillez vos concurrents en temps réel
          </p>
        </div>
        <div className="flex space-x-3">
          <div className="flex space-x-2">
            <Input
              placeholder="URL du concurrent à ajouter..."
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              className="w-64"
            />
            <Button 
              onClick={handleAddCompetitor}
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Ajouter
            </Button>
          </div>
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
          <TabsTrigger value="competitors">Concurrents</TabsTrigger>
          <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Alertes récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span>Alertes Récentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className={`w-3 h-3 rounded-full mt-2 ${getSeverityColor(alert.severity).split(' ')[1]}`} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {alert.message}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {alert.time}
                      </p>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          {/* Liste des concurrents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Concurrents Surveillés</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitors.map((competitor) => (
                  <div key={competitor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        competitor.status === 'active' ? 'bg-green-500' : 
                        competitor.status === 'monitoring' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {competitor.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                          <Globe className="w-4 h-4" />
                          <span>{competitor.website}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-slate-900 dark:text-white">{competitor.traffic}</p>
                        <p className="text-slate-600 dark:text-slate-400">Trafic</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-slate-900 dark:text-white">{competitor.keywords}</p>
                        <p className="text-slate-600 dark:text-slate-400">Mots-clés</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          {competitor.trend === 'up' ? 
                            <TrendingUp className="w-4 h-4 text-green-500" /> : 
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          }
                          <p className="font-medium text-slate-900 dark:text-white">{competitor.marketShare}</p>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">Parts de marché</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAnalyze(competitor)}
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Analyser
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <CompetitorKeywords />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <CompetitorAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
};
