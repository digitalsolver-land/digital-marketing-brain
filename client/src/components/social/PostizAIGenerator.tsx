
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Copy, RefreshCw, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  icon: string;
  prompts: string[];
}

const contentTemplates: ContentTemplate[] = [
  {
    type: 'social',
    name: 'Post Réseaux Sociaux',
    description: 'Post engageant pour Facebook, Twitter, LinkedIn',
    icon: '📱',
    prompts: [
      'Créez un post viral sur le marketing digital avec des hashtags pertinents',
      'Post motivationnel pour entrepreneurs sur la persévérance',
      'Annonce de nouveau produit/service avec call-to-action fort'
    ]
  },
  {
    type: 'blog',
    name: 'Article de Blog',
    description: 'Article informatif et optimisé SEO',
    icon: '📝',
    prompts: [
      'Guide complet sur les stratégies de marketing digital en 2024',
      'Article de tendances sur l\'intelligence artificielle dans le business',
      'Étude de cas : Comment une PME a doublé son chiffre d\'affaires'
    ]
  },
  {
    type: 'ad',
    name: 'Publicité',
    description: 'Texte publicitaire persuasif et efficace',
    icon: '🎯',
    prompts: [
      'Pub Facebook pour promouvoir un service de consulting digital',
      'Annonce Google Ads avec fort taux de conversion pour formation',
      'Publicité Instagram Story avec urgence pour offre limitée'
    ]
  },
  {
    type: 'email',
    name: 'Email Marketing',
    description: 'Email de campagne marketing personnalisé',
    icon: '📧',
    prompts: [
      'Email de bienvenue pour nouveaux abonnés d\'une newsletter tech',
      'Newsletter mensuelle avec contenu de valeur et actualités',
      'Email de reconquête pour clients inactifs avec offre spéciale'
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
  const [aiReady, setAiReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      initializeAI();
    }
  }, [user]);

  const initializeAI = async () => {
    if (!user) return;
    
    try {
      console.log('🚀 Initialisation du service IA...');
      await aiService.initialize(user.id);
      setAiReady(true);
      setLastError('');
      console.log('✅ Service IA initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation IA:', error);
      setLastError('Erreur d\'initialisation du service IA');
      setAiReady(false);
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

    if (!aiReady) {
      toast({
        title: "Service IA non prêt",
        description: "Veuillez patienter, initialisation en cours...",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setLastError('');
    
    try {
      console.log('🎯 === DÉBUT GÉNÉRATION ===');
      console.log('📊 Type:', selectedType);
      console.log('📝 Prompt:', finalPrompt.substring(0, 100) + '...');
      console.log('🔍 Mots-clés:', seoKeywords);
      
      const keywords = seoKeywords.split(',').map(k => k.trim()).filter(Boolean);
      const content = await aiService.generateContent(finalPrompt, selectedType, keywords);
      
      console.log('✨ === CONTENU GÉNÉRÉ ===');
      console.log('📏 Longueur:', content.length);
      console.log('📄 Aperçu:', content.substring(0, 200) + '...');
      
      setGeneratedContent(content);
      
      toast({
        title: "🎉 Contenu généré avec succès !",
        description: `${content.length} caractères générés avec IA Mistral`
      });
    } catch (error) {
      console.error('💥 === ERREUR GÉNÉRATION ===');
      console.error('Error:', error);
      
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
      title: "📋 Copié !",
      description: "Contenu copié dans le presse-papiers"
    });
  };

  const handleUseContent = () => {
    onContentGenerated(generatedContent, selectedType);
    toast({
      title: "✅ Contenu utilisé",
      description: "Le contenu a été ajouté à votre publication"
    });
  };

  const handleQuickPrompt = (template: ContentTemplate, promptIndex: number) => {
    const prompt = template.prompts[promptIndex];
    setSelectedType(template.type);
    setCustomPrompt(prompt);
    handleGenerate(prompt);
  };

  const currentTemplate = contentTemplates.find(t => t.type === selectedType);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span>Générateur de Contenu IA</span>
          </div>
          <div className="flex items-center space-x-2">
            {aiReady ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                IA Prête
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Initialisation...
              </Badge>
            )}
          </div>
        </CardTitle>
        {lastError && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{lastError}</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={initializeAI}
              className="ml-auto text-red-600"
            >
              Réessayer
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection rapide par type */}
        <div className="space-y-3">
          <Label>Type de contenu</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {contentTemplates.map((template) => (
              <Button
                key={template.type}
                variant={selectedType === template.type ? "default" : "outline"}
                className="h-auto p-3 flex flex-col items-center space-y-1"
                onClick={() => setSelectedType(template.type)}
              >
                <span className="text-lg">{template.icon}</span>
                <span className="text-xs font-medium">{template.name}</span>
              </Button>
            ))}
          </div>
          {currentTemplate && (
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {currentTemplate.description}
            </p>
          )}
        </div>

        {/* Prompts rapides */}
        {currentTemplate && (
          <div className="space-y-3">
            <Label>Prompts rapides {currentTemplate.icon}</Label>
            <div className="grid gap-2">
              {currentTemplate.prompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="text-left h-auto p-3 border border-dashed hover:border-solid hover:bg-blue-50"
                  onClick={() => handleQuickPrompt(currentTemplate, index)}
                  disabled={loading}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-sm text-gray-700 flex-1">{prompt}</span>
                    <Sparkles className="w-3 h-3 text-purple-500 ml-2 flex-shrink-0" />
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt personnalisé */}
        <div className="space-y-2">
          <Label htmlFor="custom-prompt">Prompt personnalisé</Label>
          <Textarea
            id="custom-prompt"
            placeholder="Décrivez précisément le contenu que vous souhaitez générer... (minimum 10 caractères)"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Minimum 10 caractères requis</span>
            <span className={customPrompt.length > 1500 ? 'text-orange-600' : ''}>
              {customPrompt.length}/2000
            </span>
          </div>
        </div>

        {/* Mots-clés SEO */}
        <div className="space-y-2">
          <Label htmlFor="seo-keywords">Mots-clés SEO (optionnel)</Label>
          <Input
            id="seo-keywords"
            placeholder="marketing digital, réseaux sociaux, stratégie, IA"
            value={seoKeywords}
            onChange={(e) => setSeoKeywords(e.target.value)}
          />
          <p className="text-xs text-gray-500">💡 Séparez les mots-clés par des virgules pour un meilleur référencement</p>
        </div>

        {/* Bouton de génération */}
        <Button 
          onClick={() => handleGenerate()}
          disabled={loading || !customPrompt.trim() || customPrompt.trim().length < 10 || !aiReady}
          className="w-full h-12 text-base"
          size="lg"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Génération avec Mistral IA...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Générer le contenu avec IA
            </>
          )}
        </Button>

        {/* Contenu généré */}
        {generatedContent && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Contenu généré ✨</Label>
              <div className="flex items-center space-x-1">
                <Button size="sm" variant="ghost" onClick={handleCopyContent}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copier
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleGenerate()}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Régénérer
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                rows={12}
                className="resize-none font-mono text-sm"
                placeholder="Le contenu généré apparaîtra ici..."
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                {generatedContent.length} caractères
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={handleUseContent} className="flex-1" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Utiliser ce contenu
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGeneratedContent('')}
                size="lg"
              >
                Effacer
              </Button>
            </div>
          </div>
        )}

        {/* Conseils d'utilisation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Conseils pour de meilleurs résultats</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Soyez spécifique dans votre demande</li>
            <li>• Mentionnez votre public cible</li>
            <li>• Incluez le ton souhaité (professionnel, décontracté, etc.)</li>
            <li>• Ajoutez des mots-clés pour le SEO</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
