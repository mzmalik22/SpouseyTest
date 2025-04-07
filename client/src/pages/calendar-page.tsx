import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, CalendarIcon, PlusCircle, Clock, MapPin, User, Users, Calendar as CalendarIcon2, Tag, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays, parseISO, isToday, isBefore } from 'date-fns';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { CalendarEvent, CalendarIntegration, Task } from '@/lib/types';

// Create Event Form Schema
const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.date(),
  startTime: z.string(),
  endDate: z.date(),
  endTime: z.string(),
  allDay: z.boolean().default(false),
  calendarId: z.number().optional(),
  visibility: z.enum(['private', 'partner', 'public']).default('partner'),
  isTask: z.boolean().default(false),
  assignToPartner: z.boolean().default(false),
  taskNotes: z.string().optional(),
  taskPriority: z.number().min(0).max(5).default(0)
});

// Create Calendar Integration Form Schema
const calendarIntegrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['personal', 'work', 'family', 'shared']),
  provider: z.enum(['google', 'apple', 'outlook', 'manual']),
  visibility: z.enum(['private', 'partner', 'public']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
});

// Helper function to get status badge for tasks
const getStatusBadge = (status: string) => {
  switch(status) {
    case 'pending':
      return <Badge variant="outline" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Pending</Badge>;
    case 'accepted':
      return <Badge variant="outline" className="flex items-center gap-1 text-green-500"><CheckCircle className="h-3 w-3" /> Accepted</Badge>;
    case 'declined':
      return <Badge variant="outline" className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" /> Declined</Badge>;
    case 'completed':
      return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
    default:
      return null;
  }
};

// Calendar Page Component
export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [isNewCalendarDialogOpen, setIsNewCalendarDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);

  // Event form
  const eventForm = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      startDate: new Date(),
      startTime: format(new Date(), 'HH:mm'),
      endDate: new Date(),
      endTime: format(addDays(new Date(), 1), 'HH:mm'),
      allDay: false,
      visibility: 'partner',
      isTask: false,
      assignToPartner: false,
      taskPriority: 0
    }
  });

  // Calendar integration form
  const calendarForm = useForm<z.infer<typeof calendarIntegrationSchema>>({
    resolver: zodResolver(calendarIntegrationSchema),
    defaultValues: {
      name: '',
      type: 'personal',
      provider: 'manual',
      visibility: 'partner',
      color: '#4285F4',
    }
  });

  // Get calendar events for the selected date
  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/calendar/events', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const res = await apiRequest('GET', 
        `/api/calendar/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      return await res.json();
    },
    enabled: !!selectedDate && !!user
  });

  // Get partner's events for the selected date
  const { data: partnerEvents = [], isLoading: isLoadingPartnerEvents } = useQuery({
    queryKey: ['/api/calendar/partner-events', selectedDate],
    queryFn: async () => {
      if (!selectedDate || !user?.partnerId) return [];
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const res = await apiRequest('GET', 
        `/api/calendar/partner-events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      return await res.json();
    },
    enabled: !!selectedDate && !!user?.partnerId
  });

  // Get all calendar integrations
  const { data: calendars = [], isLoading: isLoadingCalendars } = useQuery({
    queryKey: ['/api/calendar/integrations'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/calendar/integrations');
      return await res.json();
    },
    enabled: !!user
  });

  // Get all tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['/api/calendar/tasks'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/calendar/tasks');
      return await res.json();
    },
    enabled: !!user
  });

  // Get event details
  const { data: selectedEvent } = useQuery({
    queryKey: ['/api/calendar/events', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      const res = await apiRequest('GET', `/api/calendar/events/${selectedEventId}`);
      return await res.json();
    },
    enabled: !!selectedEventId
  });

  // Get task details for selected event
  const { data: selectedEventTask } = useQuery({
    queryKey: ['/api/calendar/tasks/event', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return null;
      const res = await apiRequest('GET', `/api/calendar/tasks/event/${selectedEventId}`);
      if (res.status === 404) return null;
      return await res.json();
    },
    enabled: !!selectedEventId
  });

  // Create new event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: z.infer<typeof eventSchema>) => {
      // Combine date and time
      const startDateTime = new Date(data.startDate);
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const endDateTime = new Date(data.endDate);
      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      // Create event
      const res = await apiRequest('POST', '/api/calendar/events', {
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        allDay: data.allDay,
        calendarId: data.calendarId || null,
        visibility: data.visibility,
        isTask: data.isTask || data.assignToPartner,
      });

      const event = await res.json();

      // If we're assigning to partner, create a task
      if (data.assignToPartner && user?.partnerId) {
        const taskRes = await apiRequest('POST', '/api/calendar/tasks', {
          eventId: event.id,
          assigneeId: user.partnerId,
          dueDate: startDateTime.toISOString(),
          priority: data.taskPriority,
          notes: data.taskNotes || null
        });
        
        return {
          event,
          task: await taskRes.json()
        };
      }

      return { event };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/tasks'] });
      setIsNewEventDialogOpen(false);
      eventForm.reset();
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create new calendar integration mutation
  const createCalendarMutation = useMutation({
    mutationFn: async (data: z.infer<typeof calendarIntegrationSchema>) => {
      const res = await apiRequest('POST', '/api/calendar/integrations', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/integrations'] });
      setIsNewCalendarDialogOpen(false);
      calendarForm.reset();
      toast({
        title: "Calendar added",
        description: "Your calendar has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding calendar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number, status: string }) => {
      const res = await apiRequest('PATCH', `/api/calendar/tasks/${taskId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/tasks/event'] });
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission for new event
  const onSubmitEvent = (data: z.infer<typeof eventSchema>) => {
    createEventMutation.mutate(data);
  };

  // Handle form submission for new calendar
  const onSubmitCalendar = (data: z.infer<typeof calendarIntegrationSchema>) => {
    createCalendarMutation.mutate(data);
  };

  // Helper to get calendar by ID
  const getCalendarById = (id: number | null) => {
    if (!id) return null;
    return calendars.find(cal => cal.id === id);
  };

  // Combined events from user and partner (if showing partner events)
  const allEvents = [...events, ...partnerEvents];

  // Filter pending tasks
  const pendingTasks = tasks.filter(task => task.status === 'pending' || task.status === 'accepted');
  
  // Past due tasks (not completed and due date is in the past)
  const pastDueTasks = pendingTasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return isBefore(dueDate, new Date()) && task.status !== 'completed';
  });

  // Today's tasks
  const todayTasks = pendingTasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return isToday(dueDate);
  });

  // Functions to accept/decline/complete tasks
  const handleAcceptTask = (taskId: number) => {
    updateTaskMutation.mutate({ taskId, status: 'accepted' });
  };

  const handleDeclineTask = (taskId: number) => {
    updateTaskMutation.mutate({ taskId, status: 'declined' });
  };

  const handleCompleteTask = (taskId: number) => {
    updateTaskMutation.mutate({ taskId, status: 'completed' });
  };

  return (
    <div className="container mx-auto py-4">
      <h1 className="text-2xl font-bold mb-6">Shared Calendar</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar" className="flex gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex gap-2">
            <CheckCircle className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex gap-2">
            <CalendarIcon2 className="h-4 w-4" />
            My Calendars
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border w-full"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Events'}
                    </CardTitle>
                    <CardDescription>
                      {allEvents.length} events scheduled
                    </CardDescription>
                  </div>
                  <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Add Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>New Event</DialogTitle>
                        <DialogDescription>
                          Add a new event to your calendar or create a task for your partner.
                        </DialogDescription>
                      </DialogHeader>

                      <Form {...eventForm}>
                        <form onSubmit={eventForm.handleSubmit(onSubmitEvent)} className="space-y-4">
                          <FormField
                            control={eventForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Event title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={eventForm.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      {...field} 
                                      value={format(field.value, 'yyyy-MM-dd')}
                                      onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : new Date();
                                        field.onChange(date);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={eventForm.control}
                              name="startTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={eventForm.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      {...field} 
                                      value={format(field.value, 'yyyy-MM-dd')}
                                      onChange={(e) => {
                                        const date = e.target.value ? new Date(e.target.value) : new Date();
                                        field.onChange(date);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={eventForm.control}
                              name="endTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={eventForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location (optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Event location" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={eventForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Event description" 
                                    className="min-h-24" 
                                    {...field} 
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={eventForm.control}
                            name="calendarId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Calendar</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(Number(value))}
                                  defaultValue={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a calendar" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="">Personal</SelectItem>
                                    {calendars.map(calendar => (
                                      <SelectItem key={calendar.id} value={calendar.id.toString()}>
                                        {calendar.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={eventForm.control}
                            name="visibility"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Visibility</FormLabel>
                                <Select 
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="private">
                                      <div className="flex items-center gap-2">
                                        <EyeOff className="h-4 w-4" />
                                        Private (only you)
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="partner">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Partner (you and your partner)
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="public">
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Public
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={eventForm.control}
                            name="assignToPartner"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Assign to Partner</FormLabel>
                                  <FormDescription>
                                    Create this as a task for your partner
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <div>
                                    <input
                                      type="checkbox"
                                      {...field}
                                      checked={field.value}
                                      onChange={(e) => {
                                        field.onChange(e.target.checked);
                                        if (e.target.checked) {
                                          eventForm.setValue('isTask', true);
                                        }
                                      }}
                                      className="sr-only"
                                      id="assign-to-partner"
                                    />
                                    <label
                                      htmlFor="assign-to-partner"
                                      className={`block h-6 w-11 rounded-full ${
                                        field.value ? 'bg-primary' : 'bg-muted'
                                      } transition-colors relative cursor-pointer`}
                                    >
                                      <span
                                        className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                                          field.value ? 'translate-x-5' : 'translate-x-1'
                                        } absolute top-0.5`}
                                      />
                                    </label>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {eventForm.watch('assignToPartner') && (
                            <>
                              <FormField
                                control={eventForm.control}
                                name="taskPriority"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Priority (0-5)</FormLabel>
                                    <FormControl>
                                      <Select 
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        defaultValue={field.value.toString()}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="0">Low (0)</SelectItem>
                                          <SelectItem value="1">1</SelectItem>
                                          <SelectItem value="2">2</SelectItem>
                                          <SelectItem value="3">3</SelectItem>
                                          <SelectItem value="4">4</SelectItem>
                                          <SelectItem value="5">High (5)</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={eventForm.control}
                                name="taskNotes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Notes for partner</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Additional notes for your partner" 
                                        className="min-h-24" 
                                        {...field} 
                                        value={field.value || ''}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              onClick={() => setIsNewEventDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createEventMutation.isPending}>
                              {createEventMutation.isPending ? "Creating..." : "Create Event"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="h-[400px] overflow-y-auto">
                  {isLoadingEvents || isLoadingPartnerEvents ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : allEvents.length > 0 ? (
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-4">
                        {allEvents
                          .sort((a, b) => {
                            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                          })
                          .map(event => {
                            const calendar = getCalendarById(event.calendarId);
                            const isPartnerEvent = partnerEvents.some(pe => pe.id === event.id);
                            const task = tasks.find(task => task.eventId === event.id);
                            
                            return (
                              <Card 
                                key={event.id} 
                                className={`cursor-pointer overflow-hidden transition-all hover:shadow-md relative ${
                                  isPartnerEvent ? 'border-l-4 border-l-blue-400' : 'border-l-4'
                                }`}
                                style={{ 
                                  borderLeftColor: calendar?.color || (isPartnerEvent ? '#60a5fa' : '#f43f5e')
                                }}
                                onClick={() => setSelectedEventId(event.id)}
                              >
                                <div className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h3 className="font-medium">{event.title}</h3>
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(parseISO(event.startTime), 'h:mm a')} - {format(parseISO(event.endTime), 'h:mm a')}
                                      </p>
                                    </div>
                                    {event.isTask && (
                                      <Badge variant="outline" className="ml-2">
                                        {task ? getStatusBadge(task.status) : 'Task'}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {(event.location || calendar) && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {event.location && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {event.location}
                                        </Badge>
                                      )}
                                      {calendar && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <CalendarIcon className="h-3 w-3" />
                                          {calendar.name}
                                        </Badge>
                                      )}
                                      {event.visibility !== 'public' && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          {event.visibility === 'private' ? (
                                            <><EyeOff className="h-3 w-3" /> Private</>
                                          ) : (
                                            <><Eye className="h-3 w-3" /> Partner</>
                                          )}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </Card>
                            );
                          })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mb-4" />
                      <p>No events scheduled for this day.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsNewEventDialogOpen(true)}
                      >
                        Create Event
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks assigned to you */}
            <Card>
              <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>
                  Tasks assigned to you by your partner
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] overflow-y-auto">
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                      {tasks
                        .filter(task => task.assigneeId === user?.id)
                        .sort((a, b) => {
                          // Sort by status first (pending first, then by due date)
                          if (a.status !== b.status) {
                            if (a.status === 'pending') return -1;
                            if (b.status === 'pending') return 1;
                          }
                          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                        })
                        .map(task => {
                          const event = allEvents.find(e => e.id === task.eventId);
                          if (!event) return null;
                          
                          return (
                            <Card key={task.id} className="overflow-hidden">
                              <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-medium">{event.title}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Due: {format(parseISO(task.dueDate), 'MMM d, h:mm a')}
                                    </p>
                                    {task.notes && (
                                      <p className="text-sm mt-2 text-muted-foreground">{task.notes}</p>
                                    )}
                                  </div>
                                  <div>{getStatusBadge(task.status)}</div>
                                </div>
                                
                                {task.status === 'pending' && (
                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleDeclineTask(task.id)}
                                    >
                                      Decline
                                    </Button>
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={() => handleAcceptTask(task.id)}
                                    >
                                      Accept
                                    </Button>
                                  </div>
                                )}
                                
                                {task.status === 'accepted' && (
                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={() => handleCompleteTask(task.id)}
                                    >
                                      Mark as Complete
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                        
                      {tasks.filter(task => task.assigneeId === user?.id).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mb-4" />
                          <p>No tasks assigned to you</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
            
            {/* Tasks you've assigned */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Tasks</CardTitle>
                <CardDescription>
                  Tasks you've assigned to your partner
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] overflow-y-auto">
                {isLoadingTasks ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                      {tasks
                        .filter(task => task.assignerId === user?.id && task.assigneeId !== user?.id)
                        .sort((a, b) => {
                          if (a.status !== b.status) {
                            if (a.status === 'pending') return -1;
                            if (b.status === 'pending') return 1;
                          }
                          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                        })
                        .map(task => {
                          const event = allEvents.find(e => e.id === task.eventId);
                          if (!event) return null;
                          
                          return (
                            <Card key={task.id} className="overflow-hidden">
                              <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-medium">{event.title}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Due: {format(parseISO(task.dueDate), 'MMM d, h:mm a')}
                                    </p>
                                    {task.notes && (
                                      <p className="text-sm mt-2 text-muted-foreground">{task.notes}</p>
                                    )}
                                  </div>
                                  <div>{getStatusBadge(task.status)}</div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                        
                      {tasks.filter(task => task.assignerId === user?.id && task.assigneeId !== user?.id).length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                          <Tag className="h-12 w-12 mb-4" />
                          <p>No tasks assigned to your partner</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => {
                              setActiveTab('calendar');
                              setIsNewEventDialogOpen(true);
                              eventForm.setValue('assignToPartner', true);
                            }}
                          >
                            Assign a Task
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calendar Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>My Calendars</CardTitle>
                    <CardDescription>
                      Manage your calendar connections
                    </CardDescription>
                  </div>
                  <Dialog open={isNewCalendarDialogOpen} onOpenChange={setIsNewCalendarDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Add Calendar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Calendar</DialogTitle>
                        <DialogDescription>
                          Connect a new calendar to your account
                        </DialogDescription>
                      </DialogHeader>

                      <Form {...calendarForm}>
                        <form onSubmit={calendarForm.handleSubmit(onSubmitCalendar)} className="space-y-4">
                          <FormField
                            control={calendarForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Calendar name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={calendarForm.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Type</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="personal">Personal</SelectItem>
                                      <SelectItem value="work">Work</SelectItem>
                                      <SelectItem value="family">Family</SelectItem>
                                      <SelectItem value="shared">Shared</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={calendarForm.control}
                              name="provider"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Provider</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="manual">Manual</SelectItem>
                                      <SelectItem value="google">Google Calendar</SelectItem>
                                      <SelectItem value="apple">Apple Calendar</SelectItem>
                                      <SelectItem value="outlook">Outlook</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={calendarForm.control}
                            name="visibility"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Visibility</FormLabel>
                                <Select 
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="private">
                                      <div className="flex items-center gap-2">
                                        <EyeOff className="h-4 w-4" />
                                        Private (only you)
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="partner">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Partner (you and your partner)
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="public">
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Public
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={calendarForm.control}
                            name="color"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Color</FormLabel>
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="h-8 w-8 rounded-md border"
                                      style={{ backgroundColor: field.value }}
                                    />
                                    <Input 
                                      type="text" 
                                      placeholder="#RRGGBB" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Enter a hex color code (e.g., #FF5733)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              onClick={() => setIsNewCalendarDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createCalendarMutation.isPending}>
                              {createCalendarMutation.isPending ? "Adding..." : "Add Calendar"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {isLoadingCalendars ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : calendars.length > 0 ? (
                    <div className="space-y-4">
                      {calendars.map(calendar => (
                        <Card key={calendar.id} className="overflow-hidden">
                          <div className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div 
                                className="h-6 w-6 rounded-full"
                                style={{ backgroundColor: calendar.color }}
                              />
                              <div>
                                <h3 className="font-medium">{calendar.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {calendar.type.charAt(0).toUpperCase() + calendar.type.slice(1)} • {
                                    calendar.provider.charAt(0).toUpperCase() + calendar.provider.slice(1)
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {calendar.visibility === 'private' 
                                  ? 'Private' 
                                  : calendar.visibility === 'partner' 
                                    ? 'Partner' 
                                    : 'Public'}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mb-4" />
                      <p>No calendars connected</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsNewCalendarDialogOpen(true)}
                      >
                        Add Your First Calendar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Calendar Privacy</CardTitle>
                  <CardDescription>
                    Control what your partner can see
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <h3 className="font-medium">Default Visibility</h3>
                    <Select defaultValue="partner">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private (only you)</SelectItem>
                        <SelectItem value="partner">Partner (you and your partner)</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      New events will use this visibility by default
                    </p>
                  </div>
                  
                  <div className="flex flex-col space-y-2 pt-4">
                    <h3 className="font-medium">Partner Access</h3>
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="allow-partner-edit" className="flex flex-col">
                        <span>Allow partner to edit events</span>
                        <span className="font-normal text-sm text-muted-foreground">
                          Partner can modify shared events
                        </span>
                      </Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="allow-partner-edit"
                          className="sr-only"
                          defaultChecked
                        />
                        <label
                          htmlFor="allow-partner-edit"
                          className="block h-6 w-11 rounded-full bg-primary transition-colors relative cursor-pointer"
                        >
                          <span className="block h-5 w-5 rounded-full bg-white transition-transform translate-x-5 absolute top-0.5" />
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEventId} onOpenChange={(open) => !open && setSelectedEventId(null)}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {format(parseISO(selectedEvent.startTime), 'EEEE, MMMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(parseISO(selectedEvent.startTime), 'h:mm a')} - {format(parseISO(selectedEvent.endTime), 'h:mm a')}
                  </span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
                
                {selectedEventTask && (
                  <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Task Status</h4>
                      {getStatusBadge(selectedEventTask.status)}
                    </div>
                    
                    {selectedEventTask.notes && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Notes</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {selectedEventTask.notes}
                        </p>
                      </div>
                    )}
                    
                    {selectedEventTask.assigneeId === user?.id && selectedEventTask.status === 'pending' && (
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            handleDeclineTask(selectedEventTask.id);
                            setSelectedEventId(null);
                          }}
                        >
                          Decline
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => {
                            handleAcceptTask(selectedEventTask.id);
                            setSelectedEventId(null);
                          }}
                        >
                          Accept
                        </Button>
                      </div>
                    )}
                    
                    {selectedEventTask.assigneeId === user?.id && selectedEventTask.status === 'accepted' && (
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => {
                            handleCompleteTask(selectedEventTask.id);
                            setSelectedEventId(null);
                          }}
                        >
                          Mark as Complete
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="secondary" onClick={() => setSelectedEventId(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}