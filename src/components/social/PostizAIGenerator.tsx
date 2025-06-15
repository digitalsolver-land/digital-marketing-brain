
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Copy, RefreshCw, Plus, AlertCircle } from 'lucide-react';
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
  const [lastError, setLastError] = useState<string>('');
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
      console.log('AI service initialized successfully');
      setLastError('');
    } catch (error) {
      console.error('Error initializing AI service:', error);
      setLastError('Erreur d\'initialisation du service IA');
    }
  };

  const validateInput = (prompt: string): string | null => {
    if (!prompt.trim()) {
      return 'Le prompt ne peut pas être vide';
    }
    if (prompt.trim().length < 10) {
      return 'Le prompt doit contenir au moins 10 caractères';
    }
    if (prompt.trim().length > 2000) {
      return 'Le prompt ne peut pas dépasser 2000 caractères';
    }
    return null;
  };

  const handleGenerate = async (prompt?: string) => {
    const finalPrompt = prompt || customPrompt;
    
    const validationError = validateInput(finalPrompt);
    if (validationError) {
      toast({
        title: "Erreur de validation",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setLastError('');
    
    try {
      console.log('=== DÉBUT GÉNÉRATION ===');
      console.log('User ID:', user?.id);
      console.log('Prompt:', finalPrompt.substring(0, 100) + '...');
      console.log('Type:', selectedType);
      console.log('Keywords:', seoKeywords);
      
      const keywords = seoKeywords.split(',').map(k => k.trim()).filter(Boolean);
      const content = await aiService.generateContent(finalPrompt, selectedType, keywords);
      
      console.log('=== CONTENU GÉNÉRÉ ===');
      console.log('Longueur:', content.length);
      console.log('Début:', content.substring(0, 200) + '...');
      
      setGeneratedContent(content);
      
      toast({
        title: "Contenu généré",
        description: `Contenu de ${content.length} caractères généré avec succès`
      });
    } catch (error) {
      console.error('=== ERREUR GÉNÉRATION ===');
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      
      const errorMessage = error instanceof Error ? error.message : "Impossible de générer le contenu";
      setLastError(errorMessage);
      
      toast({
        title: "Erreur de génération",
        description: errorMessage,
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
          <Badge variant="default" className="bg-green-500">Configuré</Badge>
        </CardTitle>
        {lastError && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{lastError}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
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
                    disabled={loading}
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
            placeholder="Décrivez le contenu que vous souhaitez générer... (minimum 10 caractères)"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
          />
          <div className="text-xs text-gray-500">
            {customPrompt.length}/2000 caractères
          </div>
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
          disabled={loading || !customPrompt.trim() || customPrompt.trim().length < 10}
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
