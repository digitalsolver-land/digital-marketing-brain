
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Upload, X, Calendar, Send } from 'lucide-react';
import { postizService, PostizIntegration, CreatePostPayload } from '@/services/postizService';
import { useToast } from '@/hooks/use-toast';

interface PostizCreatePostProps {
  integrations: PostizIntegration[];
  onPostCreated: () => void;
}

export const PostizCreatePost = ({ integrations, onPostCreated }: PostizCreatePostProps) => {
  const [content, setContent] = useState('');
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [postType, setPostType] = useState<'now' | 'schedule' | 'draft'>('draft');
  const [scheduleDate, setScheduleDate] = useState('');
  const [shortLink, setShortLink] = useState(true);
  const [images, setImages] = useState<{ id: string; path: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleIntegrationToggle = (integrationId: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResponse = await postizService.uploadFile(file);
      setImages(prev => [...prev, { id: uploadResponse.id, path: uploadResponse.path }]);
      
      toast({
        title: "Image uploadée",
        description: "L'image a été uploadée avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader l'image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Erreur",
        description: "Le contenu ne peut pas être vide",
        variant: "destructive"
      });
      return;
    }

    if (selectedIntegrations.length === 0) {
      toast({
        title: "Erreur",
        description: "Sélectionnez au moins un réseau social",
        variant: "destructive"
      });
      return;
    }

    if (postType === 'schedule' && !scheduleDate) {
      toast({
        title: "Erreur",
        description: "Sélectionnez une date de programmation",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const payload: CreatePostPayload = {
        type: postType,
        date: postType === 'schedule' ? scheduleDate : new Date().toISOString(),
        shortLink,
        posts: selectedIntegrations.map(integrationId => ({
          integration: { id: integrationId },
          value: [{
            content,
            image: images
          }]
        }))
      };

      await postizService.createPost(payload);
      
      // Reset form
      setContent('');
      setSelectedIntegrations([]);
      setImages([]);
      setScheduleDate('');
      
      toast({
        title: "Succès",
        description: `Post ${postType === 'now' ? 'publié' : postType === 'schedule' ? 'programmé' : 'sauvegardé'} avec succès`
      });
      
      onPostCreated();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5 text-blue-500" />
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
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="schedule">Programmer</SelectItem>
              <SelectItem value="now">Publier maintenant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date de programmation */}
        {postType === 'schedule' && (
          <div className="space-y-2">
            <Label htmlFor="schedule-date">Date de programmation</Label>
            <Input
              id="schedule-date"
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
        )}

        {/* Contenu */}
        <div className="space-y-2">
          <Label htmlFor="content">Contenu de la publication</Label>
          <Textarea
            id="content"
            placeholder="Écrivez votre publication..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
        </div>

        {/* Images */}
        <div className="space-y-2">
          <Label>Images</Label>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Upload...' : 'Ajouter image'}
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((image) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.path}
                    alt="Upload"
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Réseaux sociaux */}
        <div className="space-y-2">
          <Label>Réseaux sociaux</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedIntegrations.includes(integration.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleIntegrationToggle(integration.id)}
              >
                <div className="flex items-center space-x-2">
                  <img
                    src={integration.picture}
                    alt={integration.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{integration.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{integration.identifier}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center space-x-2">
          <Switch
            id="short-link"
            checked={shortLink}
            onCheckedChange={setShortLink}
          />
          <Label htmlFor="short-link">Utiliser des liens courts</Label>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {postType === 'now' ? (
              <Send className="w-4 h-4" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            <span>
              {loading ? 'En cours...' : 
               postType === 'now' ? 'Publier maintenant' :
               postType === 'schedule' ? 'Programmer' : 'Sauvegarder'}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
