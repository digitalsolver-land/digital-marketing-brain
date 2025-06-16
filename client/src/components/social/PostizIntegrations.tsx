
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { PostizIntegration } from '@/services/postizService';

interface PostizIntegrationsProps {
  integrations: PostizIntegration[];
}

export const PostizIntegrations = ({ integrations }: PostizIntegrationsProps) => {
  const getProviderColor = (identifier: string) => {
    const colors: { [key: string]: string } = {
      facebook: 'bg-blue-600',
      twitter: 'bg-sky-500',
      x: 'bg-black',
      instagram: 'bg-pink-500',
      linkedin: 'bg-blue-700',
      youtube: 'bg-red-600',
      tiktok: 'bg-black',
      pinterest: 'bg-red-500',
    };
    return colors[identifier] || 'bg-gray-500';
  };

  const getProviderName = (identifier: string) => {
    const names: { [key: string]: string } = {
      facebook: 'Facebook',
      twitter: 'Twitter',
      x: 'X (Twitter)',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      pinterest: 'Pinterest',
    };
    return names[identifier] || identifier.charAt(0).toUpperCase() + identifier.slice(1);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Réseaux sociaux connectés</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Gérez vos comptes de réseaux sociaux connectés à Postiz.
            Pour ajouter de nouveaux comptes, rendez-vous sur votre tableau de bord Postiz.
          </p>
          
          <div className="flex justify-center mb-6">
            <Button variant="outline" asChild>
              <a
                href="https://app.postiz.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ouvrir Postiz</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Aucun réseau social connecté
            </h3>
            <p className="text-gray-500 mb-4">
              Connectez vos comptes de réseaux sociaux dans Postiz pour commencer à publier
            </p>
            <Button asChild>
              <a
                href="https://app.postiz.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Connecter des comptes
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <img
                    src={integration.picture}
                    alt={integration.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{integration.name}</h3>
                      {integration.disabled ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getProviderColor(integration.identifier)}>
                        {getProviderName(integration.identifier)}
                      </Badge>
                      <Badge variant={integration.disabled ? "destructive" : "secondary"}>
                        {integration.disabled ? "Désactivé" : "Actif"}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>@{integration.profile}</div>
                      <div>Client: {integration.customer.name}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
