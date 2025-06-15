
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Plus, Calendar, FileText, Users, AlertCircle, Sparkles, BarChart3, TestTube } from 'lucide-react';
import { postizService, PostizIntegration, PostizPost } from '@/services/postizService';
import { PostizCreatePost } from './PostizCreatePost';
import { PostizPostsList } from './PostizPostsList';
import { PostizIntegrations } from './PostizIntegrations';
import { PostizAIGenerator } from './PostizAIGenerator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const PostizDashboard = () => {
  const { user } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [integrations, setIntegrations] = useState<PostizIntegration[]>([]);
  const [posts, setPosts] = useState<PostizPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiGeneratedContent, setAIGeneratedContent] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      initializePostiz();
    }
  }, [user]);

  const initializePostiz = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await postizService.initialize(user.id);
      const demoStatus = postizService.getDemoStatus();
      setIsDemo(demoStatus);
      setIsConfigured(true);
      
      if (demoStatus) {
        toast({
          title: "Mode démonstration",
          description: "Vous utilisez des données de démonstration. Configurez Postiz dans les paramètres pour utiliser vos vrais comptes.",
        });
      }
      
      await loadData();
    } catch (error) {
      console.error('Error initializing Postiz:', error);
      setIsConfigured(false);
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
      if (!isDemo) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les données Postiz. Vérifiez votre configuration dans les paramètres.",
          variant: "destructive"
        });
        setIsConfigured(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAIContentGenerated = (content: string, type: string) => {
    setAIGeneratedContent(content);
    setActiveTab('create');
  };

  const getPostStats = () => {
    const published = posts.filter(p => p.state === 'PUBLISHED').length;
    const scheduled = posts.filter(p => p.state === 'QUEUE').length;
    const drafts = posts.filter(p => p.state === 'DRAFT').length;
    const errors = posts.filter(p => p.state === 'ERROR').length;
    
    return { published, scheduled, drafts, errors };
  };

  if (loading && !isConfigured) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Initialisation de Postiz...</p>
        </div>
      </div>
    );
  }

  const stats = getPostStats();

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
              {isDemo ? (
                <Badge className="bg-orange-500">
                  <TestTube className="w-3 h-3 mr-1" />
                  Mode Démonstration
                </Badge>
              ) : (
                <Badge className="bg-green-500">
                  ✓ Connecté à Postiz
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDemo && (
            <Alert className="mb-4">
              <TestTube className="h-4 w-4" />
              <AlertDescription>
                Vous utilisez actuellement des données de démonstration. Pour connecter votre vraie instance Postiz, 
                configurez votre clé API dans les paramètres → API & Intégrations.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{integrations.length}</div>
              <div className="text-sm text-gray-600">Réseaux connectés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.published}</div>
              <div className="text-sm text-gray-600">Publiés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.scheduled}</div>
              <div className="text-sm text-gray-600">Programmés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.drafts}</div>
              <div className="text-sm text-gray-600">Brouillons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              <div className="text-sm text-gray-600">Erreurs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai" className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>IA Générateur</span>
          </TabsTrigger>
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
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <PostizAIGenerator onContentGenerated={handleAIContentGenerated} />
        </TabsContent>

        <TabsContent value="create">
          <PostizCreatePost 
            integrations={integrations} 
            onPostCreated={loadData}
            initialContent={aiGeneratedContent}
            onContentUsed={() => setAIGeneratedContent('')}
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

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span>Analytics des Publications</span>
                {isDemo && <Badge variant="outline">Données de démonstration</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Répartition par statut</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Publications réussies</span>
                      <Badge className="bg-green-500">{stats.published}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Publications programmées</span>
                      <Badge className="bg-orange-500">{stats.scheduled}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Brouillons</span>
                      <Badge variant="secondary">{stats.drafts}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Erreurs</span>
                      <Badge variant="destructive">{stats.errors}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Répartition par réseau</h3>
                  <div className="space-y-2">
                    {integrations.map((integration) => {
                      const count = posts.filter(p => p.integration.id === integration.id).length;
                      return (
                        <div key={integration.id} className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <img src={integration.picture} alt={integration.name} className="w-4 h-4 rounded-full" />
                            <span className="text-sm">{integration.name}</span>
                            {integration.disabled && <Badge variant="outline" className="text-xs">Désactivé</Badge>}
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {posts.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Aucune donnée disponible
                  </h3>
                  <p className="text-gray-500">
                    Créez vos premières publications pour voir les analytics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
