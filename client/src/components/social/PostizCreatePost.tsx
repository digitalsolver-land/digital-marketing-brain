import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Upload, Send, Clock, Save, Image as ImageIcon, X, TestTube } from 'lucide-react';
import { postizService, PostizIntegration } from '@/services/postizService';
import { useToast } from '@/hooks/use-toast';

interface PostizCreatePostProps {
  integrations: PostizIntegration[];
  onPostCreated: () => void;
  initialContent?: string;
  onContentUsed?: () => void;
}

export const PostizCreatePost: React.FC<PostizCreatePostProps> = ({
  integrations,
  onPostCreated,
  initialContent = '',
  onContentUsed
}) => {
  const [content, setContent] = useState('');
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [postType, setPostType] = useState<'now' | 'schedule' | 'draft'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      if (onContentUsed) {
        onContentUsed();
      }
    }
  }, [initialContent, onContentUsed]);

  useEffect(() => {
    setIsDemo(postizService.getDemoStatus());
  }, []);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = Array.from(files);
      setImages(prev => [...prev, ...uploadedFiles]);
      
      if (isDemo) {
        toast({
          title: "Fichiers ajoutés (Demo)",
          description: "Les fichiers ont été ajoutés en mode démonstration.",
        });
      } else {
        // Upload réel des fichiers
        const uploadPromises = uploadedFiles.map(file => postizService.uploadFile(file));
        await Promise.all(uploadPromises);
        
        toast({
          title: "Fichiers uploadés",
          description: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur upload",
        description: "Impossible d'uploader les fichiers.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [toast, isDemo]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Erreur",
        description: "Le contenu ne peut pas être vide.",
        variant: "destructive"
      });
      return;
    }

    if (selectedIntegrations.length === 0) {
      toast({
        title: "Erreur",
        description: "Sélectionnez au moins un réseau social.",
        variant: "destructive"
      });
      return;
    }

    if (postType === 'schedule' && !scheduledDate) {
      toast({
        title: "Erreur",
        description: "Sélectionnez une date de programmation.",
        variant: "destructive"
      });
      return;
    }

    setPosting(true);
    try {
      const payload = {
        type: postType,
        date: postType === 'schedule' ? scheduledDate : new Date().toISOString(),
        shortLink: true,
        posts: selectedIntegrations.map(integrationId => ({
          integration: { id: integrationId },
          value: [{
            content,
            image: images.map((_, index) => ({
              id: `demo-img-${index}`,
              path: `demo-path-${index}`
            }))
          }]
        }))
      };

      await postizService.createPost(payload);
      
      toast({
        title: isDemo ? "Publication créée (Demo)" : "Publication créée",
        description: isDemo 
          ? "Votre publication a été créée en mode démonstration."
          : `Publication ${postType === 'now' ? 'publiée' : postType === 'schedule' ? 'programmée' : 'sauvegardée'} avec succès.`,
      });

      // Reset form
      setContent('');
      setSelectedIntegrations([]);
      setImages([]);
      setPostType('now');
      setScheduledDate('');
      
      onPostCreated();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la publication.",
        variant: "destructive"
      });
    } finally {
      setPosting(false);
    }
  };

  const activeIntegrations = integrations.filter(i => !i.disabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Créer une publication</span>
          {isDemo && (
            <Badge className="bg-orange-500">
              <TestTube className="w-3 h-3 mr-1" />
              Mode Demo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isDemo && (
          <Alert>
            <TestTube className="h-4 w-4" />
            <AlertDescription>
              Mode démonstration actif. Vos publications ne seront pas réellement publiées sur les réseaux sociaux.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="content">Contenu de la publication</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Que voulez-vous partager aujourd'hui ?"
            rows={6}
            className="resize-none"
          />
          <div className="text-sm text-gray-500 text-right">
            {content.length} caractères
          </div>
        </div>

        <div className="space-y-2">
          <Label>Images et médias</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Cliquez pour ajouter des images ou vidéos
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, MP4 jusqu'à 10MB
              </p>
            </label>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Réseaux sociaux</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {activeIntegrations.map((integration) => (
              <label
                key={integration.id}
                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedIntegrations.includes(integration.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIntegrations.includes(integration.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIntegrations(prev => [...prev, integration.id]);
                    } else {
                      setSelectedIntegrations(prev => prev.filter(id => id !== integration.id));
                    }
                  }}
                  className="rounded"
                />
                <img
                  src={integration.picture}
                  alt={integration.name}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-sm font-medium">{integration.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Type de publication</Label>
            <Select value={postType} onValueChange={(value: 'now' | 'schedule' | 'draft') => setPostType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Publier maintenant</span>
                  </div>
                </SelectItem>
                <SelectItem value="schedule">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Programmer</span>
                  </div>
                </SelectItem>
                <SelectItem value="draft">
                  <div className="flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Sauvegarder en brouillon</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {postType === 'schedule' && (
            <div className="space-y-2">
              <Label>Date et heure de programmation</Label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={posting || uploading}
          className="w-full"
        >
          {posting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>
                {postType === 'now' ? 'Publication...' : 
                 postType === 'schedule' ? 'Programmation...' : 
                 'Sauvegarde...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {postType === 'now' ? <Send className="w-4 h-4" /> :
               postType === 'schedule' ? <Clock className="w-4 h-4" /> :
               <Save className="w-4 h-4" />}
              <span>
                {postType === 'now' ? 'Publier maintenant' :
                 postType === 'schedule' ? 'Programmer la publication' :
                 'Sauvegarder en brouillon'}
              </span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
