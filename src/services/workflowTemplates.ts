import { N8nWorkflowJSON } from './enhancedWorkflowService';

export interface WorkflowTemplate {
  name: string;
  description: string;
  category: string;
  workflow: N8nWorkflowJSON;
}

export const workflowTemplates: WorkflowTemplate[] = [
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

export const getTemplatesByCategory = (category?: string) => {
  if (!category) return workflowTemplates;
  return workflowTemplates.filter(template => template.category === category);
};

export const getCategories = () => {
  return [...new Set(workflowTemplates.map(template => template.category))];
};
