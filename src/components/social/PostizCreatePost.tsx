
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Image as ImageIcon, 
  X, 
  Send,
  AlertCircle,
  Sparkles,
  FileText
} from 'lucide-react';
import { postizService, PostizIntegration, CreatePostPayload } from '@/services/postizService';

interface PostizCreatePostProps {
  integrations: PostizIntegration[];
  onPostCreated: () => void;
  initialContent?: string;
  onContentUsed?: () => void;
}

export const PostizCreatePost = ({ 
  integrations, 
  onPostCreated, 
  initialContent = '',
  onContentUsed 
}: PostizCreatePostProps) => {
  const [content, setContent] = useState('');
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [postType, setPostType] = useState<'now' | 'schedule' | 'draft'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [uploadedImages, setUploadedImages] = useState<Array<{id: string; path: string; name: string}>>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleUseAIContent = () => {
    if (onContentUsed) {
      onContentUsed();
    }
    toast({
      title: "Contenu IA utilisé",
      description: "Le contenu généré par l'IA a été ajouté à votre publication"
    });
  };

  const handleIntegrationToggle = (integrationId: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => postizService.uploadFile(file));
      const uploadResults = await Promise.all(uploadPromises);
      
      setUploadedImages(prev => [
        ...prev,
        ...uploadResults.map(result => ({
          id: result.id,
          path: result.path,
          name: result.name
        }))
      ]);

      toast({
        title: "Images uploadées",
        description: `${uploadResults.length} image(s) uploadée(s) avec succès`
      });
    } catch (error) {
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader les images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      toast({
        title: "Contenu requis",
        description: "Veuillez saisir du contenu pour votre publication",
        variant: "destructive"
      });
      return;
    }

    if (selectedIntegrations.length === 0) {
      toast({
        title: "Réseau requis",
        description: "Veuillez sélectionner au moins un réseau social",
        variant: "destructive"
      });
      return;
    }

    if (postType === 'schedule' && (!scheduleDate || !scheduleTime)) {
      toast({
        title: "Date et heure requises",
        description: "Veuillez sélectionner une date et heure de publication",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const payload: CreatePostPayload = {
        type: postType,
        date: postType === 'schedule' 
          ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
          : new Date().toISOString(),
        shortLink: true,
        posts: selectedIntegrations.map(integrationId => ({
          integration: { id: integrationId },
          value: [{
            content,
            image: uploadedImages.length > 0 ? uploadedImages : undefined
          }]
        }))
      };

      await postizService.createPost(payload);
      
      // Réinitialiser le formulaire
      setContent('');
      setSelectedIntegrations([]);
      setUploadedImages([]);
      setPostType('now');
      setScheduleDate('');
      setScheduleTime('');

      toast({
        title: "Publication créée",
        description: postType === 'now' 
          ? "Votre publication a été publiée immédiatement" 
          : postType === 'schedule'
          ? "Votre publication a été programmée"
          : "Votre brouillon a été sauvegardé"
      });

      onPostCreated();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la publication",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const getButtonText = () => {
    switch (postType) {
      case 'now': return 'Publier maintenant';
      case 'schedule': return 'Programmer la publication';
      case 'draft': return 'Sauvegarder en brouillon';
      default: return 'Créer';
    }
  };

  const getButtonIcon = () => {
    switch (postType) {
      case 'now': return Send;
      case 'schedule': return Calendar;
      case 'draft': return FileText;
      default: return Plus;
    }
  };

  const ButtonIcon = getButtonIcon();

  return (
    <div className="space-y-6">
      {/* Notification contenu IA */}
      {initialContent && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Contenu généré par l'IA détecté. Le contenu a été pré-rempli dans l'éditeur.</span>
            <Button size="sm" variant="outline" onClick={handleUseAIContent}>
              <Sparkles className="w-3 h-3 mr-1" />
              Confirmer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-green-500" />
            <span>Créer une publication</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type de publication */}
          <div className="space-y-2">
            <Label>Type de publication</Label>
            <Select value={postType} onValueChange={(value: 'now' | 'schedule' | 'draft') => setPostType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Publier maintenant</SelectItem>
                <SelectItem value="schedule">Programmer la publication</SelectItem>
                <SelectItem value="draft">Sauvegarder en brouillon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Programmation */}
          {postType === 'schedule' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Date de publication</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Heure de publication</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Contenu */}
          <div className="space-y-2">
            <Label htmlFor="content">Contenu de la publication</Label>
            <Textarea
              id="content"
              placeholder="Écrivez votre publication ici... ou utilisez le générateur IA pour créer du contenu automatiquement !"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className={initialContent ? 'border-purple-200 bg-purple-50/50' : ''}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{content.length} caractères</span>
              {content.length > 280 && (
                <span className="text-orange-500">
                  Attention: Dépassement pour Twitter ({content.length}/280)
                </span>
              )}
            </div>
          </div>

          {/* Upload d'images */}
          <div className="space-y-3">
            <Label>Images (optionnel)</Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploading}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {uploading ? 'Upload en cours...' : 'Ajouter des images'}
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            
            {uploadedImages.length > 0 && (
              <div className="grid gap-2 md:grid-cols-3">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.path}
                      alt={image.name}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(image.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sélection des réseaux */}
          <div className="space-y-3">
            <Label>Réseaux sociaux de destination</Label>
            {integrations.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun réseau social connecté. Connectez vos comptes dans l'onglet "Réseaux".
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedIntegrations.includes(integration.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${integration.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !integration.disabled && handleIntegrationToggle(integration.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={integration.picture}
                        alt={integration.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{integration.name}</div>
                        <div className="text-sm text-gray-500">@{integration.profile}</div>
                      </div>
                      {selectedIntegrations.includes(integration.id) && (
                        <Badge className="bg-blue-500">Sélectionné</Badge>
                      )}
                      {integration.disabled && (
                        <Badge variant="destructive">Désactivé</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bouton de création */}
          <Button 
            onClick={handleCreatePost}
            disabled={creating || !content.trim() || selectedIntegrations.length === 0}
            className="w-full"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création en cours...
              </>
            ) : (
              <>
                <ButtonIcon className="w-4 h-4 mr-2" />
                {getButtonText()}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
