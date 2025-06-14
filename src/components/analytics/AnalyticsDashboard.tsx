
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Eye, MousePointer, DollarSign, Users, Share2, Search } from 'lucide-react';

const trafficData = [
  { name: 'Jan', organic: 4000, paid: 2400, social: 1400, direct: 3000 },
  { name: 'Fév', organic: 3000, paid: 1398, social: 2210, direct: 2800 },
  { name: 'Mar', organic: 2000, paid: 9800, social: 2290, direct: 3200 },
  { name: 'Avr', organic: 2780, paid: 3908, social: 2000, direct: 2900 },
  { name: 'Mai', organic: 1890, paid: 4800, social: 2181, direct: 3100 },
  { name: 'Jun', organic: 2390, paid: 3800, social: 2500, direct: 3300 },
];

const conversionData = [
  { name: 'Lun', conversions: 24, cost: 1200 },
  { name: 'Mar', conversions: 13, cost: 800 },
  { name: 'Mer', conversions: 98, cost: 2100 },
  { name: 'Jeu', conversions: 39, cost: 1500 },
  { name: 'Ven', conversions: 48, cost: 1800 },
  { name: 'Sam', conversions: 38, cost: 1400 },
  { name: 'Dim', conversions: 43, cost: 1700 },
];

const channelData = [
  { name: 'SEO', value: 45, color: '#3b82f6' },
  { name: 'SEM', value: 25, color: '#10b981' },
  { name: 'Social', value: 20, color: '#8b5cf6' },
  { name: 'Direct', value: 10, color: '#f59e0b' },
];

const keywordsData = [
  { keyword: 'marketing digital', position: 3, traffic: 1250, change: 2 },
  { keyword: 'seo optimization', position: 7, traffic: 890, change: -1 },
  { keyword: 'content marketing', position: 12, traffic: 650, change: 5 },
  { keyword: 'social media', position: 5, traffic: 980, change: 0 },
  { keyword: 'email marketing', position: 15, traffic: 420, change: -3 },
];

export const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Analytics & Performance
        </h2>
        <div className="flex space-x-2">
          <Badge variant="secondary">Données en temps réel</Badge>
          <Badge variant="outline">Dernière MAJ: il y a 5 min</Badge>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sessions</p>
                <p className="text-2xl font-bold">24,567</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500 font-medium">+12.5%</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Taux de conversion</p>
                <p className="text-2xl font-bold">3.24%</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500 font-medium">+0.8%</span>
                </div>
              </div>
              <div className="p-3 bg-green-500 rounded-lg">
                <MousePointer className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Revenus</p>
                <p className="text-2xl font-bold">€45,230</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500 font-medium">+18.2%</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-500 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Engagement</p>
                <p className="text-2xl font-bold">4.2M</p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-500 font-medium">-2.1%</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500 rounded-lg">
                <Share2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques détaillés */}
      <Tabs defaultValue="traffic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="traffic">Trafic</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="channels">Canaux</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle>Sources de Trafic - 6 Derniers Mois</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'rgb(51 65 85)', border: 'none', borderRadius: '8px', color: 'white' }} />
                  <Line type="monotone" dataKey="organic" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                  <Line type="monotone" dataKey="social" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} />
                  <Line type="monotone" dataKey="direct" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Conversions - 7 Derniers Jours</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'rgb(51 65 85)', border: 'none', borderRadius: '8px', color: 'white' }} />
                  <Bar dataKey="conversions" fill="#3b82f6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
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
                <CardTitle>Performance par Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {channelData.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: channel.color }}></div>
                        <span className="font-medium">{channel.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{channel.value}%</div>
                        <div className="text-sm text-slate-500">du trafic total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Performance SEO - Top Keywords</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Mot-clé</th>
                      <th className="text-left p-3 font-semibold">Position</th>
                      <th className="text-left p-3 font-semibold">Trafic</th>
                      <th className="text-left p-3 font-semibold">Évolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywordsData.map((keyword, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="p-3 font-medium">{keyword.keyword}</td>
                        <td className="p-3">
                          <Badge variant={keyword.position <= 5 ? 'default' : keyword.position <= 10 ? 'secondary' : 'outline'}>
                            #{keyword.position}
                          </Badge>
                        </td>
                        <td className="p-3">{keyword.traffic.toLocaleString()}</td>
                        <td className="p-3">
                          <div className="flex items-center">
                            {keyword.change > 0 ? (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                <span className="text-green-500">+{keyword.change}</span>
                              </>
                            ) : keyword.change < 0 ? (
                              <>
                                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                                <span className="text-red-500">{keyword.change}</span>
                              </>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
