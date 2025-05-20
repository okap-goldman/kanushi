import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { CalendarIcon, Clock, MapPin, Globe, Users, DollarSign, Share2, Edit, Trash2, ArrowLeft, MessageCircle, Heart, Check, X } from "lucide-react";

import { eventService } from "../lib/eventService";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Spinner } from "../components/ui/spinner";
import { toast } from "../components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Textarea } from "../components/ui/textarea";

import Navbar from "../components/Navbar";
import FooterNav from "../components/FooterNav";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<"details" | "participants" | "discussion">("details");
  const [commentText, setCommentText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [joiningStatus, setJoiningStatus] = useState<"idle" | "joining" | "interested">("idle");
  
  // Fetch event details
  const eventQuery = useQuery({
    queryKey: ["event", id],
    queryFn: () => eventService.getEvent(id!),
    enabled: !!id,
  });

  // Fetch event participants
  const participantsQuery = useQuery({
    queryKey: ["event-participants", id],
    queryFn: () => eventService.getEventParticipants(id!),
    enabled: !!id && activeTab === "participants",
  });

  // Fetch event comments
  const commentsQuery = useQuery({
    queryKey: ["event-comments", id],
    queryFn: () => eventService.getEventComments(id!),
    enabled: !!id && activeTab === "discussion",
  });

  // Join/leave event mutation
  const joinEventMutation = useMutation({
    mutationFn: ({ status }: { status: 'attending' | 'interested' }) => {
      return eventService.joinEvent(id!, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["event-participants", id] });
    },
  });

  // Leave event mutation
  const leaveEventMutation = useMutation({
    mutationFn: () => {
      return eventService.leaveEvent(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["event-participants", id] });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => {
      return eventService.addEventComment(id!, content);
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["event-comments", id] });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: () => {
      return eventService.deleteEvent(id!);
    },
    onSuccess: () => {
      toast({
        title: "Event deleted",
        description: "The event has been permanently deleted",
      });
      navigate("/events");
    },
  });

  const event = eventQuery.data?.event;
  const error = eventQuery.data?.error;
  const participants = participantsQuery.data?.participants || [];
  const comments = commentsQuery.data?.comments || [];

  // Check if user is the event creator
  const isCreator = user && event?.created_by === user.id;

  // Handle join/leave event
  const handleEventParticipation = async (status: 'attending' | 'interested' | 'leave') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join events",
        variant: "destructive",
      });
      return;
    }

    try {
      if (status === 'leave') {
        setJoiningStatus("idle");
        await leaveEventMutation.mutateAsync();
        toast({
          title: "Left event",
          description: "You've been removed from the participants list",
        });
      } else {
        setJoiningStatus(status === 'attending' ? "joining" : "interested");
        await joinEventMutation.mutateAsync({ status });
        toast({
          title: status === 'attending' ? "Joined event" : "Marked as interested",
          description: status === 'attending' 
            ? "You are now attending this event" 
            : "You've marked interest in this event",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event participation",
        variant: "destructive",
      });
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      await addCommentMutation.mutateAsync(commentText);
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  // Handle delete event
  const handleDeleteEvent = async () => {
    try {
      await deleteEventMutation.mutateAsync();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Handle share event
  const handleShareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || "Event",
        text: `Check out this event: ${event?.title}`,
        url: window.location.href,
      }).catch(() => {
        // Fallback if share failed
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Event link copied to clipboard",
        });
      });
    } else {
      // Fallback for browsers that don't support share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Event link copied to clipboard",
      });
    }
  };

  if (eventQuery.isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container max-w-4xl py-8 flex items-center justify-center">
          <Spinner className="h-8 w-8" />
        </main>
        <FooterNav />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container max-w-4xl py-8">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={() => navigate("/events")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          <div className="text-center p-12 border rounded-lg">
            <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error?.message || "The event you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => navigate("/events")}>
              View All Events
            </Button>
          </div>
        </main>
        <FooterNav />
      </div>
    );
  }

  // Format dates and times
  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);
  const isSameDayEvent = isSameDay(startDate, endDate);
  
  // Format date/time display
  const dateTimeDisplay = isSameDayEvent
    ? `${format(startDate, "PPP")} · ${format(startDate, "p")} - ${format(endDate, "p")}`
    : `${format(startDate, "PPP")} ${format(startDate, "p")} - ${format(endDate, "PPP")} ${format(endDate, "p")}`;

  // Registration deadline display
  const registrationDeadlineDisplay = event.registration_deadline
    ? `Registration closes on ${format(new Date(event.registration_deadline), "PPP")}`
    : "No registration deadline";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Event cover image */}
        {event.cover_image_url ? (
          <div 
            className="w-full h-64 sm:h-80 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${event.cover_image_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
          </div>
        ) : (
          <div className="w-full h-32 bg-muted"></div>
        )}
        
        <div className="container max-w-4xl py-6">
          {/* Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/events")}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleShareEvent}
                size="sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              {isCreator && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/events/${event.id}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Event
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive" 
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Event title and status badges */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {event.category && (
                <Badge variant="secondary">
                  {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                </Badge>
              )}
              
              <Badge variant={event.price > 0 ? "default" : "outline"}>
                {event.price > 0 ? `${event.price.toLocaleString()} ${event.currency}` : "Free"}
              </Badge>
              
              {event.is_cancelled && (
                <Badge variant="destructive">Cancelled</Badge>
              )}
              
              {new Date(event.start_datetime) < new Date() && new Date(event.end_datetime) > new Date() && (
                <Badge variant="default" className="bg-green-600">Happening Now</Badge>
              )}
              
              {new Date(event.end_datetime) < new Date() && (
                <Badge variant="secondary">Ended</Badge>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold">{event.title}</h1>
          </div>
          
          {/* Event creator */}
          <div className="flex items-center gap-2 mb-6">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={event.creator_profile?.avatar_url || ""} 
                alt={event.creator_profile?.display_name || event.creator_profile?.username || ""}
              />
              <AvatarFallback>
                {(event.creator_profile?.display_name || event.creator_profile?.username || "U")
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {event.creator_profile?.display_name || event.creator_profile?.username || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground">Organizer</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            {/* Check if event is in the past */}
            {new Date(event.end_datetime) < new Date() ? (
              <Button disabled className="flex-1 sm:flex-none">
                Event has ended
              </Button>
            ) : event.is_cancelled ? (
              <Button disabled className="flex-1 sm:flex-none">
                Event is cancelled
              </Button>
            ) : isCreator ? (
              <Button variant="outline" className="flex-1 sm:flex-none" disabled>
                You're the organizer
              </Button>
            ) : (
              <>
                {event.user_participation_status === 'attending' ? (
                  <Button 
                    variant="default" 
                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                    onClick={() => handleEventParticipation('leave')}
                    disabled={leaveEventMutation.isPending}
                  >
                    {leaveEventMutation.isPending ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Attending • Cancel
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 sm:flex-none"
                    onClick={() => handleEventParticipation('attending')}
                    disabled={joinEventMutation.isPending || joiningStatus === "joining"}
                  >
                    {joinEventMutation.isPending && joiningStatus === "joining" ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Attend
                  </Button>
                )}
                
                {event.user_participation_status === 'interested' ? (
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-primary text-primary"
                    onClick={() => handleEventParticipation('leave')}
                    disabled={leaveEventMutation.isPending}
                  >
                    {leaveEventMutation.isPending ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <Heart className="mr-2 h-4 w-4 fill-primary" />
                    )}
                    Interested • Remove
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none"
                    onClick={() => handleEventParticipation('interested')}
                    disabled={joinEventMutation.isPending || joiningStatus === "interested"}
                  >
                    {joinEventMutation.isPending && joiningStatus === "interested" ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <Heart className="mr-2 h-4 w-4" />
                    )}
                    Interested
                  </Button>
                )}
              </>
            )}
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as any)}>
            <TabsList className="w-full sm:w-auto mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="participants">
                Participants {participants.length > 0 && `(${participants.length})`}
              </TabsTrigger>
              <TabsTrigger value="discussion">
                Discussion {comments.length > 0 && `(${comments.length})`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              {/* Event time and location */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">Date and Time</h3>
                    <p>{dateTimeDisplay}</p>
                    {event.registration_deadline && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {registrationDeadlineDisplay}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  {event.is_online ? (
                    <Globe className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-medium">{event.is_online ? "Online Event" : "Location"}</h3>
                    <p>
                      {event.is_online 
                        ? (event.online_url || "Link will be provided to participants") 
                        : (event.location || "Location details not provided")}
                    </p>
                  </div>
                </div>
                
                {event.max_participants && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Capacity</h3>
                      <p>
                        {event.participant_count || 0} / {event.max_participants} participants
                      </p>
                    </div>
                  </div>
                )}
                
                {event.price > 0 && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Price</h3>
                      <p>{event.price.toLocaleString()} {event.currency}</p>
                      {event.refund_policy && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.refund_policy}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Event description */}
              <div>
                <h3 className="text-lg font-medium mb-3">About this event</h3>
                {event.description ? (
                  <div className="prose max-w-none">
                    {event.description.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-3">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No description provided</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="participants">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Participants</h3>
                
                {participantsQuery.isLoading ? (
                  <div className="flex justify-center p-8">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : participants.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {participants.map((participant) => (
                      <div 
                        key={participant.id} 
                        className="flex items-center gap-3 p-3 border rounded-md"
                      >
                        <Avatar>
                          <AvatarImage 
                            src={participant.profile?.avatar_url || ""} 
                            alt={participant.profile?.username || ""}
                          />
                          <AvatarFallback>
                            {(participant.profile?.username || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.profile?.display_name || participant.profile?.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {participant.status === 'attending' ? 'Attending' : 'Interested'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground p-4 border rounded-md bg-muted/20">
                    No one has joined this event yet. Be the first!
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="discussion">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Discussion</h3>
                
                {/* Comment form */}
                {user ? (
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Add a comment or question..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || addCommentMutation.isPending}
                      >
                        {addCommentMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                        Post Comment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-md bg-muted/20 text-center">
                    <p className="text-muted-foreground mb-2">Sign in to join the discussion</p>
                    <Button onClick={() => navigate("/login", { state: { from: `/events/${id}` } })}>
                      Sign In
                    </Button>
                  </div>
                )}
                
                {/* Comments list */}
                <div className="space-y-4 mt-6">
                  {commentsQuery.isLoading ? (
                    <div className="flex justify-center p-4">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="border rounded-md p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={comment.profile?.avatar_url || ""} 
                              alt={comment.profile?.username || ""}
                            />
                            <AvatarFallback>
                              {(comment.profile?.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {comment.profile?.display_name || comment.profile?.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), "PPp")}
                            </p>
                          </div>
                        </div>
                        <p>{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6">
                      <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No comments yet. Start the conversation!</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <FooterNav />
      
      {/* Delete event confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              event and remove all participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEventMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}