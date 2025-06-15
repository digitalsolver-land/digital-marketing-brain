
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Search, Phone } from 'lucide-react';

interface Conversation {
  id: string;
  contact: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: 'active' | 'pending' | 'resolved';
}

export const WhatsAppConversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Données de démonstration
  const conversations: Conversation[] = [
    {
      id: '1',
      contact: 'Jean Dupont',
      phone: '+33 6 12 34 56 78',
      lastMessage: 'Bonjour, j\'aimerais avoir des informations sur vos services',
      timestamp: '14:30',
      unread: 2,
      status: 'active'
    },
    {
      id: '2',
      contact: 'Marie Martin',
      phone: '+33 6 98 76 54 32',
      lastMessage: 'Merci pour votre réponse rapide !',
      timestamp: '13:45',
      unread: 0,
      status: 'resolved'
    },
    {
      id: '3',
      contact: 'Client Inconnu',
      phone: '+33 6 11 22 33 44',
      lastMessage: 'Je cherche des prix pour...',
      timestamp: '12:20',
      unread: 1,
      status: 'pending'
    }
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.phone.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'resolved': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Envoi du message:', message);
      setMessage('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Liste des conversations */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Conversations</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une conversation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 ${
                  selectedConversation === conv.id ? 'bg-blue-50 border-l-blue-500' : 'border-l-transparent'
                }`}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm truncate">{conv.contact}</h4>
                      <Badge className={`${getStatusColor(conv.status)} text-white text-xs`}>
                        {conv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Phone className="w-3 h-3 mr-1" />
                      {conv.phone}
                    </p>
                    <p className="text-sm text-gray-600 truncate mt-1">{conv.lastMessage}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-xs text-gray-500">{conv.timestamp}</span>
                    {conv.unread > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">
                        {conv.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zone de conversation */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>
              {selectedConversation 
                ? filteredConversations.find(c => c.id === selectedConversation)?.contact 
                : 'Sélectionnez une conversation'
              }
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedConversation ? (
            <div className="h-[400px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg p-3 max-w-[70%]">
                      <p className="text-sm">Bonjour, j'aimerais avoir des informations sur vos services</p>
                      <span className="text-xs text-gray-500">14:28</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-blue-500 text-white rounded-lg p-3 max-w-[70%]">
                      <p className="text-sm">Bonjour ! Je serais ravi de vous aider. Quel type de service vous intéresse ?</p>
                      <span className="text-xs text-blue-100">14:29</span>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg p-3 max-w-[70%]">
                      <p className="text-sm">Je cherche des solutions marketing digital</p>
                      <span className="text-xs text-gray-500">14:30</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone de saisie */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Tapez votre message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
