import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import NotificationBadge from './notification-badge';

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: open, // Only fetch when dropdown is open
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    },
  });

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('POST', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  // Dismiss notification mutation
  const dismissNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('POST', `/api/notifications/${id}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to dismiss notification',
        variant: 'destructive',
      });
    },
  });

  // Handle dropdown open/close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  // Format time to relative format (e.g., "2 hours ago")
  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get icon and color based on notification type
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'message':
        return { bgColor: 'bg-blue-100', textColor: 'text-blue-600' };
      case 'activity':
        return { bgColor: 'bg-green-100', textColor: 'text-green-600' };
      case 'coaching':
        return { bgColor: 'bg-purple-100', textColor: 'text-purple-600' };
      case 'partner':
        return { bgColor: 'bg-pink-100', textColor: 'text-pink-600' };
      case 'system':
        return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' };
      default:
        return { bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1">
            <NotificationBadge endpoint="/api/notifications/unread-count" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.some((n: Notification) => !n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notifications</div>
          ) : (
            notifications.map((notification: Notification) => {
              const { bgColor, textColor } = getNotificationStyle(notification.type);
              return (
                <div 
                  key={notification.id} 
                  className={`p-3 border-b ${!notification.read ? 'bg-gray-50' : ''} hover:bg-gray-100 transition-colors relative`}
                >
                  <div className="flex gap-3 mb-1">
                    <div className={`rounded-full w-2 h-2 mt-2 ${!notification.read ? 'bg-red-500' : 'bg-transparent'}`} />
                    <div className="flex-1">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-gray-600">{notification.content}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                      >
                        <Check size={14} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => dismissNotificationMutation.mutate(notification.id)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}