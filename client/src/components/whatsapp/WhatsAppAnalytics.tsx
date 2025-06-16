
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, MessageCircle, Clock, TrendingUp, Users, Zap } from 'lucide-react';

export const WhatsAppAnalytics = () => {
  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-sm text-gray-600">Messages envoyés</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% ce mois
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">2.3 min</p>
                <p className="text-sm text-gray-600">Temps de réponse moyen</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  -30% ce mois
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-sm text-gray-600">Taux de réponse automatique</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5% ce mois
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Messages par jour</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Graphique en développement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Conversations actives</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Graphique en développement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rapport détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Rapport d'activité détaillé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Performance des réponses automatiques</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Salutations</span>
                    <span className="text-sm font-medium">156 déclenchements</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Informations prix</span>
                    <span className="text-sm font-medium">89 déclenchements</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Support technique</span>
                    <span className="text-sm font-medium">45 déclenchements</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Heures d'activité</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">9h - 12h</span>
                    <span className="text-sm font-medium">35% des messages</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">14h - 18h</span>
                    <span className="text-sm font-medium">45% des messages</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">18h - 22h</span>
                    <span className="text-sm font-medium">20% des messages</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
