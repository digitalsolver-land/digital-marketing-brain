
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Plus, Calendar, FileText, Users, AlertCircle } from 'lucide-react';
import { postizService, PostizIntegration, PostizPost } from '@/services/postizService';
import { PostizCreatePost } from './PostizCreatePost';
import { PostizPostsList } from './PostizPostsList';
import { PostizIntegrations } from './PostizIntegrations';
import { useToast } from '@/hooks/use-toast';

export const PostizDashboard = () => {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [integrations, setIntegrations] = useState<PostizIntegration[]>([]);
  const [posts, setPosts] = useState<PostizPost[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedApiKey = localStorage.getItem('postiz_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      postizService.setApiKey(savedApiKey);
      setIsConfigured(true);
      loadData();
    }
  }, []);

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une clé API valide",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      postizService.setApiKey(apiKey);
      await postizService.getIntegrations(); // Test de la clé
      
      localStorage.setItem('postiz_api_key', apiKey);
      setIsConfigured(true);
      
      toast({
        title: "Succès",
        description: "Connexion à Postiz établie avec succès"
      });
      
      await loadData();
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Vérifiez votre clé API Postiz",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [integrationsData, postsData] = await Promise.all([
        postizService.getIntegrations(),
        postizService.getPosts({
          display: 'month',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        })
      ]);
      
      setIntegrations(integrationsData);
      setPosts(postsData.posts);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données Postiz",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('postiz_api_key');
    setApiKey('');
    setIsConfigured(false);
    setIntegrations([]);
    setPosts([]);
    
    toast({
      title: "Déconnecté",
      description: "Vous avez été déconnecté de Postiz"
    });
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <span>Configuration Postiz</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pour utiliser Postiz, vous devez d'abord configurer votre clé API. 
                Rendez-vous dans les paramètres de votre compte Postiz pour obtenir votre clé API.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="api-key">Clé API Postiz</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Entrez votre clé API Postiz"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            
            <Button onClick={handleApiKeySubmit} disabled={loading}>
              {loading ? 'Connexion...' : 'Connecter à Postiz'}
            </Button>
            
            <div className="text-sm text-gray-600">
              <p><strong>URL de l'API:</strong> https://api.postiz.com/public/v1</p>
              <p><strong>Limite:</strong> 30 requêtes par heure</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>Gestionnaire Postiz</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-500">
                ✓ Connecté à Postiz
              </Badge>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Déconnecter
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{integrations.length}</div>
              <div className="text-sm text-gray-600">Réseaux connectés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{posts.filter(p => p.state === 'PUBLISHED').length}</div>
              <div className="text-sm text-gray-600">Posts publiés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{posts.filter(p => p.state === 'QUEUE').length}</div>
              <div className="text-sm text-gray-600">Posts programmés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets principaux */}
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Créer</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Publications</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Réseaux</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <PostizCreatePost 
            integrations={integrations} 
            onPostCreated={loadData}
          />
        </TabsContent>

        <TabsContent value="posts">
          <PostizPostsList 
            posts={posts} 
            onPostDeleted={loadData}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="integrations">
          <PostizIntegrations integrations={integrations} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
