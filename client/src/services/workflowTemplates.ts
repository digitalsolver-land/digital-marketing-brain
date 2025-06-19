import { workflowService } from './workflowService';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  workflow: any;
  preview?: string;
  author?: string;
  version?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: WorkflowTemplate[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'social-media-scheduler',
    name: 'Programmateur de contenu social',
    description: 'Automatise la publication de contenu sur plusieurs plateformes sociales',
    category: 'social-media',
    tags: ['réseaux sociaux', 'programmation', 'contenu'],
    complexity: 'intermediate',
    estimatedTime: '30 minutes',
    workflow: {
      name: 'Programmateur Social Media',
      nodes: [
        {
          id: 'trigger',
          name: 'Déclencheur Cron',
          type: 'n8n-nodes-base.cron',
          position: [300, 300],
          parameters: {
            rule: {
              interval: [{
                field: 'cronExpression',
                expression: '0 9 * * 1-5'
              }]
            }
          }
        },
        {
          id: 'get-content',
          name: 'Récupérer contenu',
          type: 'n8n-nodes-base.httpRequest',
          position: [500, 300],
          parameters: {
            url: 'https://api.example.com/content',
            method: 'GET'
          }
        },
        {
          id: 'format-content',
          name: 'Formatter pour chaque plateforme',
          type: 'n8n-nodes-base.function',
          position: [700, 300],
          parameters: {
            functionCode: `
              const content = items[0].json;
              return [
                { platform: 'twitter', text: content.text.substring(0, 280) },
                { platform: 'linkedin', text: content.text + ' #professionnel' },
                { platform: 'facebook', text: content.text + '\\n\\n' + content.hashtags }
              ];
            `
          }
        },
        {
          id: 'post-twitter',
          name: 'Publier sur Twitter',
          type: 'n8n-nodes-base.twitter',
          position: [900, 200],
          parameters: {
            operation: 'tweet',
            text: '={{$json.text}}'
          }
        },
        {
          id: 'post-linkedin',
          name: 'Publier sur LinkedIn',
          type: 'n8n-nodes-base.linkedIn',
          position: [900, 300],
          parameters: {
            operation: 'post',
            text: '={{$json.text}}'
          }
        },
        {
          id: 'post-facebook',
          name: 'Publier sur Facebook',
          type: 'n8n-nodes-base.facebook',
          position: [900, 400],
          parameters: {
            operation: 'post',
            message: '={{$json.text}}'
          }
        }
      ],
      connections: {
        'trigger': {
          main: [
            [{ node: 'get-content', type: 'main', index: 0 }]
          ]
        },
        'get-content': {
          main: [
            [{ node: 'format-content', type: 'main', index: 0 }]
          ]
        },
        'format-content': {
          main: [
            [
              { node: 'post-twitter', type: 'main', index: 0 },
              { node: 'post-linkedin', type: 'main', index: 0 },
              { node: 'post-facebook', type: 'main', index: 0 }
            ]
          ]
        }
      }
    },
    author: 'Équipe n8n',
    version: '1.0'
  },

  {
    id: 'email-marketing-automation',
    name: 'Automation email marketing',
    description: 'Workflow complet pour gérer les campagnes email automatisées',
    category: 'marketing',
    tags: ['email', 'marketing', 'automation', 'crm'],
    complexity: 'advanced',
    estimatedTime: '45 minutes',
    workflow: {
      name: 'Email Marketing Automation',
      nodes: [
        {
          id: 'webhook-signup',
          name: 'Nouveau contact',
          type: 'n8n-nodes-base.webhook',
          position: [200, 300],
          parameters: {
            path: 'new-contact',
            httpMethod: 'POST'
          }
        },
        {
          id: 'validate-email',
          name: 'Valider email',
          type: 'n8n-nodes-base.function',
          position: [400, 300],
          parameters: {
            functionCode: `
              const email = items[0].json.email;
              const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
              if (!emailRegex.test(email)) {
                throw new Error('Email invalide');
              }
              return items;
            `
          }
        },
        {
          id: 'add-to-crm',
          name: 'Ajouter au CRM',
          type: 'n8n-nodes-base.httpRequest',
          position: [600, 300],
          parameters: {
            url: 'https://api.crm.com/contacts',
            method: 'POST',
            body: {
              email: '={{$json.email}}',
              name: '={{$json.name}}',
              source: 'website'
            }
          }
        },
        {
          id: 'welcome-email',
          name: 'Email de bienvenue',
          type: 'n8n-nodes-base.emailSend',
          position: [800, 200],
          parameters: {
            to: '={{$json.email}}',
            subject: 'Bienvenue !',
            text: 'Merci de vous être inscrit à notre newsletter.'
          }
        },
        {
          id: 'wait-3-days',
          name: 'Attendre 3 jours',
          type: 'n8n-nodes-base.wait',
          position: [800, 400],
          parameters: {
            amount: 3,
            unit: 'days'
          }
        },
        {
          id: 'follow-up-email',
          name: 'Email de suivi',
          type: 'n8n-nodes-base.emailSend',
          position: [1000, 400],
          parameters: {
            to: '={{$json.email}}',
            subject: 'Découvrez nos services',
            text: 'Voici comment nous pouvons vous aider...'
          }
        }
      ],
      connections: {
        'webhook-signup': {
          main: [
            [{ node: 'validate-email', type: 'main', index: 0 }]
          ]
        },
        'validate-email': {
          main: [
            [{ node: 'add-to-crm', type: 'main', index: 0 }]
          ]
        },
        'add-to-crm': {
          main: [
            [
              { node: 'welcome-email', type: 'main', index: 0 },
              { node: 'wait-3-days', type: 'main', index: 0 }
            ]
          ]
        },
        'wait-3-days': {
          main: [
            [{ node: 'follow-up-email', type: 'main', index: 0 }]
          ]
        }
      }
    },
    author: 'Équipe Marketing',
    version: '2.1'
  },

  {
    name: "Email Marketing Simple",
    description: "Template pour l'envoi d'emails marketing automatisés",
    category: "Marketing",
    workflow: {
      name: "Email Marketing Simple",
      nodes: [
        {
          id: "start",
          name: "Déclencheur",
          type: "n8n-nodes-base.manualTrigger",
          position: [240, 300],
          parameters: {}
        },
        {
          id: "get-contacts",
          name: "Récupérer Contacts",
          type: "n8n-nodes-base.spreadsheetFile",
          position: [460, 300],
          parameters: {
            "operation": "read",
            "fileFormat": "csv"
          }
        },
        {
          id: "send-email",
          name: "Envoyer Email",
          type: "n8n-nodes-base.emailSend",
          position: [680, 300],
          parameters: {
            "subject": "Newsletter {{$json.name}}",
            "text": "Bonjour {{$json.name}},\n\nVoici notre dernière newsletter..."
          }
        }
      ],
      connections: {
        "start": {
          "main": [
            [
              {
                "node": "get-contacts",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "get-contacts": {
          "main": [
            [
              {
                "node": "send-email",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      active: false,
      settings: {},
      tags: [{ id: "marketing", name: "Marketing" }]
    }
  },
  {
    name: "Monitoring Site Web",
    description: "Surveillance automatique de la disponibilité d'un site web",
    category: "Monitoring",
    workflow: {
      name: "Monitoring Site Web",
      nodes: [
        {
          id: "cron",
          name: "Déclencheur Programmé",
          type: "n8n-nodes-base.cron",
          position: [240, 300],
          parameters: {
            "rule": {
              "interval": [
                {
                  "field": "cronExpression",
                  "expression": "*/5 * * * *"
                }
              ]
            }
          }
        },
        {
          id: "http-request",
          name: "Vérifier Site",
          type: "n8n-nodes-base.httpRequest",
          position: [460, 300],
          parameters: {
            "url": "https://example.com",
            "method": "GET",
            "options": {
              "timeout": 10000
            }
          }
        },
        {
          id: "if",
          name: "Site Disponible?",
          type: "n8n-nodes-base.if",
          position: [680, 300],
          parameters: {
            "conditions": {
              "number": [
                {
                  "value1": "={{$node['Vérifier Site'].json.statusCode}}",
                  "operation": "equal",
                  "value2": 200
                }
              ]
            }
          }
        },
        {
          id: "alert",
          name: "Envoyer Alerte",
          type: "n8n-nodes-base.emailSend",
          position: [900, 400],
          parameters: {
            "subject": "🚨 Site Web Indisponible",
            "text": "Le site web est actuellement indisponible. Statut: {{$node['Vérifier Site'].json.statusCode}}"
          }
        }
      ],
      connections: {
        "cron": {
          "main": [
            [
              {
                "node": "http-request",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "http-request": {
          "main": [
            [
              {
                "node": "if",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "if": {
          "main": [
            [],
            [
              {
                "node": "alert",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      active: false,
      settings: {},
      tags: [{ id: "monitoring", name: "Monitoring" }]
    }
  },
  {
    name: "Sauvegarde Base de Données",
    description: "Sauvegarde automatique quotidienne de base de données",
    category: "Administration",
    workflow: {
      name: "Sauvegarde Base de Données",
      nodes: [
        {
          id: "schedule",
          name: "Planification Quotidienne",
          type: "n8n-nodes-base.cron",
          position: [240, 300],
          parameters: {
            "rule": {
              "interval": [
                {
                  "field": "cronExpression",
                  "expression": "0 2 * * *"
                }
              ]
            }
          }
        },
        {
          id: "backup-db",
          name: "Créer Sauvegarde",
          type: "n8n-nodes-base.executeCommand",
          position: [460, 300],
          parameters: {
            "command": "pg_dump -U username database_name > backup_$(date +%Y%m%d).sql"
          }
        },
        {
          id: "upload-storage",
          name: "Upload vers Cloud",
          type: "n8n-nodes-base.aws",
          position: [680, 300],
          parameters: {
            "service": "s3",
            "operation": "upload"
          }
        },
        {
          id: "notification",
          name: "Notification Succès",
          type: "n8n-nodes-base.slack",
          position: [900, 300],
          parameters: {
            "channel": "#admin",
            "text": "✅ Sauvegarde de base de données terminée avec succès"
          }
        }
      ],
      connections: {
        "schedule": {
          "main": [
            [
              {
                "node": "backup-db",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "backup-db": {
          "main": [
            [
              {
                "node": "upload-storage",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "upload-storage": {
          "main": [
            [
              {
                "node": "notification",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      active: false,
      settings: {},
      tags: [{ id: "admin", name: "Administration" }]
    }
  },
  {
    name: "Génération de Rapports",
    description: "Génération automatique de rapports hebdomadaires",
    category: "Reporting",
    workflow: {
      name: "Génération de Rapports",
      nodes: [
        {
          id: "weekly-trigger",
          name: "Déclencheur Hebdomadaire",
          type: "n8n-nodes-base.cron",
          position: [240, 300],
          parameters: {
            "rule": {
              "interval": [
                {
                  "field": "cronExpression",
                  "expression": "0 9 * * 1"
                }
              ]
            }
          }
        },
        {
          id: "fetch-data",
          name: "Récupérer Données",
          type: "n8n-nodes-base.postgres",
          position: [460, 300],
          parameters: {
            "query": "SELECT * FROM analytics WHERE date >= current_date - interval '7 days'"
          }
        },
        {
          id: "process-data",
          name: "Traiter Données",
          type: "n8n-nodes-base.function",
          position: [680, 300],
          parameters: {
            "functionCode": "// Calcul des métriques\nconst totalVisits = items.reduce((sum, item) => sum + item.json.visits, 0);\nconst avgConversion = items.reduce((sum, item) => sum + item.json.conversion_rate, 0) / items.length;\n\nreturn [{\n  json: {\n    period: 'Semaine dernière',\n    total_visits: totalVisits,\n    avg_conversion: avgConversion.toFixed(2),\n    report_date: new Date().toISOString().split('T')[0]\n  }\n}];"
          }
        },
        {
          id: "generate-report",
          name: "Générer Rapport PDF",
          type: "n8n-nodes-base.htmlToPdf",
          position: [900, 300],
          parameters: {
            "html": "<h1>Rapport Hebdomadaire</h1><p>Visites: {{$json.total_visits}}</p><p>Taux conversion: {{$json.avg_conversion}}%</p>"
          }
        },
        {
          id: "send-report",
          name: "Envoyer par Email",
          type: "n8n-nodes-base.emailSend",
          position: [1120, 300],
          parameters: {
            "subject": "Rapport Hebdomadaire - {{$json.report_date}}",
            "text": "Veuillez trouver ci-joint le rapport hebdomadaire.",
            "attachments": "data:application/pdf;base64,{{$node['Générer Rapport PDF'].json.data}}"
          }
        }
      ],
      connections: {
        "weekly-trigger": {
          "main": [
            [
              {
                "node": "fetch-data",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "fetch-data": {
          "main": [
            [
              {
                "node": "process-data",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "process-data": {
          "main": [
            [
              {
                "node": "generate-report",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "generate-report": {
          "main": [
            [
              {
                "node": "send-report",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      active: false,
      settings: {},
      tags: [{ id: "reporting", name: "Reporting" }]
    }
  }
];

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'social-media',
    name: 'Réseaux Sociaux',
    description: 'Automatisez vos publications et interactions sociales',
    icon: '📱',
    templates: WORKFLOW_TEMPLATES.filter(t => t.category === 'social-media')
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campagnes marketing et génération de leads',
    icon: '📈',
    templates: WORKFLOW_TEMPLATES.filter(t => t.category === 'marketing')
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Gestion des commandes et relation client',
    icon: '🛒',
    templates: WORKFLOW_TEMPLATES.filter(t => t.category === 'ecommerce')
  },
  {
    id: 'data-processing',
    name: 'Traitement de données',
    description: 'Collecte, transformation et analyse de données',
    icon: '📊',
    templates: WORKFLOW_TEMPLATES.filter(t => t.category === 'data-processing')
  },
  {
    id: 'automation',
    name: 'Automation générale',
    description: 'Workflows d\'automatisation généralistes',
    icon: '⚙️',
    templates: WORKFLOW_TEMPLATES.filter(t => t.category === 'automation')
  }
];

class WorkflowTemplateService {
  /**
   * Récupère tous les templates disponibles
   */
  getAllTemplates(): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES;
  }

  /**
   * Récupère toutes les catégories avec leurs templates
   */
  getCategories(): TemplateCategory[] {
    return TEMPLATE_CATEGORIES;
  }

  /**
   * Récupère un template par son ID
   */
  getTemplateById(id: string): WorkflowTemplate | null {
    return WORKFLOW_TEMPLATES.find(template => template.id === id) || null;
  }

  /**
   * Récupère les templates d'une catégorie
   */
  getTemplatesByCategory(categoryId: string): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(template => template.category === categoryId);
  }

  /**
   * Recherche des templates par mots-clés
   */
  searchTemplates(query: string): WorkflowTemplate[] {
    const searchQuery = query.toLowerCase();
    return WORKFLOW_TEMPLATES.filter(template => 
      template.name.toLowerCase().includes(searchQuery) ||
      template.description.toLowerCase().includes(searchQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    );
  }

  /**
   * Filtre les templates par complexité
   */
  getTemplatesByComplexity(complexity: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(template => template.complexity === complexity);
  }

  /**
   * Filtre les templates par tags
   */
  getTemplatesByTags(tags: string[]): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(template =>
      tags.some(tag => template.tags.includes(tag))
    );
  }

  /**
   * Récupère les templates populaires (les plus utilisés)
   */
  getPopularTemplates(limit: number = 6): WorkflowTemplate[] {
    // Pour l'instant, on retourne les premiers templates
    // Dans une vraie app, on baserait ça sur des statistiques d'usage
    return WORKFLOW_TEMPLATES.slice(0, limit);
  }

  /**
   * Récupère tous les tags uniques
   */
  getAllTags(): string[] {
    const allTags = WORKFLOW_TEMPLATES.flatMap(template => template.tags);
    return Array.from(new Set(allTags)).sort();
  }

  /**
   * Crée un nouveau workflow basé sur un template
   */
  async createWorkflowFromTemplate(templateId: string, customName?: string): Promise<any> {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} non trouvé`);
    }

    try {
      // Créer le workflow avec le service workflow
      const workflow = await workflowService.createWorkflow({
        name: customName || template.name,
        description: `Créé à partir du template: ${template.description}`,
        json_data: template.workflow,
        status: 'inactive',
        tags: [...template.tags, 'template', template.category]
      });

      console.log('✅ Workflow créé depuis template:', {
        templateId,
        workflowId: workflow.id,
        name: workflow.name
      });

      return workflow;
    } catch (error) {
      console.error('❌ Erreur création workflow depuis template:', error);
      throw error;
    }
  }

  /**
   * Valide un template avant de l'utiliser
   */
  validateTemplate(template: WorkflowTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérifications de base
    if (!template.name || template.name.trim() === '') {
      errors.push('Le nom du template est requis');
    }

    if (!template.description || template.description.trim() === '') {
      errors.push('La description du template est requise');
    }

    if (!template.workflow) {
      errors.push('Le workflow du template est requis');
    }

    // Vérification de la structure du workflow
    if (template.workflow) {
      if (!template.workflow.nodes || !Array.isArray(template.workflow.nodes)) {
        errors.push('Le workflow doit contenir un tableau de nœuds');
      }

      if (!template.workflow.connections || typeof template.workflow.connections !== 'object') {
        errors.push('Le workflow doit contenir un objet de connexions');
      }

      // Vérifier que tous les nœuds référencés dans les connexions existent
      if (template.workflow.nodes && template.workflow.connections) {
        const nodeIds = new Set(template.workflow.nodes.map((node: any) => node.id));
        
        for (const [sourceId, connections] of Object.entries(template.workflow.connections)) {
          if (!nodeIds.has(sourceId)) {
            errors.push(`Nœud source '${sourceId}' introuvable dans les connexions`);
          }

          if (connections && typeof connections === 'object') {
            for (const [connType, connArray] of Object.entries(connections)) {
              if (Array.isArray(connArray)) {
                connArray.forEach((connGroup: any, index: number) => {
                  if (Array.isArray(connGroup)) {
                    connGroup.forEach((conn: any) => {
                      if (conn.node && !nodeIds.has(conn.node)) {
                        errors.push(`Nœud cible '${conn.node}' introuvable dans les connexions`);
                      }
                    });
                  }
                });
              }
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Récupère des templates recommandés basés sur l'historique utilisateur
   */
  getRecommendedTemplates(userTags: string[] = [], limit: number = 3): WorkflowTemplate[] {
    if (userTags.length === 0) {
      return this.getPopularTemplates(limit);
    }

    // Calculer un score de pertinence pour chaque template
    const templatesWithScores = WORKFLOW_TEMPLATES.map(template => {
      const matchingTags = template.tags.filter(tag => userTags.includes(tag));
      const score = matchingTags.length / template.tags.length;
      
      return { template, score };
    });

    // Trier par score et retourner les meilleurs
    return templatesWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.template);
  }

  /**
   * Exporte un template au format JSON
   */
  exportTemplate(templateId: string): string {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} non trouvé`);
    }

    return JSON.stringify(template, null, 2);
  }

  /**
   * Importe un template depuis JSON
   */
  importTemplate(jsonData: string): WorkflowTemplate {
    try {
      const template: WorkflowTemplate = JSON.parse(jsonData);
      
      // Valider le template
      const validation = this.validateTemplate(template);
      if (!validation.valid) {
        throw new Error(`Template invalide: ${validation.errors.join(', ')}`);
      }

      return template;
    } catch (error) {
      console.error('❌ Erreur import template:', error);
      throw new Error('Données JSON invalides pour le template');
    }
  }
}

export const workflowTemplateService = new WorkflowTemplateService();
