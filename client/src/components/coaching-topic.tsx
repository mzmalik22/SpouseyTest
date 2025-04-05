import { CoachingTopic } from "@/lib/types";

interface CoachingTopicProps {
  topic: CoachingTopic;
  isActive: boolean;
  onClick: (topic: CoachingTopic) => void;
}

export default function CoachingTopicItem({ topic, isActive, onClick }: CoachingTopicProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onClick(topic)}
        className={`w-full flex items-center px-3 py-2 text-left rounded-xl
          ${isActive ? "bg-emotion-peaceful bg-opacity-20 border border-emotion-peaceful border-opacity-40" : "hover:bg-muted-foreground/5"}
          focus:outline-none focus:ring-2 focus:ring-emotion-peaceful`}
      >
        <i className={`fas ${topic.icon} text-emotion-peaceful mr-3`}></i>
        <span className="text-sm font-medium text-white">{topic.title}</span>
      </button>
    </li>
  );
}
