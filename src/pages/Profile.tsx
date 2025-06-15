import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building2, Calendar, Shield, Save, Upload, ArrowLeft } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, userRoles, loading } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        company: profile.company || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      console.log('Updating profile with data:', formData);
      
      // Mettre à jour directement dans Supabase
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user?.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      // Forcer le rechargement du profil
      if (user) {
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        console.log('Profile updated successfully:', updatedProfile);
      }
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });

      // Recharger la page pour voir les changements
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'commercial': return 'bg-blue-500';
      case 'client': return 'bg-green-500';
      case 'moderator': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Si en cours de chargement
  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur connecté
  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Accès non autorisé
          </h2>
          <p className="text-slate-600">
            Vous devez être connecté pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Bouton retour */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={handleBackToDashboard}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au Dashboard
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Mon Profil</h1>
        <p className="text-slate-600 mt-2">Gérez vos informations personnelles et vos préférences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar avec avatar et informations rapides */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={formData.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {formData.first_name?.[0]}{formData.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">
                  {formData.first_name} {formData.last_name}
                </h3>
                <p className="text-slate-600 text-sm mb-3">{user.email}</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {userRoles.map((role) => (
                    <Badge key={role} className={`${getRoleBadgeColor(role)} text-white`}>
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Membre depuis</span>
                <span className="font-medium">
                  {profile ? new Date(profile.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Statut:</span>
                <Badge variant="outline">Actif</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire principal */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations personnelles et professionnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="first_name"
                        className="pl-10"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="Votre prénom"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="last_name"
                        className="pl-10"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      className="pl-10"
                      value={user.email}
                      disabled
                      placeholder="Votre email"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    L'email ne peut pas être modifié depuis cette page
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="company"
                      className="pl-10"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Nom de votre entreprise"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url">URL de l'avatar</Label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="avatar_url"
                      className="pl-10"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
