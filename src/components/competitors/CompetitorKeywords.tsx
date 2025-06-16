
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Search
} from 'lucide-react';

export const CompetitorKeywords = () => {
  const { toast } = useToast();
  const [newKeyword, setNewKeyword] = useState('');

  const keywords = [
    {
      id: 1,
      keyword: "marketing digital",
      position: 3,
      previousPosition: 5,
      volume: "12K",
      difficulty: "Medium",
      competitors: ["Competitor A", "Competitor B"]
    },
    {
      id: 2,
      keyword: "automatisation marketing",
      position: 7,
      previousPosition: 9,
      volume: "8.5K",
      difficulty: "High",
      competitors: ["Competitor A", "Competitor C"]
    },
    {
      id: 3,
      keyword: "CRM en ligne",
      position: 12,
      previousPosition: 10,
      volume: "6.2K",
      difficulty: "Low",
      competitors: ["Competitor B"]
    }
  ];

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) {
      toast({
        title: "Mot-clé requis",
        description: "Veuillez entrer un mot-clé à surveiller",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Mot-clé ajouté",
      description: `"${newKeyword}" a été ajouté à la surveillance`,
    });
    setNewKeyword('');
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current < previous) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (current > previous) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-500" />
            <span>Mots-clés Surveillés</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Input
              placeholder="Nouveau mot-clé..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="w-48"
            />
            <Button onClick={handleAddKeyword}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {keywords.map((keyword) => (
            <div key={keyword.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center space-x-4">
                <Search className="w-5 h-5 text-slate-400" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {keyword.keyword}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Volume: {keyword.volume}
                    </span>
                    <Badge variant="outline" className={getDifficultyColor(keyword.difficulty)}>
                      {keyword.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      #{keyword.position}
                    </span>
                    {getTrendIcon(keyword.position, keyword.previousPosition)}
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Position
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {keyword.competitors.length} concurrent(s)
                  </span>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {keyword.competitors.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
