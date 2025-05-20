import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, FilterIcon, Plus, Calendar, Grid, Map, Search } from "lucide-react";
import { format, addDays, isSameMonth, getMonth, startOfMonth } from "date-fns";
import { ja } from "date-fns/locale";

import { Event, EventsFilter, eventService } from "../lib/eventService";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Calendar as CalendarComponent } from "../components/ui/calendar";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Spinner } from "../components/ui/spinner";
import { Slider } from "../components/ui/slider";
import { toast } from "../components/ui/use-toast";

import Navbar from "../components/Navbar";
import FooterNav from "../components/FooterNav";
import CreateEventDialog from "../components/events/CreateEventDialog";
import EventCard from "../components/events/EventCard";

const CATEGORIES = [
  "all",
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

export default function Events() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [view, setView] = useState<"list" | "calendar" | "map">("list");
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());

  // Filter state
  const [filters, setFilters] = useState<EventsFilter>({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "all",
    is_online: searchParams.get("is_online") === "true",
    start_date: searchParams.get("start_date") || undefined,
    end_date: searchParams.get("end_date") || undefined,
    location: searchParams.get("location") || "",
    price_range: [0, 50000],
    limit: 20,
    page: 1,
  });

  // Date range for filter
  const [dateRange, setDateRange] = useState<Date | undefined>(
    filters.start_date ? new Date(filters.start_date) : undefined
  );

  // Selected tab
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "attending" | "created">("upcoming");

  // Keep URL in sync with filters
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (filters.search) newParams.set("search", filters.search);
    if (filters.category && filters.category !== "all") newParams.set("category", filters.category);
    if (filters.is_online) newParams.set("is_online", "true");
    if (filters.start_date) newParams.set("start_date", filters.start_date);
    if (filters.end_date) newParams.set("end_date", filters.end_date);
    if (filters.location) newParams.set("location", filters.location);
    
    setSearchParams(newParams);
  }, [filters, setSearchParams]);

  // Fetch events based on selected tab and filters
  const eventsQuery = useQuery({
    queryKey: ["events", selectedTab, filters],
    queryFn: async () => {
      if (selectedTab === "upcoming") {
        return eventService.getEvents(filters);
      } else if (selectedTab === "attending" && user) {
        return eventService.getUserEvents(user.id, "attending");
      } else if (selectedTab === "created" && user) {
        return eventService.getUserEvents(user.id, "created");
      }
      return { events: [], count: 0, error: null };
    },
    enabled: selectedTab === "upcoming" || !!user,
  });

  // Group events by date for calendar view
  const groupEventsByDate = (events: Event[] = []) => {
    const grouped: Record<string, Event[]> = {};
    
    events.forEach(event => {
      const date = format(new Date(event.start_datetime), "yyyy-MM-dd");
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    
    return grouped;
  };

  const eventsByDate = groupEventsByDate(eventsQuery.data?.events || []);

  // Apply filters
  const applyFilters = () => {
    const updatedFilters: EventsFilter = {
      ...filters,
      page: 1, // Reset page when applying new filters
    };

    if (dateRange) {
      updatedFilters.start_date = format(dateRange, "yyyy-MM-dd");
      updatedFilters.end_date = format(addDays(dateRange, 1), "yyyy-MM-dd");
    } else {
      updatedFilters.start_date = undefined;
      updatedFilters.end_date = undefined;
    }

    setFilters(updatedFilters);
    setFilterSheetOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      category: "all",
      is_online: false,
      start_date: undefined,
      end_date: undefined,
      location: "",
      price_range: [0, 50000],
      limit: 20,
      page: 1,
    });
    setDateRange(undefined);
    setFilterSheetOpen(false);
  };

  // Handle search input
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // Render calendar day with events
  const renderCalendarDay = (day: Date, events: Event[]) => {
    const isFirstDayOfMonth = day.getDate() === 1;
    const dayEvents = eventsByDate[format(day, "yyyy-MM-dd")] || [];
    
    return (
      <div className="h-full relative">
        <div className="absolute top-1 left-1 text-xs">
          {isFirstDayOfMonth 
            ? format(day, "LLL d", { locale: ja }) 
            : format(day, "d")}
        </div>
        
        {dayEvents.length > 0 && (
          <div className="absolute bottom-1 right-1">
            <Badge variant="outline" className="text-xs">
              {dayEvents.length}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container max-w-6xl py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Events</h1>
            <p className="text-muted-foreground">Discover and join events</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <form 
              onSubmit={handleSearchSubmit} 
              className="relative w-full sm:w-64 md:w-80"
            >
              <Input
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pr-10"
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <div className="flex gap-2">
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex gap-2">
                    <FilterIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Events</SheetTitle>
                    <SheetDescription>
                      Narrow down events based on your preferences
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="py-4 space-y-6">
                    {/* Category filter */}
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={filters.category || "all"} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === "all" ? undefined : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category === "all" 
                                ? "All Categories" 
                                : category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Online/In-person filter */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="online-filter">Online Events Only</Label>
                      <Switch
                        id="online-filter"
                        checked={filters.is_online}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, is_online: checked }))}
                      />
                    </div>
                    
                    {/* Date filter */}
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange ? (
                              format(dateRange, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange}
                            onSelect={setDateRange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {/* Location filter (if not online) */}
                    {!filters.is_online && (
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          placeholder="e.g., Tokyo, Shibuya"
                          value={filters.location || ""}
                          onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                    )}
                    
                    {/* Price range filter */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Price Range</Label>
                        <span className="text-sm text-muted-foreground">
                          {filters.price_range[0].toLocaleString()} - {filters.price_range[1].toLocaleString()} JPY
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={50000}
                        step={1000}
                        value={filters.price_range}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, price_range: value as [number, number] }))}
                        className="my-4"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button onClick={applyFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              
              <Button onClick={() => setCreateEventOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <Tabs
            value={selectedTab}
            onValueChange={(value) => setSelectedTab(value as "upcoming" | "attending" | "created")}
          >
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="attending">My Events</TabsTrigger>
              <TabsTrigger value="created">Hosting</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={view === "list" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setView("list")}
              className="rounded-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={view === "calendar" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setView("calendar")}
              className="rounded-none"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button 
              variant={view === "map" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setView("map")}
              className="rounded-none"
            >
              <Map className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Applied filters */}
        {(filters.search || 
          (filters.category && filters.category !== "all") || 
          filters.is_online || 
          filters.start_date || 
          filters.location) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {filters.search}
                <button 
                  className="ml-1 text-xs" 
                  onClick={() => setFilters(prev => ({ ...prev, search: "" }))}
                >
                  ×
                </button>
              </Badge>
            )}
            
            {filters.category && filters.category !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {filters.category}
                <button 
                  className="ml-1 text-xs" 
                  onClick={() => setFilters(prev => ({ ...prev, category: "all" }))}
                >
                  ×
                </button>
              </Badge>
            )}
            
            {filters.is_online && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Online Only
                <button 
                  className="ml-1 text-xs" 
                  onClick={() => setFilters(prev => ({ ...prev, is_online: false }))}
                >
                  ×
                </button>
              </Badge>
            )}
            
            {filters.start_date && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Date: {format(new Date(filters.start_date), "PP")}
                <button 
                  className="ml-1 text-xs" 
                  onClick={() => {
                    setFilters(prev => ({ ...prev, start_date: undefined, end_date: undefined }));
                    setDateRange(undefined);
                  }}
                >
                  ×
                </button>
              </Badge>
            )}
            
            {filters.location && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Location: {filters.location}
                <button 
                  className="ml-1 text-xs" 
                  onClick={() => setFilters(prev => ({ ...prev, location: "" }))}
                >
                  ×
                </button>
              </Badge>
            )}
            
            <Button 
              variant="link" 
              className="text-xs h-6 px-2"
              onClick={resetFilters}
            >
              Clear All
            </Button>
          </div>
        )}
        
        {/* Event list/calendar/map view */}
        {eventsQuery.isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : eventsQuery.isError ? (
          <div className="text-center p-12">
            <p className="text-red-500">Error loading events. Please try again later.</p>
          </div>
        ) : (
          <>
            {view === "list" && (
              <>
                {eventsQuery.data?.events && eventsQuery.data.events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventsQuery.data.events.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event}
                        onParticipationChange={() => eventsQuery.refetch()}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-12 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">No events found matching your criteria.</p>
                    {selectedTab !== "upcoming" && (
                      <Button 
                        variant="link" 
                        onClick={() => setSelectedTab("upcoming")}
                      >
                        View upcoming events
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
            
            {view === "calendar" && (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-4 bg-muted/30 flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {calendarDate && format(calendarDate, "MMMM yyyy")}
                  </h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (calendarDate) {
                          const prevMonth = new Date(calendarDate);
                          prevMonth.setMonth(prevMonth.getMonth() - 1);
                          setCalendarDate(prevMonth);
                        }
                      }}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (calendarDate) {
                          const nextMonth = new Date(calendarDate);
                          nextMonth.setMonth(nextMonth.getMonth() + 1);
                          setCalendarDate(nextMonth);
                        }
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
                
                <CalendarComponent
                  mode="single"
                  selected={dateRange}
                  onSelect={(date) => {
                    setDateRange(date);
                    if (date) {
                      setFilters(prev => ({
                        ...prev,
                        start_date: format(date, "yyyy-MM-dd"),
                        end_date: format(addDays(date, 1), "yyyy-MM-dd"),
                      }));
                    } else {
                      setFilters(prev => ({
                        ...prev,
                        start_date: undefined,
                        end_date: undefined,
                      }));
                    }
                  }}
                  month={calendarDate}
                  onMonthChange={setCalendarDate}
                  className="rounded-md border"
                  components={{
                    Day: ({ day, ...props }) => {
                      // Get events for this day
                      const dayEvents = eventsByDate[format(day, "yyyy-MM-dd")] || [];
                      const hasEvents = dayEvents.length > 0;
                      
                      return (
                        <div 
                          {...props}
                          className={`relative h-14 w-14 p-0 font-normal aria-selected:opacity-100 hover:bg-muted/40 
                            ${hasEvents ? 'font-medium' : ''} 
                            ${!isSameMonth(day, calendarDate || new Date()) ? 'text-muted-foreground opacity-50' : ''}
                          `}
                        >
                          {renderCalendarDay(day, dayEvents)}
                        </div>
                      );
                    },
                  }}
                />
                
                {dateRange && (
                  <div className="p-4 border-t">
                    <h4 className="font-medium mb-2">Events on {format(dateRange, "MMMM d, yyyy")}</h4>
                    <div className="space-y-2">
                      {(eventsByDate[format(dateRange, "yyyy-MM-dd")] || []).length > 0 ? (
                        (eventsByDate[format(dateRange, "yyyy-MM-dd")] || []).map((event) => (
                          <div 
                            key={event.id} 
                            className="p-3 border rounded-md hover:bg-muted/30 cursor-pointer"
                            onClick={() => window.location.href = `/events/${event.id}`}
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">{event.title}</span>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(event.start_datetime), "p")}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              {event.is_online ? (
                                <>
                                  <Globe className="h-3 w-3" />
                                  <span>Online Event</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-3 w-3" />
                                  <span>{event.location || "Location not specified"}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No events on this date</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {view === "map" && (
              <div className="text-center p-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Map view is coming soon!</p>
                <Button 
                  variant="link" 
                  onClick={() => setView("list")}
                >
                  Switch to list view
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      
      <FooterNav />
      
      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
      />
    </div>
  );
}