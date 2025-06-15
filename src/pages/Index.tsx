
import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { WorkflowManager } from '@/components/workflows/WorkflowManager';
import { AIChat } from '@/components/ai/AIChat';
import { ContentGenerator } from '@/components/content/ContentGenerator';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { WhatsAppManager } from '@/components/whatsapp/WhatsAppManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Calendar, Database, Settings, Search } from 'lucide-react';

const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Dashboard Principal
              </h2>
              <div className="flex space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  ✓ Tous systèmes opérationnels
                </Badge>
                <Badge variant="outline">Dernière sync: 2 min</Badge>
              </div>
            </div>
            <MetricsGrid />
            <PerformanceChart />
          </div>
        );

      case 'workflows':
        return <WorkflowManager />;

      case 'ai-chat':
        return <AIChat />;

      case 'content':
        return <ContentGenerator />;

      case 'analytics':
        return <AnalyticsDashboard />;

      case 'whatsapp':
        return <WhatsAppManager />;

      case 'campaigns':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Gestion des Campagnes
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-red-500" />
                  <span>Campagnes Actives</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Module en développement
                  </h3>
                  <p className="text-slate-500">
                    Le gestionnaire de campagnes sera bientôt disponible
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Automatisation Sociale
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-pink-500" />
                  <span>Réseaux Sociaux</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Module en développement
                  </h3>
                  <p className="text-slate-500">
                    L'automatisation sociale sera bientôt disponible
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'competitors':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Surveillance Concurrentielle
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-yellow-500" />
                  <span>Analyse Concurrentielle</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Module en développement
                  </h3>
                  <p className="text-slate-500">
                    L'analyse de la concurrence sera bientôt disponible
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Planning & Calendrier
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-cyan-500" />
                  <span>Calendrier Marketing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Module en développement
                  </h3>
                  <p className="text-slate-500">
                    Le calendrier marketing sera bientôt disponible
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Base de Données
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-gray-500" />
                  <span>Gestion des Données</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Module en développement
                  </h3>
                  <p className="text-slate-500">
                    La gestion des données sera bientôt disponible
                  </p>
                  <Button className="mt-4">Connecter Supabase</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Paramètres
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <span>Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Module en développement
                  </h3>
                  <p className="text-slate-500">
                    Les paramètres de configuration seront bientôt disponibles
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Section non trouvée
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Cette section n'existe pas encore.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex h-screen">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
