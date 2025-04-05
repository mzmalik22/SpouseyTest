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
        <div key={content.id} className="border border-border rounded-xl p-4">
          <h4 className="font-medium text-white mb-2">{content.title}</h4>
          <p className="text-sm text-muted-foreground mb-4">Try this simple exercise with your partner to improve skills.</p>
          
          <div className="bg-muted-foreground/10 p-4 rounded-xl mb-4">
            <div className="text-sm text-white whitespace-pre-line">{content.content}</div>
          </div>
          
          <Button className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium rounded-xl text-black bg-emotion-peaceful hover:bg-emotion-peaceful/90 focus:outline-none focus:ring-2 focus:ring-emotion-peaceful">
            Mark as Complete
          </Button>
        </div>
      );
    }
    
    // Introduction content has special styling
    if (content.title.toLowerCase().includes("introduction")) {
      return (
        <div key={content.id} className="bg-muted-foreground/10 p-4 rounded-xl">
          <p className="text-white">{content.content}</p>
        </div>
      );
    }
    
    // Regular content items (strategies, tips, etc.)
    return (
      <div key={content.id} className="border-l-4 border-emotion-peaceful pl-4 py-1">
        <h5 className="font-medium text-white">{content.title}</h5>
        <p className="text-sm text-muted-foreground mt-1">{content.content}</p>
      </div>
    );
  };

  return (
    <div className="bg-muted rounded-2xl border border-border p-6">
      <h3 className="text-lg font-medium text-white mb-1">{topic.title}</h3>
      <p className="text-muted-foreground text-sm mb-6">{topic.description}</p>
      
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
              <h4 className="font-medium text-white mb-3">Key Strategies</h4>
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
        <div className="border-t border-border pt-4">
          <h4 className="font-medium text-white mb-2">Continue Your Journey</h4>
          <p className="text-sm text-muted-foreground mb-3">Ready to explore more ways to strengthen your relationship?</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-border text-sm font-medium rounded-xl text-white bg-muted hover:bg-muted-foreground/10 focus:outline-none focus:ring-2 focus:ring-emotion-peaceful"
              disabled={!previousTopic}
              onClick={() => previousTopic && setLocation(`/coaching/${previousTopic.id}`)}
            >
              <i className="fas fa-arrow-left mr-2"></i> Previous Topic
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-border text-sm font-medium rounded-xl text-white bg-muted hover:bg-muted-foreground/10 focus:outline-none focus:ring-2 focus:ring-emotion-peaceful"
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
