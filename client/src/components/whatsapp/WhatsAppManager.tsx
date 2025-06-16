
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Send, Bot, Users, BarChart3 } from 'lucide-react';
import { WhatsAppConversations } from './WhatsAppConversations';
import { WhatsAppAnalytics } from './WhatsAppAnalytics';
import { WhatsAppAutoResponse } from './WhatsAppAutoResponse';
import { WhatsAppContacts } from './WhatsAppContacts';

export const WhatsAppManager = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    // Vérifier la configuration WhatsApp depuis les paramètres
    checkWhatsAppConfig();
  }, []);

  const checkWhatsAppConfig = () => {
    // Simulation de la vérification de la configuration
    // En réalité, cela vérifierait les paramètres sauvegardés
    setIsConnected(true);
    setAiEnabled(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              WhatsApp Business
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Gérez vos conversations et automatisations WhatsApp
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-green-500" : ""}>
            {isConnected ? "✓ Connecté" : "Non connecté"}
          </Badge>
          <Badge variant={aiEnabled ? "default" : "outline"} className={aiEnabled ? "bg-blue-500" : ""}>
            {aiEnabled ? "🤖 IA Active" : "IA Inactive"}
          </Badge>
        </div>
      </div>

      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-orange-500" />
              <span>Configuration requise</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                Configurez WhatsApp Business
              </h3>
              <p className="text-slate-500 mb-4">
                Veuillez configurer vos clés API WhatsApp dans les paramètres pour commencer
              </p>
              <Button variant="outline">
                Aller aux paramètres
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="conversations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="conversations" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Conversations</span>
            </TabsTrigger>
            <TabsTrigger value="auto-response" className="flex items-center space-x-2">
              <Bot className="w-4 h-4" />
              <span>Réponses Auto</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Statistiques</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations">
            <WhatsAppConversations />
          </TabsContent>

          <TabsContent value="auto-response">
            <WhatsAppAutoResponse aiEnabled={aiEnabled} />
          </TabsContent>

          <TabsContent value="contacts">
            <WhatsAppContacts />
          </TabsContent>

          <TabsContent value="analytics">
            <WhatsAppAnalytics />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
