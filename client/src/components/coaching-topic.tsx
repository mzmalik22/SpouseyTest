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
          ${isActive ? "bg-primary bg-opacity-10 border border-primary border-opacity-25" : "hover:bg-neutral-50"}
          focus:outline-none focus:ring-2 focus:ring-primary`}
      >
        <i className={`fas ${topic.icon} text-primary mr-3`}></i>
        <span className="text-sm font-medium text-neutral-800">{topic.title}</span>
      </button>
    </li>
  );
}
