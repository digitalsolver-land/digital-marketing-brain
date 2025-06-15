
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Trash2, ExternalLink, RefreshCw, Filter } from 'lucide-react';
import { PostizPost } from '@/services/postizService';
import { postizService } from '@/services/postizService';
import { useToast } from '@/hooks/use-toast';

interface PostizPostsListProps {
  posts: PostizPost[];
  onPostDeleted: () => void;
  onRefresh: () => void;
}

export const PostizPostsList = ({ posts, onPostDeleted, onRefresh }: PostizPostsListProps) => {
  const [filter, setFilter] = useState<'all' | 'PUBLISHED' | 'QUEUE' | 'DRAFT' | 'ERROR'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (postId: string) => {
    setDeleting(postId);
    try {
      await postizService.deletePost(postId);
      toast({
        title: "Post supprimé",
        description: "Le post a été supprimé avec succès"
      });
      onPostDeleted();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le post",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'PUBLISHED': return 'bg-green-500';
      case 'QUEUE': return 'bg-orange-500';
      case 'DRAFT': return 'bg-gray-500';
      case 'ERROR': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'PUBLISHED': return 'Publié';
      case 'QUEUE': return 'En attente';
      case 'DRAFT': return 'Brouillon';
      case 'ERROR': return 'Erreur';
      default: return state;
    }
  };

  const filteredPosts = filter === 'all' ? posts : posts.filter(post => post.state === filter);

  return (
    <div className="space-y-4">
      {/* Filtres et actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les posts</SelectItem>
                  <SelectItem value="PUBLISHED">Publiés</SelectItem>
                  <SelectItem value="QUEUE">Programmés</SelectItem>
                  <SelectItem value="DRAFT">Brouillons</SelectItem>
                  <SelectItem value="ERROR">Erreurs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des posts */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Aucune publication
              </h3>
              <p className="text-gray-500">
                {filter === 'all' ? 'Aucune publication trouvée' : `Aucune publication ${getStateText(filter).toLowerCase()}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={post.integration.picture}
                        alt={post.integration.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{post.integration.name}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {post.integration.providerIdentifier}
                        </div>
                      </div>
                      <Badge className={getStateColor(post.state)}>
                        {getStateText(post.state)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          📅 {new Date(post.publishDate).toLocaleString('fr-FR')}
                        </span>
                        {post.releaseURL && (
                          <a
                            href={post.releaseURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Voir le post</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
