import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { EnhancedWorkflowManager } from '@/components/workflows/EnhancedWorkflowManager';
import { AIChat } from '@/components/ai/AIChat';
import { ContentGenerator } from '@/components/content/ContentGenerator';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { WhatsAppManager } from '@/components/whatsapp/WhatsAppManager';
import { PostizDashboard } from '@/components/social/PostizDashboard';
import { CampaignManager } from '@/components/campaigns/CampaignManager';
import { CompetitorAnalysis } from '@/components/competitors/CompetitorAnalysis';
import { MarketingCalendar } from '@/components/calendar/MarketingCalendar';
import { DatabaseManager } from '@/components/database/DatabaseManager';
import { AdvancedSettings } from '@/components/settings/AdvancedSettings';
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
        return <EnhancedWorkflowManager />;

      case 'ai-chat':
        return <AIChat />;

      case 'content':
        return <ContentGenerator />;

      case 'analytics':
        return <AnalyticsDashboard />;

      case 'whatsapp':
        return <WhatsAppManager />;

      case 'campaigns':
        return <CampaignManager />;

      case 'social':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Automatisation Sociale
            </h2>
            <PostizDashboard />
          </div>
        );

      case 'competitors':
        return <CompetitorAnalysis />;

      case 'calendar':
        return <MarketingCalendar />;

      case 'data':
        return <DatabaseManager />;

      case 'settings':
        return <AdvancedSettings />;

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
