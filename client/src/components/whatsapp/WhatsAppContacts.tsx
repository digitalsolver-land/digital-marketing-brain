
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, MessageCircle, Phone } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastContact: string;
  messageCount: number;
  status: 'active' | 'blocked' | 'archived';
  tags: string[];
}

export const WhatsAppContacts = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Données de démonstration
  const contacts: Contact[] = [
    {
      id: '1',
      name: 'Jean Dupont',
      phone: '+33 6 12 34 56 78',
      lastContact: '2024-06-15',
      messageCount: 15,
      status: 'active',
      tags: ['client', 'premium']
    },
    {
      id: '2',
      name: 'Marie Martin',
      phone: '+33 6 98 76 54 32',
      lastContact: '2024-06-14',
      messageCount: 8,
      status: 'active',
      tags: ['prospect']
    },
    {
      id: '3',
      name: 'Pierre Durand',
      phone: '+33 6 11 22 33 44',
      lastContact: '2024-06-10',
      messageCount: 3,
      status: 'archived',
      tags: ['lead']
    }
  ];

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'blocked': return 'bg-red-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'client': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      case 'prospect': return 'bg-orange-500';
      case 'lead': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{contacts.length}</p>
                <p className="text-sm text-gray-600">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{contacts.filter(c => c.status === 'active').length}</p>
                <p className="text-sm text-gray-600">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{contacts.reduce((acc, c) => acc + c.messageCount, 0)}</p>
                <p className="text-sm text-gray-600">Messages totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{contacts.filter(c => c.tags.includes('client')).length}</p>
                <p className="text-sm text-gray-600">Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestion des Contacts</span>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un contact
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher par nom, téléphone ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des contacts */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredContacts.map((contact, index) => (
              <div
                key={contact.id}
                className={`p-4 hover:bg-gray-50 ${index !== filteredContacts.length - 1 ? 'border-b' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium">{contact.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {contact.phone}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`${getStatusColor(contact.status)} text-white text-xs`}>
                          {contact.status}
                        </Badge>
                        {contact.tags.map((tag) => (
                          <Badge key={tag} className={`${getTagColor(tag)} text-white text-xs`}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {contact.messageCount} messages
                    </p>
                    <p className="text-xs text-gray-500">
                      Dernier contact: {new Date(contact.lastContact).toLocaleDateString('fr-FR')}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredContacts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm ? 'Aucun contact trouvé' : 'Aucun contact'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Essayez avec d\'autres termes de recherche'
                : 'Commencez par ajouter vos premiers contacts WhatsApp'
              }
            </p>
            {!searchTerm && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un contact
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
