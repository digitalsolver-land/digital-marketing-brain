
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'Jan', seo: 4000, sem: 2400, social: 2400 },
  { name: 'Fév', seo: 3000, sem: 1398, social: 2210 },
  { name: 'Mar', seo: 2000, sem: 9800, social: 2290 },
  { name: 'Avr', seo: 2780, sem: 3908, social: 2000 },
  { name: 'Mai', seo: 1890, sem: 4800, social: 2181 },
  { name: 'Jun', seo: 2390, sem: 3800, social: 2500 },
  { name: 'Jul', seo: 3490, sem: 4300, social: 2100 },
];

export const PerformanceChart: React.FC = () => {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Performance Multi-Canaux
          <div className="flex space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              SEO
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              SEM
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              Social
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgb(51 65 85)', 
                border: 'none', 
                borderRadius: '8px',
                color: 'white'
              }} 
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="seo" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="sem" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="social" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
