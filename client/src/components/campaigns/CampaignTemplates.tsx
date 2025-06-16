
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Target, 
  Mail, 
  MessageSquare, 
  Globe, 
  Users,
  TrendingUp,
  Calendar,
  Star,
  Play,
  Eye
} from 'lucide-react';

interface CampaignTemplatesProps {
  onUseTemplate: (template: any) => void;
}

export const CampaignTemplates: React.FC<CampaignTemplatesProps> = ({ onUseTemplate }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templates = [
    {
      id: 1,
      name: "Black Friday Sale",
      category: "ecommerce",
      type: "Email + Social",
      description: "Campagne complète pour les soldes Black Friday avec emails automatisés et posts sociaux",
      platforms: ["Email", "Facebook", "Instagram", "Google Ads"],
      estimatedBudget: "2000-5000€",
      duration: "7 jours",
      expectedROI: "250-400%",
      icon: Target,
      color: "text-red-500",
      rating: 4.8,
      uses: 1247,
      features: ["Emails automatisés", "Countdown timer", "Ciblage avancé", "A/B testing"]
    },
    {
      id: 2,
      name: "Lead Generation B2B",
      category: "b2b",
      type: "LinkedIn + Email",
      description: "Génération de leads qualifiés pour les entreprises B2B avec nurturing automatisé",
      platforms: ["LinkedIn", "Email", "Google Ads"],
      estimatedBudget: "3000-8000€",
      duration: "30 jours",
      expectedROI: "180-300%",
      icon: Users,
      color: "text-blue-500",
      rating: 4.6,
      uses: 856,
      features: ["Scoring des leads", "CRM intégration", "Nurturing automatisé", "Reporting avancé"]
    },
    {
      id: 3,
      name: "Lancement Produit",
      category: "product",
      type: "Multi-canal",
      description: "Campagne de lancement produit avec teasing, annonce et suivi post-lancement",
      platforms: ["Facebook", "Instagram", "YouTube", "Email", "Google Ads"],
      estimatedBudget: "5000-15000€",
      duration: "21 jours",
      expectedROI: "200-350%",
      icon: TrendingUp,
      color: "text-green-500",
      rating: 4.9,
      uses: 623,
      features: ["Stratégie teasing", "Influenceurs", "Retargeting", "Analytics complets"]
    },
    {
      id: 4,
      name: "Retargeting E-commerce",
      category: "ecommerce",
      type: "Display + Social",
      description: "Récupération des paniers abandonnés et re-engagement des visiteurs",
      platforms: ["Facebook", "Google Display", "Instagram"],
      estimatedBudget: "1000-3000€",
      duration: "15 jours",
      expectedROI: "300-500%",
      icon: Target,
      color: "text-purple-500",
      rating: 4.7,
      uses: 1089,
      features: ["Audiences personnalisées", "Offres dynamiques", "Cross-selling", "Attribution"]
    },
    {
      id: 5,
      name: "Webinar Marketing",
      category: "education",
      type: "Email + Social",
      description: "Promotion et suivi d'un webinar avec inscriptions et engagement post-événement",
      platforms: ["Email", "LinkedIn", "Facebook"],
      estimatedBudget: "800-2500€",
      duration: "14 jours",
      expectedROI: "150-250%",
      icon: Calendar,
      color: "text-orange-500",
      rating: 4.5,
      uses: 445,
      features: ["Landing page", "Rappels automatiques", "Follow-up", "Enregistrement"]
    },
    {
      id: 6,
      name: "Acquisition Locale",
      category: "local",
      type: "Local SEO + Ads",
      description: "Acquisition de clients locaux avec ciblage géographique et Google My Business",
      platforms: ["Google Ads", "Google My Business", "Facebook Local"],
      estimatedBudget: "1500-4000€",
      duration: "30 jours",
      expectedROI: "200-400%",
      icon: Globe,
      color: "text-cyan-500",
      rating: 4.4,
      uses: 678,
      features: ["Ciblage géo", "Avis clients", "Promotions locales", "Tracking offline"]
    }
  ];

  const categories = [
    { id: 'all', label: 'Tous les modèles', count: templates.length },
    { id: 'ecommerce', label: 'E-commerce', count: templates.filter(t => t.category === 'ecommerce').length },
    { id: 'b2b', label: 'B2B', count: templates.filter(t => t.category === 'b2b').length },
    { id: 'product', label: 'Produit', count: templates.filter(t => t.category === 'product').length },
    { id: 'education', label: 'Formation', count: templates.filter(t => t.category === 'education').length },
    { id: 'local', label: 'Local', count: templates.filter(t => t.category === 'local').length }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: any) => {
    toast({
      title: "Modèle sélectionné",
      description: `Création d'une nouvelle campagne basée sur "${template.name}"`,
    });
    onUseTemplate(template);
  };

  const handlePreviewTemplate = (template: any) => {
    toast({
      title: "Aperçu du modèle",
      description: `Affichage de l'aperçu pour "${template.name}"`,
    });
    console.log('Aperçu du modèle:', template);
  };

  return (
    <div className="space-y-6">
      {/* Header et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un modèle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Catégories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center space-x-2"
          >
            <span>{category.label}</span>
            <Badge variant="secondary" className="ml-1">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Grid des modèles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800`}>
                      <Icon className={`w-6 h-6 ${template.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {template.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{template.rating}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {template.description}
                </p>

                {/* Plateformes */}
                <div className="flex flex-wrap gap-1">
                  {template.platforms.map((platform, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Budget estimé</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {template.estimatedBudget}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">ROI attendu</p>
                    <p className="font-medium text-green-600">
                      {template.expectedROI}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Durée</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {template.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Utilisations</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {template.uses}
                    </p>
                  </div>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Fonctionnalités incluses:
                  </p>
                  <div className="space-y-1">
                    {template.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {feature}
                        </span>
                      </div>
                    ))}
                    {template.features.length > 3 && (
                      <p className="text-xs text-slate-500">
                        +{template.features.length - 3} autres fonctionnalités
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Utiliser ce modèle
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePreviewTemplate(template)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              Aucun modèle trouvé
            </h3>
            <p className="text-slate-500">
              Essayez de modifier vos critères de recherche ou sélectionnez une autre catégorie
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
