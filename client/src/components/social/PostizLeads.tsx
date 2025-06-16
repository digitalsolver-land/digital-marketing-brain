
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Mail, Phone, Calendar, Edit, TestTube } from 'lucide-react';
import { postizService, PostizLead } from '@/services/postizService';
import { useToast } from '@/hooks/use-toast';

export const PostizLeads = () => {
  const [leads, setLeads] = useState<PostizLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'qualified' | 'converted'>('all');
  const [isDemo, setIsDemo] = useState(false);
  const [editingLead, setEditingLead] = useState<PostizLead | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLeads();
    setIsDemo(postizService.getDemoStatus());
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const leadsData = await postizService.getLeads();
      setLeads(leadsData);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<PostizLead>) => {
    try {
      await postizService.updateLead(leadId, updates);
      await loadLeads();
      setEditingLead(null);
      toast({
        title: "Lead mis à jour",
        description: "Les informations du lead ont été mises à jour"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le lead",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'qualified': return 'bg-orange-500';
      case 'converted': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Nouveau';
      case 'contacted': return 'Contacté';
      case 'qualified': return 'Qualifié';
      case 'converted': return 'Converti';
      default: return status;
    }
  };

  const filteredLeads = filter === 'all' ? leads : leads.filter(lead => lead.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Chargement des leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>Gestion des Leads</span>
            </div>
            {isDemo && (
              <Badge className="bg-orange-500">
                <TestTube className="w-3 h-3 mr-1" />
                Mode Demo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les leads</SelectItem>
                <SelectItem value="new">Nouveaux</SelectItem>
                <SelectItem value="contacted">Contactés</SelectItem>
                <SelectItem value="qualified">Qualifiés</SelectItem>
                <SelectItem value="converted">Convertis</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex space-x-2">
              <div className="text-sm text-gray-600">
                Total: {filteredLeads.length} leads
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Aucun lead trouvé
                </h3>
                <p className="text-gray-500">
                  Les leads générés par vos publications apparaîtront ici
                </p>
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <Card key={lead.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{lead.name}</h3>
                          <Badge className={getStatusColor(lead.status)}>
                            {getStatusText(lead.status)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{lead.email}</span>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(lead.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Source:</span> {lead.source}
                          </div>
                          {lead.notes && (
                            <div className="text-sm">
                              <span className="font-medium">Notes:</span> {lead.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingLead(lead)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Modifier le lead</DialogTitle>
                          </DialogHeader>
                          <EditLeadForm 
                            lead={lead} 
                            onSave={(updates) => handleUpdateLead(lead.id, updates)}
                            onCancel={() => setEditingLead(null)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface EditLeadFormProps {
  lead: PostizLead;
  onSave: (updates: Partial<PostizLead>) => void;
  onCancel: () => void;
}

const EditLeadForm = ({ lead, onSave, onCancel }: EditLeadFormProps) => {
  const [formData, setFormData] = useState({
    name: lead.name,
    email: lead.email,
    phone: lead.phone || '',
    status: lead.status,
    notes: lead.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Statut</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value: any) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Nouveau</SelectItem>
            <SelectItem value="contacted">Contacté</SelectItem>
            <SelectItem value="qualified">Qualifié</SelectItem>
            <SelectItem value="converted">Converti</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>
      
      <div className="flex space-x-2">
        <Button type="submit">Sauvegarder</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
};
