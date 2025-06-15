
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Zap,
  Settings,
  Users,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { SimpleN8nManager } from "@/components/workflows/SimpleN8nManager";

const Index = () => {
  const features = [
    {
      icon: Activity,
      title: "Workflows n8n",
      description: "Gérez vos automatisations n8n directement depuis l'interface",
      status: "Actif",
      link: "#workflows"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Business",
      description: "Automatisation des réponses et gestion des conversations",
      status: "Disponible",
      link: "/whatsapp"
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Tableaux de bord et métriques de performance",
      status: "Bêta",
      link: "/analytics"
    },
    {
      icon: FileText,
      title: "Génération de contenu IA",
      description: "Créez du contenu automatiquement avec l'IA",
      status: "Nouveau",
      link: "/content"
    }
  ];

  const stats = [
    { label: "Workflows actifs", value: "12", icon: Zap },
    { label: "Messages traités", value: "1,234", icon: MessageSquare },
    { label: "Automatisations", value: "8", icon: Activity },
    { label: "Taux de succès", value: "98%", icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Digital Marketing Brain
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Votre hub central d'automatisation marketing intelligent. 
            Gérez vos workflows n8n, automatisez WhatsApp, analysez vos performances et générez du contenu avec l'IA.
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fonctionnalités principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription className="mt-1">{feature.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={feature.status === "Actif" ? "default" : "secondary"}>
                    {feature.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={feature.link}>
                    Accéder au module
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Section Workflows n8n */}
        <div id="workflows" className="mb-12">
          <SimpleN8nManager />
        </div>

        {/* Actions rapides */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Actions rapides</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <Link to="/settings">
                <Settings className="w-5 h-5 mr-2" />
                Paramètres
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/profile">
                <Users className="w-5 h-5 mr-2" />
                Profil
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
