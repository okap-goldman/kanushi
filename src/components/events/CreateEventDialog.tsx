import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, ClockIcon, MapPin, Globe, Users, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../context/AuthContext";
import { eventService, CreateEventRequest } from "../../lib/eventService";

import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Spinner } from "../ui/spinner";
import { format } from "date-fns";
import { toast } from "../ui/use-toast";

const eventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().optional(),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  start_time: z.string({
    required_error: "Start time is required",
  }),
  end_date: z.date({
    required_error: "End date is required",
  }),
  end_time: z.string({
    required_error: "End time is required",
  }),
  is_online: z.boolean().default(false),
  location: z.string().optional(),
  online_url: z.string().optional(),
  max_participants: z.number().int().positive().optional(),
  price: z.number().int().min(0, "Price cannot be negative").default(0),
  currency: z.string().default("JPY"),
  category: z.string().optional(),
  privacy_level: z.enum(["public", "friends", "private"]).default("public"),
  registration_deadline: z.date().optional(),
  cover_image_url: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  "social",
  "conference",
  "workshop",
  "concert",
  "sports",
  "fitness",
  "food",
  "art",
  "culture",
  "business",
  "tech",
  "education",
  "family",
  "other",
];

export default function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      is_online: false,
      price: 0,
      currency: "JPY",
      privacy_level: "public",
    },
  });

  const isOnline = form.watch("is_online");

  async function onSubmit(data: EventFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an event",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data to API request format
      const startDateTime = new Date(`${format(data.start_date, "yyyy-MM-dd")}T${data.start_time}`);
      const endDateTime = new Date(`${format(data.end_date, "yyyy-MM-dd")}T${data.end_time}`);

      // Basic validation for dates
      if (endDateTime <= startDateTime) {
        toast({
          title: "Invalid date/time",
          description: "End date/time must be after start date/time",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const eventData: CreateEventRequest = {
        title: data.title,
        description: data.description,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        is_online: data.is_online,
        price: data.price,
        currency: data.currency,
        category: data.category,
        privacy_level: data.privacy_level,
        registration_deadline: data.registration_deadline?.toISOString(),
        cover_image_url: data.cover_image_url,
      };

      // Add location or online URL based on event type
      if (data.is_online) {
        eventData.online_url = data.online_url;
      } else {
        eventData.location = data.location;
      }

      if (data.max_participants) {
        eventData.max_participants = data.max_participants;
      }

      // Create the event
      const { event, error } = await eventService.createEvent(eventData);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Event created",
        description: "Your event has been created successfully",
      });

      // Close the dialog and navigate to the new event
      onOpenChange(false);
      if (event?.id) {
        navigate(`/events/${event.id}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title*</FormLabel>
                  <FormControl>
                    <Input placeholder="Give your event a name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your event..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <div className="flex flex-wrap gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-[200px] pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Time */}
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time*</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          type="time"
                          className="w-[150px]"
                          {...field}
                        />
                        <ClockIcon className="ml-2 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* End Date */}
            <div className="flex flex-wrap gap-4">
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-[200px] pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Time */}
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time*</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          type="time"
                          className="w-[150px]"
                          {...field}
                        />
                        <ClockIcon className="ml-2 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Is Online Toggle */}
            <FormField
              control={form.control}
              name="is_online"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Online Event</FormLabel>
                    <FormDescription>
                      Enable if this event will be held online
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Location or Online URL based on is_online value */}
            {isOnline ? (
              <FormField
                control={form.control}
                name="online_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Online URL</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input placeholder="e.g., https://zoom.us/j/123456789" {...field} />
                        <Globe className="ml-2 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Provide a link where participants can join your event
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input placeholder="e.g., Tokyo, Shibuya" {...field} />
                        <MapPin className="ml-2 h-4 w-4 opacity-50" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Provide the location of your event
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Max Participants */}
            <FormField
              control={form.control}
              name="max_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Participants</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Leave empty for unlimited"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : parseInt(value, 10));
                        }}
                      />
                      <Users className="ml-2 h-4 w-4 opacity-50" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Set a limit on the number of participants, or leave empty for unlimited
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        min={0}
                        placeholder="0 for free events"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      />
                      <DollarSign className="ml-2 h-4 w-4 opacity-50" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Set a price for your event, or 0 for free events
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Privacy Level */}
            <FormField
              control={form.control}
              name="privacy_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Privacy Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select privacy level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public (Anyone can see and join)</SelectItem>
                      <SelectItem value="friends">Friends (Only your connections can see and join)</SelectItem>
                      <SelectItem value="private">Private (By invitation only)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Control who can see and join your event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Registration Deadline */}
            <FormField
              control={form.control}
              name="registration_deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Registration Deadline</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-[240px] pl-3 text-left font-normal ${
                            !field.value && "text-muted-foreground"
                          }`}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Optional</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Last day for participants to register (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image URL */}
            <FormField
              control={form.control}
              name="cover_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="URL to event cover image" {...field} />
                  </FormControl>
                  <FormDescription>
                    Provide a URL for an image that represents your event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="mr-2" /> : null}
                Create Event
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}