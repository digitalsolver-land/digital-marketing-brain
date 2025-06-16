
import React from 'react';
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Eye, MousePointer, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => {
  const isPositive = change >= 0;
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between">
          {title}
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <div className="flex items-center mt-1">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-sm text-slate-500 ml-1">vs. période précédente</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MetricsGrid: React.FC = () => {
  const metrics = [
    {
      title: 'Trafic Organique',
      value: '45,832',
      change: 12.5,
      icon: <Eye className="w-5 h-5 text-white" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Conversions SEM',
      value: '1,234',
      change: 8.2,
      icon: <Target className="w-5 h-5 text-white" />,
      color: 'bg-green-500'
    },
    {
      title: 'Engagement Social',
      value: '89.2%',
      change: -2.1,
      icon: <Share2 className="w-5 h-5 text-white" />,
      color: 'bg-purple-500'
    },
    {
      title: 'ROI Global',
      value: '€12,450',
      change: 15.8,
      icon: <DollarSign className="w-5 h-5 text-white" />,
      color: 'bg-emerald-500'
    },
    {
      title: 'CTR Moyen',
      value: '3.4%',
      change: 5.7,
      icon: <MousePointer className="w-5 h-5 text-white" />,
      color: 'bg-orange-500'
    },
    {
      title: 'Nouveaux Followers',
      value: '2,847',
      change: 22.3,
      icon: <Users className="w-5 h-5 text-white" />,
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};
