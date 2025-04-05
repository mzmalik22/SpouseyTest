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
          <div className="h-10 w-10 rounded-full border border-emotion-peaceful bg-muted flex items-center justify-center mr-3">
            <i className="fas fa-lightbulb text-emotion-peaceful"></i>
          </div>
        );
      case "message":
        return (
          <div className="h-10 w-10 rounded-full border border-emotion-happy bg-muted flex items-center justify-center mr-3">
            <i className="fas fa-comment text-emotion-happy"></i>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full border border-muted-foreground bg-muted flex items-center justify-center mr-3">
            <i className="fas fa-bell text-muted-foreground"></i>
          </div>
        );
    }
  };

  const getTimeAgo = () => {
    if (!activity.timestamp) return "Just now";
    return formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
  };

  return (
    <div className="border-b border-border/30 py-4 last:border-b-0 last:pb-0">
      <div className="flex items-start">
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{activity.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {activity.type === "coaching" ? "Check out your coaching section" : ""}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">{getTimeAgo()}</div>
      </div>
    </div>
  );
}
