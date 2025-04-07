import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, Sparkles, Calendar, MessageSquare, Heart } from "lucide-react";
import { RadarInsight, RadarInsightType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function RelationshipRadar() {
  const { toast } = useToast();
  const [selectedInsight, setSelectedInsight] = useState<RadarInsight | null>(null);
  
  const { 
    data: insights,
    isLoading,
    error
  } = useQuery<RadarInsight[]>({
    queryKey: ['/api/relationship-radar'],
    retry: 1,
    refetchOnWindowFocus: false,
    gcTime: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Set the first insight as selected by default when data loads
  useEffect(() => {
    if (insights && insights.length > 0 && !selectedInsight) {
      setSelectedInsight(insights[0]);
    }
  }, [insights, selectedInsight]);
  
  // Error handling
  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            Relationship Radar
          </CardTitle>
          <CardDescription>
            Unable to load insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We couldn't generate relationship insights at this time. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-primary/80" />
            Relationship Radar
          </CardTitle>
          <CardDescription>
            Analyzing your relationship data...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        </CardContent>
      </Card>
    );
  }
  
  // No insights available
  if (!insights || insights.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-primary/80" />
            Relationship Radar
          </CardTitle>
          <CardDescription>
            Not enough data yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Continue using the app to get personalized relationship insights.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Helper function to get icon based on insight type
  const getInsightIcon = (type: RadarInsightType | string) => {
    switch (type) {
      case RadarInsightType.MESSAGE_TONE:
        return <MessageSquare className="w-5 h-5 mr-2" />;
      case RadarInsightType.CALENDAR_STRESS:
        return <Calendar className="w-5 h-5 mr-2" />;
      case RadarInsightType.RELATIONSHIP_HEALTH:
        return <Heart className="w-5 h-5 mr-2" />;
      case RadarInsightType.COMMUNICATION_TIP:
        return <Sparkles className="w-5 h-5 mr-2" />;
      default:
        return <Sparkles className="w-5 h-5 mr-2" />;
    }
  };
  
  // Helper function to get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/10 hover:bg-red-500/20 text-red-500';
      case 'medium':
        return 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500';
      case 'low':
        return 'bg-green-500/10 hover:bg-green-500/20 text-green-500';
      default:
        return 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-500';
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-primary/80" />
          Relationship Radar
        </CardTitle>
        <CardDescription>
          AI-powered insights for your relationship
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Insight selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {insights.map((insight, i) => (
            <Button
              key={i}
              variant="ghost"
              className={cn(
                "h-auto py-1.5 text-xs justify-start font-normal", 
                selectedInsight === insight ? "bg-muted" : ""
              )}
              onClick={() => setSelectedInsight(insight)}
            >
              {getInsightIcon(insight.type)}
              <span className="truncate">{insight.title}</span>
            </Button>
          ))}
        </div>
        
        {/* Selected insight detail */}
        {selectedInsight && (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-base">{selectedInsight.title}</h3>
              <Badge variant="outline" className={getSeverityColor(selectedInsight.severity)}>
                {selectedInsight.severity === 'high' ? 'Important' : 
                 selectedInsight.severity === 'medium' ? 'Notice' : 'Info'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{selectedInsight.description}</p>
            {selectedInsight.actionItem && (
              <div className="bg-primary/5 p-3 rounded-md mt-2">
                <p className="text-sm font-medium">{selectedInsight.actionItem}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}