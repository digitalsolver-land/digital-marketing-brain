import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Clock, Users, Target, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface MarketingEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'campaign' | 'content' | 'social' | 'email' | 'event';
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  tags: string[];
}

const eventTypes = [
  { value: 'campaign', label: 'Campagne', color: 'bg-blue-500' },
  { value: 'content', label: 'Contenu', color: 'bg-green-500' },
  { value: 'social', label: 'Social Media', color: 'bg-pink-500' },
  { value: 'email', label: 'Email Marketing', color: 'bg-purple-500' },
  { value: 'event', label: 'Événement', color: 'bg-orange-500' }
];

const statusColors = {
  'planned': 'bg-gray-500',
  'in-progress': 'bg-yellow-500',
  'completed': 'bg-green-500',
  'cancelled': 'bg-red-500'
};

const priorityColors = {
  'low': 'bg-blue-500',
  'medium': 'bg-yellow-500',
  'high': 'bg-red-500'
};

export const MarketingCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<MarketingEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const { toast } = useToast();

  // Initialize with sample events
  useEffect(() => {
    const sampleEvents: MarketingEvent[] = [
      {
        id: '1',
        title: 'Lancement campagne été',
        description: 'Campagne publicitaire pour la collection été',
        date: '2025-06-20',
        time: '09:00',
        type: 'campaign',
        status: 'planned',
        priority: 'high',
        assignedTo: 'Marketing Team',
        tags: ['été', 'campagne', 'publicité']
      },
      {
        id: '2',
        title: 'Post Instagram daily',
        description: 'Publication quotidienne sur Instagram',
        date: '2025-06-17',
        time: '14:00',
        type: 'social',
        status: 'in-progress',
        priority: 'medium',
        assignedTo: 'Social Media Manager',
        tags: ['instagram', 'daily', 'social']
      },
      {
        id: '3',
        title: 'Newsletter mensuelle',
        description: 'Envoi de la newsletter mensuelle aux abonnés',
        date: '2025-06-25',
        time: '10:00',
        type: 'email',
        status: 'planned',
        priority: 'medium',
        assignedTo: 'Content Team',
        tags: ['newsletter', 'email', 'mensuel']
      }
    ];
    setEvents(sampleEvents);
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const addEvent = (eventData: Omit<MarketingEvent, 'id'>) => {
    const newEvent: MarketingEvent = {
      ...eventData,
      id: Date.now().toString()
    };
    setEvents([...events, newEvent]);
    toast({
      title: "Événement ajouté",
      description: "L'événement a été ajouté au calendrier avec succès."
    });
  };

  const updateEvent = (eventId: string, eventData: Partial<MarketingEvent>) => {
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, ...eventData } : event
    ));
    toast({
      title: "Événement modifié",
      description: "L'événement a été mis à jour avec succès."
    });
  };

  const deleteEvent = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
    toast({
      title: "Événement supprimé",
      description: "L'événement a été supprimé du calendrier."
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1), 1));
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // Header with day names
    days.push(
      <div key="header" className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center font-semibold text-slate-600 dark:text-slate-400">
            {day}
          </div>
        ))}
      </div>
    );

    // Calendar grid
    const calendarDays = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="h-20 p-1 border border-slate-200 dark:border-slate-700"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      const dayEvents = getEventsForDate(dateStr);
      const isToday = dateStr === formatDate(new Date());

      calendarDays.push(
        <div
          key={day}
          className={`h-20 p-1 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
            isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''
          }`}
          onClick={() => {
            // Open dialog to add event for this date
            setSelectedEvent({
              id: '',
              title: '',
              description: '',
              date: dateStr,
              time: '09:00',
              type: 'campaign',
              status: 'planned',
              priority: 'medium',
              tags: []
            });
            setIsDialogOpen(true);
          }}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate text-white ${eventTypes.find(t => t.value === event.type)?.color || 'bg-gray-500'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setIsDialogOpen(true);
                }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-slate-500">+{dayEvents.length - 2} autres</div>
            )}
          </div>
        </div>
      );
    }

    days.push(
      <div key="calendar" className="grid grid-cols-7 gap-1">
        {calendarDays}
      </div>
    );

    return days;
  };

  const renderListView = () => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

    return (
      <div className="space-y-4">
        {sortedEvents.map(event => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{event.title}</h3>
                    <Badge className={eventTypes.find(t => t.value === event.type)?.color}>
                      {eventTypes.find(t => t.value === event.type)?.label}
                    </Badge>
                    <Badge className={statusColors[event.status]} variant="secondary">
                      {event.status}
                    </Badge>
                    <Badge className={priorityColors[event.priority]} variant="secondary">
                      {event.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{event.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{event.time}</span>
                    </span>
                    {event.assignedTo && (
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{event.assignedTo}</span>
                      </span>
                    )}
                  </div>
                  {event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="w-2 h-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteEvent(event.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Calendrier Marketing
        </h2>
        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
            >
              Mois
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              Liste
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setSelectedEvent({
                  id: '',
                  title: '',
                  description: '',
                  date: formatDate(new Date()),
                  time: '09:00',
                  type: 'campaign',
                  status: 'planned',
                  priority: 'medium',
                  tags: []
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedEvent?.id ? 'Modifier l\'événement' : 'Nouvel événement'}
                </DialogTitle>
                <DialogDescription>
                  {selectedEvent?.id ? 'Modifiez les détails de l\'événement' : 'Créez un nouvel événement marketing'}
                </DialogDescription>
              </DialogHeader>
              <EventForm
                event={selectedEvent}
                onSave={(eventData) => {
                  if (selectedEvent?.id) {
                    updateEvent(selectedEvent.id, eventData);
                  } else {
                    addEvent(eventData);
                  }
                  setIsDialogOpen(false);
                }}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {view === 'month' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-cyan-500" />
                <span>{currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderMonthView()}
          </CardContent>
        </Card>
      )}

      {view === 'list' && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Tous les événements
          </h3>
          {renderListView()}
        </div>
      )}
    </div>
  );
};

interface EventFormProps {
  event: MarketingEvent | null;
  onSave: (eventData: Omit<MarketingEvent, 'id'>) => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<MarketingEvent, 'id'>>({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || '',
    time: event?.time || '09:00',
    type: event?.type || 'campaign',
    status: event?.status || 'planned',
    priority: event?.priority || 'medium',
    assignedTo: event?.assignedTo || '',
    tags: event?.tags || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="time">Heure</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priorité</Label>
          <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Basse</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="assignedTo">Assigné à</Label>
        <Input
          id="assignedTo"
          value={formData.assignedTo}
          onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
          placeholder="Nom de l'équipe ou personne"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {event?.id ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};