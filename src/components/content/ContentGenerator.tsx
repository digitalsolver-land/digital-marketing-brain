
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Share2, Mail, Target, Wand2, Copy, Download, Save } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';

export const ContentGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'blog' | 'social' | 'email' | 'ad'>('blog');
  const [keywords, setKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const contentTypes = [
    { value: 'blog', label: 'Article de Blog', icon: FileText, description: 'Articles optimisés SEO' },
    { value: 'social', label: 'Post Social', icon: Share2, description: 'Contenu viral pour réseaux' },
    { value: 'email', label: 'Email Marketing', icon: Mail, description: 'Emails persuasifs' },
    { value: 'ad', label: 'Publicité', icon: Target, description: 'Ads impactantes' }
  ];

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un prompt",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
      const content = await aiService.generateContent(prompt, contentType, keywordList);
      setGeneratedContent(content);

      // Analyse SEO automatique pour le contenu généré
      if (keywordList.length > 0) {
        const analysis = await aiService.analyzeSEO(content, keywordList);
        setSeoAnalysis(analysis);
      }

      toast({
        title: "Contenu généré",
        description: "Votre contenu est prêt !"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le contenu",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copié",
      description: "Contenu copié dans le presse-papiers"
    });
  };

  const downloadContent = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${contentType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const templates = {
    blog: [
      "Guide complet sur [sujet] en 2024",
      "10 astuces pour améliorer [domaine]",
      "Comment [action] en [temps] étapes simples"
    ],
    social: [
      "Post inspirant sur [thème] avec emoji",
      "Carrousel éducatif sur [sujet]",
      "Story interactive sur [tendance]"
    ],
    email: [
      "Newsletter hebdomadaire avec actualités [secteur]",
      "Email de bienvenue pour nouveaux abonnés",
      "Campagne de réactivation clients inactifs"
    ],
    ad: [
      "Publicité Facebook pour [produit/service]",
      "Annonce Google Ads pour [mot-clé principal]",
      "Copy Instagram pour promotion [offre]"
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Générateur de Contenu IA
        </h2>
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          Optimisé SEO
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              <span>Paramètres de Génération</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type de contenu */}
            <div>
              <label className="block text-sm font-medium mb-2">Type de contenu</label>
              <div className="grid grid-cols-2 gap-2">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant={contentType === type.value ? "default" : "outline"}
                      onClick={() => setContentType(type.value as any)}
                      className="h-auto p-3 flex flex-col items-center space-y-1"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">Prompt / Sujet</label>
              <Textarea
                placeholder="Décrivez le contenu que vous souhaitez générer..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
            </div>

            {/* Mots-clés SEO */}
            <div>
              <label className="block text-sm font-medium mb-2">Mots-clés SEO (séparés par des virgules)</label>
              <Input
                placeholder="marketing digital, SEO, automation"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            {/* Templates suggestions */}
            <div>
              <label className="block text-sm font-medium mb-2">Templates suggérés</label>
              <div className="space-y-1">
                {templates[contentType].map((template, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => setPrompt(template)}
                    className="w-full justify-start text-left h-auto p-2"
                  >
                    <span className="text-xs text-slate-600 dark:text-slate-400">{template}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={generateContent} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Génération en cours...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Générer le Contenu
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Résultat */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contenu Généré</CardTitle>
              {generatedContent && (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={copyContent}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadContent}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Contenu</TabsTrigger>
                  <TabsTrigger value="seo">Analyse SEO</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="mt-4">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="seo" className="mt-4">
                  {seoAnalysis ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <div className="text-sm font-medium text-green-800 dark:text-green-200">
                            Score SEO
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {seoAnalysis.score || 85}/100
                          </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Densité mots-clés
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {seoAnalysis.keywordDensity || 2.3}%
                          </div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                          <div className="text-sm font-medium text-purple-800 dark:text-purple-200">
                            Lisibilité
                          </div>
                          <div className="text-2xl font-bold text-purple-600">
                            {seoAnalysis.readability || 'Bonne'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Recommandations :</h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Titre optimisé pour le SEO</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>Ajouter plus de sous-titres H2/H3</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Bon usage des mots-clés</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-8">
                      <p>Ajoutez des mots-clés pour obtenir une analyse SEO</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center text-slate-500 py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Votre contenu apparaîtra ici après génération</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
