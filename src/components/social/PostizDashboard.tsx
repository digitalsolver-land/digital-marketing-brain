
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Plus, Calendar, FileText, Users, AlertCircle, Sparkles, BarChart3, TestTube, Clock, Zap } from 'lucide-react';
import { postizService, PostizIntegration, PostizPost, PostizAnalytics } from '@/services/postizService';
import { PostizCreatePost } from './PostizCreatePost';
import { PostizPostsList } from './PostizPostsList';
import { PostizIntegrations } from './PostizIntegrations';
import { PostizAIGenerator } from './PostizAIGenerator';
import { PostizLeads } from './PostizLeads';
import { PostizAutoPosting } from './PostizAutoPosting';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const PostizDashboard = () => {
  const { user } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [integrations, setIntegrations] = useState<PostizIntegration[]>([]);
  const [posts, setPosts] = useState<PostizPost[]>([]);
  const [analytics, setAnalytics] = useState<PostizAnalytics | null>(null);
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
      const [integrationsData, postsData, analyticsData] = await Promise.all([
        postizService.getIntegrations(),
        postizService.getPosts({
          display: 'month',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }),
        postizService.getAnalytics()
      ]);
      
      setIntegrations(integrationsData);
      setPosts(postsData.posts);
      setAnalytics(analyticsData);
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
      {/* En-tête avec statut et métriques globales */}
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
          
          {/* Métriques principales */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
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
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics?.totalViews.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Vues totales</div>
            </div>
          </div>

          {/* Métriques d'engagement */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-pink-600">
                  {analytics.totalLikes.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {analytics.totalShares.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Partages</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {analytics.totalComments.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Commentaires</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">
                  {analytics.engagement.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Engagement</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="ai" className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>IA</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Créer</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Publications</span>
          </TabsTrigger>
          <TabsTrigger value="auto" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Auto</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Leads</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
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

        <TabsContent value="auto">
          <PostizAutoPosting integrations={integrations} />
        </TabsContent>

        <TabsContent value="leads">
          <PostizLeads />
        </TabsContent>

        <TabsContent value="integrations">
          <PostizIntegrations integrations={integrations} />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span>Analytics détaillées</span>
                {isDemo && <Badge variant="outline">Données de démonstration</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="space-y-6">
                  {/* Post le plus performant */}
                  {analytics.topPerformingPost && (
                    <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                      <h3 className="font-semibold mb-2 text-blue-900">🏆 Post le plus performant</h3>
                      <div className="bg-white rounded p-3">
                        <p className="text-sm mb-2">{analytics.topPerformingPost.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span>👁️ {analytics.topPerformingPost.analytics?.views}</span>
                          <span>❤️ {analytics.topPerformingPost.analytics?.likes}</span>
                          <span>🔄 {analytics.topPerformingPost.analytics?.shares}</span>
                          <span>💬 {analytics.topPerformingPost.analytics?.comments}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Statistiques par réseau */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Performance par réseau social</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {analytics.integrationStats.map((stat) => (
                        <div key={stat.integrationId} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{stat.name}</span>
                            <Badge variant="outline">{stat.posts} posts</Badge>
                          </div>
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {stat.engagement.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-500">Taux d'engagement moyen</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Évolution des métriques */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Métriques globales</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {analytics.totalPosts}
                        </div>
                        <div className="text-sm text-gray-600">Total publications</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {analytics.totalViews.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Vues totales</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-pink-600 mb-2">
                          {analytics.totalLikes.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Likes totaux</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold text-orange-600 mb-2">
                          {analytics.engagement.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Engagement moyen</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
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
