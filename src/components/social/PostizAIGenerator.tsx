
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Copy, RefreshCw, Plus } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useAuth } from '@/contexts/AuthContext';

interface PostizAIGeneratorProps {
  onContentGenerated: (content: string, type: string) => void;
}

type ContentType = 'social' | 'blog' | 'ad' | 'email';

interface ContentTemplate {
  type: ContentType;
  name: string;
  description: string;
  prompts: string[];
}

const contentTemplates: ContentTemplate[] = [
  {
    type: 'social',
    name: 'Post Réseaux Sociaux',
    description: 'Post engageant pour Facebook, Twitter, LinkedIn',
    prompts: [
      'Créez un post viral sur [sujet] avec des hashtags pertinents',
      'Post motivationnel pour entrepreneurs sur [thème]',
      'Annonce de nouveau produit/service avec call-to-action'
    ]
  },
  {
    type: 'blog',
    name: 'Article de Blog',
    description: 'Article informatif et optimisé SEO',
    prompts: [
      'Guide complet sur [sujet] avec conseils pratiques',
      'Article de tendances sur [industrie] en 2024',
      'Étude de cas : Comment [entreprise] a résolu [problème]'
    ]
  },
  {
    type: 'ad',
    name: 'Publicité',
    description: 'Texte publicitaire persuasif',
    prompts: [
      'Pub Facebook pour promouvoir [produit/service]',
      'Annonce Google Ads avec fort taux de conversion',
      'Publicité Instagram Story avec urgence'
    ]
  },
  {
    type: 'email',
    name: 'Email Marketing',
    description: 'Email de campagne marketing',
    prompts: [
      'Email de bienvenue pour nouveaux abonnés',
      'Newsletter mensuelle avec contenu de valeur',
      'Email de reconquête pour clients inactifs'
    ]
  }
];

export const PostizAIGenerator = ({ onContentGenerated }: PostizAIGeneratorProps) => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<ContentType>('social');
  const [customPrompt, setCustomPrompt] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAIConfigured, setIsAIConfigured] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      initializeAI();
    }
  }, [user]);

  const initializeAI = async () => {
    if (!user) return;
    
    try {
      console.log('Initializing AI service for user:', user.id);
      await aiService.initialize(user.id);
      setIsAIConfigured(true);
      console.log('AI service initialized successfully');
    } catch (error) {
      console.error('Error initializing AI service:', error);
      setIsAIConfigured(false);
    }
  };

  const handleGenerate = async (prompt?: string) => {
    const finalPrompt = prompt || customPrompt;
    if (!finalPrompt.trim()) {
      toast({
        title: "Prompt requis",
        description: "Veuillez entrer un prompt ou sélectionner un modèle",
        variant: "destructive"
      });
      return;
    }

    if (!isAIConfigured) {
      toast({
        title: "IA non configurée",
        description: "Veuillez configurer votre clé API OpenRouter dans les paramètres",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Generating content with prompt:', finalPrompt);
      const keywords = seoKeywords.split(',').map(k => k.trim()).filter(Boolean);
      const content = await aiService.generateContent(finalPrompt, selectedType, keywords);
      console.log('Content generated successfully:', content.substring(0, 100) + '...');
      setGeneratedContent(content);
      
      toast({
        title: "Contenu généré",
        description: "Le contenu a été généré avec succès"
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de générer le contenu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copié",
      description: "Contenu copié dans le presse-papiers"
    });
  };

  const handleUseContent = () => {
    onContentGenerated(generatedContent, selectedType);
    toast({
      title: "Contenu utilisé",
      description: "Le contenu a été ajouté à votre publication"
    });
  };

  const currentTemplate = contentTemplates.find(t => t.type === selectedType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span>Générateur de Contenu IA</span>
          {!isAIConfigured && (
            <Badge variant="destructive">Non configuré</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAIConfigured && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-orange-800">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Configuration requise</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Configurez votre clé API OpenRouter dans les paramètres pour utiliser l'IA.
            </p>
          </div>
        )}

        {/* Type de contenu */}
        <div className="space-y-2">
          <Label>Type de contenu</Label>
          <Select value={selectedType} onValueChange={(value: ContentType) => setSelectedType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contentTemplates.map((template) => (
                <SelectItem key={template.type} value={template.type}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentTemplate && (
            <p className="text-sm text-gray-600">{currentTemplate.description}</p>
          )}
        </div>

        {/* Modèles de prompts */}
        {currentTemplate && (
          <div className="space-y-2">
            <Label>Modèles de prompts</Label>
            <div className="grid gap-2">
              {currentTemplate.prompts.map((prompt, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Badge variant="outline" className="flex-1 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => setCustomPrompt(prompt)}>
                    {prompt}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleGenerate(prompt)}
                    disabled={loading || !isAIConfigured}
                  >
                    <Sparkles className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompt personnalisé */}
        <div className="space-y-2">
          <Label htmlFor="custom-prompt">Prompt personnalisé</Label>
          <Textarea
            id="custom-prompt"
            placeholder="Décrivez le contenu que vous souhaitez générer..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
          />
        </div>

        {/* Mots-clés SEO */}
        <div className="space-y-2">
          <Label htmlFor="seo-keywords">Mots-clés SEO (optionnel)</Label>
          <Input
            id="seo-keywords"
            placeholder="marketing digital, réseaux sociaux, stratégie"
            value={seoKeywords}
            onChange={(e) => setSeoKeywords(e.target.value)}
          />
          <p className="text-xs text-gray-500">Séparez les mots-clés par des virgules</p>
        </div>

        {/* Bouton de génération */}
        <Button 
          onClick={() => handleGenerate()}
          disabled={loading || !customPrompt.trim() || !isAIConfigured}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer le contenu
            </>
          )}
        </Button>

        {/* Contenu généré */}
        {generatedContent && (
          <div className="space-y-3 border-t pt-4">
            <Label>Contenu généré</Label>
            <div className="relative">
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={8}
                className="pr-20"
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                <Button size="sm" variant="ghost" onClick={handleCopyContent}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleGenerate()}>
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleUseContent} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Utiliser ce contenu
              </Button>
              <Button variant="outline" onClick={() => setGeneratedContent('')}>
                Effacer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
