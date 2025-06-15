
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Activity } from 'lucide-react';
import { N8nConfig } from './N8nConfig';
import { WorkflowList } from './WorkflowList';

export const N8nManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('workflows');
  const [connected, setConnected] = useState(false);

  const handleConfigurationChange = (isConnected: boolean) => {
    setConnected(isConnected);
    if (isConnected && activeTab === 'config') {
      setActiveTab('workflows');
    }
  };

  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Gestionnaire n8n</h2>
          <p className="text-slate-600">Configuration requise pour commencer</p>
        </div>
        <N8nConfig onConfigurationChange={handleConfigurationChange} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestionnaire n8n</h2>
        <p className="text-slate-600">Gérez vos workflows d'automatisation</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflows">
            <Activity className="w-4 h-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <WorkflowList />
        </TabsContent>

        <TabsContent value="config">
          <N8nConfig onConfigurationChange={handleConfigurationChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
