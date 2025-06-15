import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Zap, Code, FileText, TrendingUp, Copy, Download } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { n8nApi } from '@/services/n8nApi';
import { useToast } from '@/hooks/use-toast';
import { AIConversation, ChatMessage } from '@/types/platform';

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiCommand, setApiCommand] = useState('');
  const [showApiPanel, setShowApiPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Message de bienvenue
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Bonjour ! Je suis votre assistant IA marketing. Je peux vous aider à :

🔧 **Créer des workflows n8n** - Décrivez ce que vous voulez automatiser
📝 **Générer du contenu** - Articles, posts sociaux, emails optimisés SEO
📊 **Analyser vos données** - Performance, concurrence, tendances
⚡ **Exécuter des commandes API** - Intégrations et automatisations avancées

Comment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date()
    }]);
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Déterminer le type d'action basé sur le message
      const action = await aiService.processCommand(inputMessage, {
        currentSection: 'ai-chat',
        availableWorkflows: await n8nApi.getWorkflows()
      });

      let response = '';
      let actions = [];

      switch (action.type) {
        case 'workflow_creation':
          response = await handleWorkflowCreation(action.payload);
          actions.push({
            type: 'workflow_creation',
            description: 'Workflow créé',
            payload: action.payload,
            status: 'completed'
          });
          break;

        case 'content_generation':
          response = await aiService.generateContent(
            inputMessage,
            action.payload.type,
            action.payload.keywords
          );
          break;

        case 'api_call':
          response = await handleApiCall(action.payload);
          break;

        default:
          response = await aiService.generateContent(inputMessage, 'blog');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        actions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Pouvez-vous reformuler votre demande ?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowCreation = async (payload: any): Promise<string> => {
    try {
      const workflow = await aiService.createWorkflowFromDescription(payload.description);
      await n8nApi.createWorkflow(workflow);
      return `✅ **Workflow créé avec succès !**

**Nom :** ${workflow.name}
**Description :** ${payload.description}

Le workflow a été créé et est maintenant disponible dans votre gestionnaire de workflows. Il contient ${workflow.nodes?.length || 0} nœuds et est prêt à être configuré.`;
    } catch (error) {
      return `❌ **Erreur lors de la création du workflow**

Je n'ai pas pu créer le workflow demandé. Pouvez-vous essayer de reformuler votre demande avec plus de détails ?`;
    }
  };

  const handleApiCall = async (payload: any): Promise<string> => {
    // Simuler un appel API
    return `🔌 **Commande API exécutée**

**Endpoint :** ${payload.endpoint}
**Méthode :** ${payload.method}
**Statut :** Succès

La commande a été exécutée avec succès.`;
  };

  const executeApiCommand = async () => {
    if (!apiCommand.trim()) return;

    try {
      // Ici, vous pouvez parser et exécuter la commande API
      const result = await fetch(apiCommand, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      toast({
        title: "Commande API exécutée",
        description: `Statut: ${result.status}`
      });
    } catch (error) {
      toast({
        title: "Erreur API",
        description: "Impossible d'exécuter la commande",
        variant: "destructive"
      });
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copié",
      description: "Message copié dans le presse-papiers"
    });
  };

  const quickActions = [
    {
      label: "Créer un workflow d'email marketing",
      icon: <Zap className="w-4 h-4" />,
      command: "Crée un workflow qui envoie un email de bienvenue quand quelqu'un s'inscrit à ma newsletter"
    },
    {
      label: "Générer du contenu SEO",
      icon: <FileText className="w-4 h-4" />,
      command: "Génère un article de blog optimisé SEO sur le marketing digital en 2024"
    },
    {
      label: "Analyser les performances",
      icon: <TrendingUp className="w-4 h-4" />,
      command: "Analyse mes performances marketing des 30 derniers jours et donne-moi des recommandations"
    },
    {
      label: "Optimiser les campagnes",
      icon: <Code className="w-4 h-4" />,
      command: "Comment puis-je améliorer le ROI de mes campagnes publicitaires actuelles ?"
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto p-3 text-left"
                onClick={() => setInputMessage(action.command)}
              >
                <div className="flex items-start space-x-2">
                  {action.icon}
                  <span className="text-sm">{action.label}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-blue-500" />
              <span>Assistant IA Marketing</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiPanel(!showApiPanel)}
            >
              <Code className="w-4 h-4 mr-2" />
              API Panel
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
                    {message.role === 'user' && <User className="w-4 h-4 mt-1 flex-shrink-0" />}
                    <div className="flex-1">
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      
                      {/* Actions */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.actions.map((action, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {action.description}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* API Panel */}
          {showApiPanel && (
            <div className="border-t pt-4 mb-4">
              <h4 className="font-semibold mb-2">Injection de Commande API</h4>
              <div className="flex space-x-2">
                <Input
                  placeholder="URL de l'API ou commande JSON..."
                  value={apiCommand}
                  onChange={(e) => setApiCommand(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={executeApiCommand} size="sm">
                  Exécuter
                </Button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Décrivez ce que vous voulez faire..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
