
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Euro, 
  Target, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';

export const CampaignAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  // Données pour les graphiques
  const performanceData = [
    { name: 'Lun', impressions: 12000, clics: 380, conversions: 24, cout: 285 },
    { name: 'Mar', impressions: 15000, clics: 445, conversions: 31, cout: 342 },
    { name: 'Mer', impressions: 18000, clics: 520, conversions: 28, cout: 398 },
    { name: 'Jeu', impressions: 14000, clics: 410, conversions: 35, cout: 315 },
    { name: 'Ven', impressions: 22000, clics: 680, conversions: 42, cout: 521 },
    { name: 'Sam', impressions: 25000, clics: 750, conversions: 48, cout: 598 },
    { name: 'Dim', impressions: 19000, clics: 590, conversions: 38, cout: 456 }
  ];

  const platformData = [
    { name: 'Google Ads', value: 45, budget: 3200, conversions: 156, color: '#4285F4' },
    { name: 'Facebook', value: 30, budget: 2100, conversions: 98, color: '#1877F2' },
    { name: 'LinkedIn', value: 15, budget: 1200, conversions: 45, color: '#0A66C2' },
    { name: 'Instagram', value: 10, budget: 800, conversions: 32, color: '#E4405F' }
  ];

  const conversionFunnelData = [
    { etape: 'Impressions', valeur: 125000, pourcentage: 100 },
    { etape: 'Clics', valeur: 4200, pourcentage: 3.36 },
    { etape: 'Visites', valeur: 3800, pourcentage: 90.48 },
    { etape: 'Leads', valeur: 347, pourcentage: 9.13 },
    { etape: 'Conversions', valeur: 89, pourcentage: 25.65 }
  ];

  const topCampaigns = [
    {
      name: "Black Friday 2024",
      roi: 285,
      budget: 5000,
      revenus: 14250,
      conversions: 347,
      status: "active"
    },
    {
      name: "Lancement Produit Q1",
      roi: 240,
      budget: 8500,
      revenus: 20400,
      conversions: 523,
      status: "active"
    },
    {
      name: "Retargeting Automne",
      roi: 180,
      budget: 2000,
      revenus: 3600,
      conversions: 156,
      status: "paused"
    }
  ];

  const metrics = [
    {
      title: "ROI Total",
      value: "245%",
      change: "+18%",
      icon: Euro,
      color: "text-green-500"
    },
    {
      title: "Conversions",
      value: "1,247",
      change: "+125",
      icon: Target,
      color: "text-blue-500"
    },
    {
      title: "CPA Moyen",
      value: "18.50€",
      change: "-2.30€",
      icon: TrendingUp,
      color: "text-purple-500"
    },
    {
      title: "CTR Moyen",
      value: "3.42%",
      change: "+0.8%",
      icon: Users,
      color: "text-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Analytics des Campagnes
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Analysez les performances de vos campagnes marketing
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <div className="flex space-x-1">
            {['7days', '30days', '90days'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period === '7days' ? '7j' : period === '30days' ? '30j' : '90j'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="platforms">Plateformes</TabsTrigger>
          <TabsTrigger value="funnel">Entonnoir</TabsTrigger>
          <TabsTrigger value="campaigns">Top Campagnes</TabsTrigger>
        </TabsList>

        {/* Onglet Performance */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance sur 7 jours</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="impressions" stroke="#8884d8" name="Impressions" />
                    <Line type="monotone" dataKey="clics" stroke="#82ca9d" name="Clics" />
                    <Line type="monotone" dataKey="conversions" stroke="#ffc658" name="Conversions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coûts et Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cout" fill="#8884d8" name="Coût (€)" />
                    <Bar dataKey="conversions" fill="#82ca9d" name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Plateformes */}
        <TabsContent value="platforms">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition du trafic</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance par plateforme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformData.map((platform, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: platform.color }}
                        />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {platform.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {platform.conversions} conversions
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Budget: {platform.budget}€
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Entonnoir */}
        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Entonnoir de Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnelData.map((etape, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {etape.etape}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {etape.valeur.toLocaleString()}
                        </span>
                        {index > 0 && (
                          <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                            ({etape.pourcentage.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-4"
                        style={{ 
                          width: index === 0 ? '100%' : `${Math.max(etape.pourcentage * 2, 10)}%` 
                        }}
                      >
                        <span className="text-white text-sm font-medium">
                          {etape.valeur.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Top Campagnes */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Meilleures Campagnes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCampaigns.map((campaign, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {campaign.name}
                        </h4>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status === 'active' ? 'Actif' : 'En pause'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-8 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-green-600">{campaign.roi}%</p>
                        <p className="text-slate-600 dark:text-slate-400">ROI</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {campaign.revenus.toLocaleString()}€
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">Revenus</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {campaign.conversions}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">Conversions</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {campaign.budget.toLocaleString()}€
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">Budget</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
