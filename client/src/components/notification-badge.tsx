import React from 'react';
import { useQuery } from '@tanstack/react-query';

type NotificationBadgeProps = {
  endpoint: string;
  className?: string;
  hideWhenZero?: boolean;
};

interface CountResponse {
  count: number;
}

export default function NotificationBadge({ 
  endpoint, 
  className = '',
  hideWhenZero = true 
}: NotificationBadgeProps) {
  const { data, isLoading, error } = useQuery<CountResponse>({
    queryKey: [endpoint],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const count = data?.count || 0;

  if (isLoading || error || (hideWhenZero && count === 0)) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold ${className}`}>
      {count > 99 ? '99+' : count}
    </div>
  );
}