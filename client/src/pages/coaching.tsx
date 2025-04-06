import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import CoachingTopicItem from "@/components/coaching-topic";
import CoachingContentView from "@/components/coaching-content";
import { CoachingTopic } from "@/lib/types";

export default function Coaching() {
  const { user } = useAuth();
  const params = useParams();
  const topicId = params.id ? parseInt(params.id) : null;
  const [location, setLocation] = useLocation();
  
  // Fetch all coaching topics
  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ["/api/coaching/topics"],
    enabled: !!user,
  });
  
  // Fetch specific topic content when a topic is selected
  const { data: topicContent, isLoading: contentLoading } = useQuery({
    queryKey: [`/api/coaching/topics/${topicId}`],
    enabled: !!topicId,
  });
  
  // Initialize with first topic if none selected
  useEffect(() => {
    if (!topicId && topics && topics.length > 0) {
      setLocation(`/coaching/${topics[0].id}`);
    }
  }, [topics, topicId, setLocation]);
  
  // Get previous and next topics for navigation
  const getAdjacentTopics = () => {
    if (!topics || topics.length === 0 || !topicId) return { prev: undefined, next: undefined };
    
    const currentIndex = topics.findIndex((t: CoachingTopic) => t.id === topicId);
    if (currentIndex === -1) return { prev: undefined, next: undefined };
    
    return {
      prev: currentIndex > 0 ? topics[currentIndex - 1] : undefined,
      next: currentIndex < topics.length - 1 ? topics[currentIndex + 1] : undefined,
    };
  };
  
  const { prev: previousTopic, next: nextTopic } = getAdjacentTopics();
  
  const handleTopicClick = (topic: CoachingTopic) => {
    setLocation(`/coaching/${topic.id}`);
  };

  return (
    <div className="h-full min-h-screen flex flex-col bg-black">
      <Navbar />
      
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center mb-6">
          <Link href="/">
            <a className="mr-4 text-muted-foreground hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Link>
          <h2 className="text-xl font-semibold text-white">Relationship Coaching</h2>
        </div>
        
        {/* Loading State */}
        {(topicsLoading || (contentLoading && topicId)) && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emotion-peaceful"></div>
          </div>
        )}
        
        {/* Coaching Content */}
        {!topicsLoading && topics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Topic Selection Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-muted rounded-2xl border border-border p-4">
                <h3 className="font-medium text-white mb-4">Coaching Topics</h3>
                
                <ul className="space-y-2">
                  {topics.map((topic: CoachingTopic) => (
                    <CoachingTopicItem
                      key={topic.id}
                      topic={topic}
                      isActive={topicId === topic.id}
                      onClick={handleTopicClick}
                    />
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Coaching Content Area */}
            <div className="md:col-span-2">
              {topicContent && topicId ? (
                <CoachingContentView
                  topic={topicContent.topic}
                  contents={topicContent.contents}
                  previousTopic={previousTopic}
                  nextTopic={nextTopic}
                />
              ) : !contentLoading && (
                <div className="bg-muted rounded-2xl border border-border p-6 text-center">
                  <p className="text-muted-foreground">Select a topic from the sidebar to view content.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
