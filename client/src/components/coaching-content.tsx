import { CoachingTopic, CoachingContent } from "@/lib/types";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Link, useLocation } from "wouter";

interface CoachingContentProps {
  topic: CoachingTopic;
  contents: CoachingContent[];
  previousTopic?: CoachingTopic;
  nextTopic?: CoachingTopic;
}

export default function CoachingContentView({ topic, contents, previousTopic, nextTopic }: CoachingContentProps) {
  const [location, setLocation] = useLocation();

  const renderContent = (content: CoachingContent) => {
    // Special case for practice exercise
    if (content.title.toLowerCase().includes("practice")) {
      return (
        <div key={content.id} className="border border-neutral-200 rounded-xl p-4">
          <h4 className="font-medium text-neutral-800 mb-2">{content.title}</h4>
          <p className="text-sm text-neutral-500 mb-4">Try this simple exercise with your partner to improve skills.</p>
          
          <div className="bg-neutral-50 p-4 rounded-xl mb-4">
            <div className="text-sm text-neutral-800 whitespace-pre-line">{content.content}</div>
          </div>
          
          <Button className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Mark as Complete
          </Button>
        </div>
      );
    }
    
    // Introduction content has special styling
    if (content.title.toLowerCase().includes("introduction")) {
      return (
        <div key={content.id} className="bg-neutral-50 p-4 rounded-xl">
          <p className="text-neutral-800">{content.content}</p>
        </div>
      );
    }
    
    // Regular content items (strategies, tips, etc.)
    return (
      <div key={content.id} className="border-l-4 border-primary pl-4 py-1">
        <h5 className="font-medium text-neutral-800">{content.title}</h5>
        <p className="text-sm text-neutral-500 mt-1">{content.content}</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-medium text-neutral-800 mb-1">{topic.title}</h3>
      <p className="text-neutral-500 text-sm mb-6">{topic.description}</p>
      
      <div className="space-y-6">
        {/* Group contents by type */}
        <div className="space-y-6">
          {/* Introduction - first item */}
          {contents.filter(c => c.title.toLowerCase().includes("introduction")).map(renderContent)}
          
          {/* Key Strategies/Tips Section */}
          {contents.filter(c => 
            !c.title.toLowerCase().includes("introduction") && 
            !c.title.toLowerCase().includes("practice")
          ).length > 0 && (
            <div>
              <h4 className="font-medium text-neutral-800 mb-3">Key Strategies</h4>
              <div className="space-y-4">
                {contents
                  .filter(c => 
                    !c.title.toLowerCase().includes("introduction") && 
                    !c.title.toLowerCase().includes("practice")
                  )
                  .map(renderContent)}
              </div>
            </div>
          )}
          
          {/* Practice Exercise - usually last */}
          {contents.filter(c => c.title.toLowerCase().includes("practice")).map(renderContent)}
        </div>
        
        {/* Navigation */}
        <div className="border-t border-neutral-200 pt-4">
          <h4 className="font-medium text-neutral-800 mb-2">Continue Your Journey</h4>
          <p className="text-sm text-neutral-500 mb-3">Ready to explore more ways to strengthen your relationship?</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-neutral-200 text-sm font-medium rounded-xl text-neutral-800 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={!previousTopic}
              onClick={() => previousTopic && setLocation(`/coaching/${previousTopic.id}`)}
            >
              <i className="fas fa-arrow-left mr-2"></i> Previous Topic
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-neutral-200 text-sm font-medium rounded-xl text-neutral-800 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={!nextTopic}
              onClick={() => nextTopic && setLocation(`/coaching/${nextTopic.id}`)}
            >
              Next Topic <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
