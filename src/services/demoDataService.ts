
import { PostizIntegration, PostizPost } from './postizService';

export class DemoDataService {
  static getDemoIntegrations(): PostizIntegration[] {
    return [
      {
        id: "demo-facebook-1",
        name: "Mon Entreprise",
        identifier: "facebook",
        picture: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
        disabled: false,
        profile: "mon_entreprise_officiel",
        customer: {
          id: "demo-customer-1",
          name: "Mon Client Principal"
        }
      },
      {
        id: "demo-instagram-1",
        name: "Mon Entreprise",
        identifier: "instagram",
        picture: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
        disabled: false,
        profile: "@mon_entreprise",
        customer: {
          id: "demo-customer-1",
          name: "Mon Client Principal"
        }
      },
      {
        id: "demo-twitter-1",
        name: "Mon Entreprise",
        identifier: "x",
        picture: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
        disabled: false,
        profile: "@MonEntreprise",
        customer: {
          id: "demo-customer-1",
          name: "Mon Client Principal"
        }
      },
      {
        id: "demo-linkedin-1",
        name: "Mon Entreprise",
        identifier: "linkedin",
        picture: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
        disabled: false,
        profile: "mon-entreprise-sarl",
        customer: {
          id: "demo-customer-1",
          name: "Mon Client Principal"
        }
      },
      {
        id: "demo-youtube-1",
        name: "Mon Entreprise",
        identifier: "youtube",
        picture: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg",
        disabled: false,
        profile: "Mon Entreprise Channel",
        customer: {
          id: "demo-customer-1",
          name: "Mon Client Principal"
        }
      },
      {
        id: "demo-tiktok-1",
        name: "Mon Entreprise",
        identifier: "tiktok",
        picture: "https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/tiktok/webapp/main/webapp-desktop/8152caf0c8e8bc67ae0d.png",
        disabled: true,
        profile: "@monentreprise",
        customer: {
          id: "demo-customer-1",
          name: "Mon Client Principal"
        }
      }
    ];
  }

  static getDemoPosts(): PostizPost[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return [
      {
        id: "demo-post-1",
        content: "🚀 Découvrez notre nouvelle fonctionnalité d'intelligence artificielle ! Elle vous permet de générer du contenu de qualité en quelques secondes. #IA #Innovation #TechFrançaise",
        publishDate: yesterday.toISOString(),
        releaseURL: "https://facebook.com/monentreprise/posts/123456789",
        state: "PUBLISHED",
        integration: {
          id: "demo-facebook-1",
          providerIdentifier: "facebook",
          name: "Mon Entreprise",
          picture: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
        }
      },
      {
        id: "demo-post-2",
        content: "✨ Nouveau post Instagram ! Notre équipe a travaillé dur pour vous offrir la meilleure expérience utilisateur possible. Merci pour votre confiance ! 📸 #TeamWork #Gratitude",
        publishDate: yesterday.toISOString(),
        releaseURL: "https://instagram.com/p/ABC123DEF/",
        state: "PUBLISHED",
        integration: {
          id: "demo-instagram-1",
          providerIdentifier: "instagram",
          name: "Mon Entreprise",
          picture: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
        }
      },
      {
        id: "demo-post-3",
        content: "🔥 Thread intéressant sur les dernières tendances du marketing digital. Restez connectés pour plus de conseils pratiques ! #MarketingDigital #Conseils #Stratégie",
        publishDate: now.toISOString(),
        state: "QUEUE",
        integration: {
          id: "demo-twitter-1",
          providerIdentifier: "x",
          name: "Mon Entreprise",
          picture: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png"
        }
      },
      {
        id: "demo-post-4",
        content: "📈 Article de blog : Comment optimiser votre présence sur les réseaux sociaux en 2024. Découvrez nos 10 conseils d'experts pour booster votre engagement !",
        publishDate: tomorrow.toISOString(),
        state: "QUEUE",
        integration: {
          id: "demo-linkedin-1",
          providerIdentifier: "linkedin",
          name: "Mon Entreprise",
          picture: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png"
        }
      },
      {
        id: "demo-post-5",
        content: "🎥 Nouvelle vidéo en préparation ! On vous dévoile les coulisses de notre startup et comment nous révolutionnons l'industrie. Préparez-vous ! #BehindTheScenes #Startup",
        publishDate: nextWeek.toISOString(),
        state: "QUEUE",
        integration: {
          id: "demo-youtube-1",
          providerIdentifier: "youtube",
          name: "Mon Entreprise",
          picture: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg"
        }
      },
      {
        id: "demo-post-6",
        content: "Brouillon en cours de rédaction sur les nouvelles fonctionnalités à venir...",
        publishDate: now.toISOString(),
        state: "DRAFT",
        integration: {
          id: "demo-facebook-1",
          providerIdentifier: "facebook",
          name: "Mon Entreprise",
          picture: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
        }
      },
      {
        id: "demo-post-7",
        content: "Post qui a échoué lors de la publication automatique. Erreur de connexion API.",
        publishDate: yesterday.toISOString(),
        state: "ERROR",
        integration: {
          id: "demo-tiktok-1",
          providerIdentifier: "tiktok",
          name: "Mon Entreprise",
          picture: "https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/tiktok/webapp/main/webapp-desktop/8152caf0c8e8bc67ae0d.png"
        }
      }
    ];
  }

  static async simulateAPICall<T>(data: T, delay: number = 1000): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  }

  static async createDemoPost(): Promise<{ postId: string; integration: string }[]> {
    await this.simulateAPICall(null, 800);
    return [
      {
        postId: `demo-post-${Date.now()}`,
        integration: "demo-facebook-1"
      }
    ];
  }

  static async deleteDemoPost(postId: string): Promise<{ id: string }> {
    await this.simulateAPICall(null, 500);
    return { id: postId };
  }

  static async uploadDemoFile(file: File): Promise<any> {
    await this.simulateAPICall(null, 1200);
    return {
      id: `demo-upload-${Date.now()}`,
      name: file.name,
      path: `https://demo.postiz.com/uploads/${file.name}`,
      organizationId: "demo-org-123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}
