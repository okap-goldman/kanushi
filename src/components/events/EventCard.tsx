import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Clock, MapPin, Globe, Users, DollarSign } from "lucide-react";
import { Event, eventService } from "../../lib/eventService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Spinner } from "../ui/spinner";
import { cn } from "../../lib/utils";
import { toast } from "../ui/use-toast";
import { useAuth } from "../../context/AuthContext";

interface EventCardProps {
  event: Event;
  variant?: "default" | "compact";
  onParticipationChange?: () => void;
}

export default function EventCard({ 
  event, 
  variant = "default",
  onParticipationChange 
}: EventCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [participationStatus, setParticipationStatus] = useState<'attending' | 'interested' | null>(
    event.user_participation_status === 'attending' || event.user_participation_status === 'interested' 
      ? event.user_participation_status 
      : null
  );

  const isCompact = variant === "compact";
  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);
  const isSameDay = startDate.toDateString() === endDate.toDateString();
  
  // Format price display
  const priceDisplay = event.price > 0 
    ? `${event.price.toLocaleString()} ${event.currency}` 
    : "Free";

  // Format location or online details
  const locationDisplay = event.is_online 
    ? "Online Event" 
    : (event.location || "Location not specified");

  // Get avatar initials from creator name
  const creatorName = event.creator_profile?.display_name || event.creator_profile?.username || "Unknown";
  const creatorInitials = creatorName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Handle navigation to event detail
  const handleNavigateToEvent = () => {
    navigate(`/events/${event.id}`);
  };

  // Handle joining event
  const handleJoinEvent = async (status: 'attending' | 'interested') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join events",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      // If already in this status, leave the event
      if (participationStatus === status) {
        const { success, error } = await eventService.leaveEvent(event.id);
        if (error) throw new Error(error.message);
        
        if (success) {
          setParticipationStatus(null);
          toast({
            title: "Left event",
            description: "You have been removed from this event",
          });
        }
      } else {
        // Otherwise, join/update status
        const { participation, error } = await eventService.joinEvent(event.id, status);
        if (error) throw new Error(error.message);
        
        if (participation) {
          setParticipationStatus(status);
          toast({
            title: status === 'attending' ? "Joined event" : "Marked as interested",
            description: status === 'attending' 
              ? "You are now attending this event" 
              : "You've marked this event as interesting",
          });
        }
      }
      
      // Notify parent component if callback provided
      if (onParticipationChange) {
        onParticipationChange();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event participation",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-md",
        isCompact ? "max-w-[300px]" : "w-full"
      )}
    >
      {event.cover_image_url && (
        <div 
          className={cn(
            "w-full bg-cover bg-center",
            isCompact ? "h-36" : "h-48"
          )}
          style={{ backgroundImage: `url(${event.cover_image_url})` }}
          onClick={handleNavigateToEvent}
        />
      )}
      
      <CardHeader className={cn(isCompact ? "p-4" : "p-6")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant={event.price > 0 ? "default" : "outline"}>
              {priceDisplay}
            </Badge>
            {event.category && (
              <Badge variant="secondary">
                {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
              </Badge>
            )}
          </div>
          
          {participationStatus && (
            <Badge variant={participationStatus === 'attending' ? "default" : "outline"}>
              {participationStatus === 'attending' ? "Attending" : "Interested"}
            </Badge>
          )}
        </div>
        
        <CardTitle 
          className={cn(
            "cursor-pointer hover:text-primary transition-colors",
            isCompact ? "text-lg" : "text-xl"
          )}
          onClick={handleNavigateToEvent}
        >
          {event.title}
        </CardTitle>
        
        <CardDescription className="flex items-center gap-1 mt-1">
          <CalendarIcon className="h-4 w-4" />
          {format(startDate, "PPP")}
          {!isSameDay && ` - ${format(endDate, "PPP")}`}
        </CardDescription>
        
        <CardDescription className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {format(startDate, "p")} - {format(endDate, "p")}
        </CardDescription>
        
        <CardDescription className="flex items-center gap-1">
          {event.is_online ? (
            <Globe className="h-4 w-4" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          {locationDisplay}
        </CardDescription>
        
        {event.max_participants && (
          <CardDescription className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {event.participant_count ? `${event.participant_count} / ${event.max_participants}` : `0 / ${event.max_participants}`} participants
          </CardDescription>
        )}
      </CardHeader>
      
      {!isCompact && event.description && (
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        </CardContent>
      )}
      
      <CardFooter className={cn(
        "flex items-center justify-between border-t bg-muted/50 p-4",
        isCompact ? "text-xs" : "text-sm"
      )}>
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={event.creator_profile?.avatar_url || ""} />
            <AvatarFallback>{creatorInitials}</AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground">
            {creatorName}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size={isCompact ? "sm" : "default"}
            onClick={() => handleJoinEvent('interested')}
            disabled={isJoining}
            className={cn(participationStatus === 'interested' && "border-primary text-primary")}
          >
            {isJoining && <Spinner className="mr-2 h-4 w-4" />}
            Interested
          </Button>
          <Button 
            variant="default" 
            size={isCompact ? "sm" : "default"}
            onClick={() => handleJoinEvent('attending')}
            disabled={isJoining}
            className={cn(participationStatus === 'attending' && "bg-green-600 hover:bg-green-700")}
          >
            {isJoining && <Spinner className="mr-2 h-4 w-4" />}
            {participationStatus === 'attending' ? "Attending" : "Attend"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}