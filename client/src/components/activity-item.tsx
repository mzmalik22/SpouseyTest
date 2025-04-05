import { formatDistanceToNow } from "date-fns";
import { Activity } from "@/lib/types";

interface ActivityItemProps {
  activity: Activity;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.type) {
      case "coaching":
        return (
          <div className="h-10 w-10 rounded-full bg-purple-500 bg-opacity-20 flex items-center justify-center mr-3">
            <i className="fas fa-lightbulb text-purple-500"></i>
          </div>
        );
      case "message":
        return (
          <div className="h-10 w-10 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mr-3">
            <i className="fas fa-comment text-primary"></i>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-300 bg-opacity-20 flex items-center justify-center mr-3">
            <i className="fas fa-bell text-gray-500"></i>
          </div>
        );
    }
  };

  const getTimeAgo = () => {
    if (!activity.timestamp) return "Just now";
    return formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
  };

  return (
    <div className="border-b border-neutral-100 py-4 last:border-b-0 last:pb-0">
      <div className="flex items-start">
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-800">{activity.description}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {activity.type === "coaching" ? "Check out your coaching section" : ""}
          </p>
        </div>
        <div className="text-xs text-neutral-500">{getTimeAgo()}</div>
      </div>
    </div>
  );
}
