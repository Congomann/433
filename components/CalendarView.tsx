import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, User, Agent, CalendarNote, DayOff, UserRole } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, ClockIcon, LocationPinIcon, GoogleIcon } from './icons';
import { useToast } from '../contexts/ToastContext';
import { googleCalendarService } from '../services/googleCalendarService';

interface CalendarViewProps {
  currentUser: User;
  agents: Agent[];
  calendarEvents: CalendarEvent[];
  calendarNotes: CalendarNote[];
  users: User[];
  daysOff: DayOff[];
  onOpenNoteModal: (date: Date) => void;
  onToggleDayOff: (date: string) => void;
  onAddDaysOffBatch: (dates: string[]) => void;
  onDeleteDaysOffBatch: (dates: string[]) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ currentUser, agents, calendarEvents, calendarNotes, users, daysOff, onOpenNoteModal, onToggleDayOff, onAddDaysOffBatch, onDeleteDaysOffBatch }) => {
  const [currentDate, setCurrentDate] = useState(new Date('2025-10-01T12:00:00Z'));
  const [selectedDate, setSelectedDate] = useState(new Date('2025-10-16T12:00:00Z'));
  const { addToast } = useToast();
  
  // Google Calendar Integration State
  const [isGoogleConnected, setIsGoogleConnected] = useState(googleCalendarService.getIsSignedIn());
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);

  const canMarkDayOff = [UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.MANAGER, UserRole.UNDERWRITING, UserRole.AGENT].includes(currentUser.role);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');


  // Fetch Google events on initial load if connected
  useEffect(() => {
    if (isGoogleConnected) {
      setIsSyncing(true);
      googleCalendarService.listEvents()
        .then(setGoogleEvents)
        .catch(err => addToast('Sync Error', 'Could not fetch Google Calendar events.', 'error'))
        .finally(() => setIsSyncing(false));
    }
  }, [isGoogleConnected, addToast]);
  
  const handleGoogleConnect = async () => {
    setIsSyncing(true);
    try {
        await googleCalendarService.signIn();
        setIsGoogleConnected(true);
        const events = await googleCalendarService.listEvents();
        setGoogleEvents(events);
        addToast('Success', 'Google Calendar connected and events synced.', 'success');
    } catch (error) {
        addToast('Connection Failed', 'Could not connect to Google Calendar.', 'error');
    } finally {
        setIsSyncing(false);
    }
  };

  const handleGoogleDisconnect = async () => {
      await googleCalendarService.signOut();
      setIsGoogleConnected(false);
      setGoogleEvents([]);
      addToast('Disconnected', 'Google Calendar has been disconnected.', 'info');
  };

  const noteColorMapping: Record<string, { bg: string, text: string }> = {
    'Red': { bg: 'bg-rose-500', text: 'text-white' },
    'Yellow': { bg: 'bg-amber-500', text: 'text-white' },
    'Green': { bg: 'bg-emerald-500', text: 'text-white' },
    'Blue': { bg: 'bg-sky-500', text: 'text-white' },
    'Purple': { bg: 'bg-violet-500', text: 'text-white' },
    'Gray': { bg: 'bg-slate-500', text: 'text-white' },
  };

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const allEvents = [
        ...calendarEvents.map(e => ({...e, source: e.source || 'internal' as const})),
        ...googleEvents.map(e => ({...e, source: 'google' as const}))
    ];

    allEvents.forEach(event => {
      const dateKey = event.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [calendarEvents, googleEvents]);
  
   const notesByDate = useMemo(() => {
    const map = new Map<string, CalendarNote[]>();
    calendarNotes.forEach(note => {
      const dateKey = note.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(note);
    });
    return map;
  }, [calendarNotes]);

  const daysOffByDate = useMemo(() => {
    const map = new Map<string, DayOff[]>();
    daysOff.forEach(dayOff => {
      const dateKey = dayOff.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(dayOff);
    });
    return map;
  }, [daysOff]);
  
  const agentMap = useMemo(() => {
    return agents.reduce((map, agent) => {
        map[agent.id] = agent;
        return map;
    }, {} as Record<number, Agent>);
  }, [agents]);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const startingDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const handleMonthChange = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleDayClick = (day: number) => {
    const newSelectedDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day));
    setSelectedDate(newSelectedDate);
  }

  const handleDateRangeAction = (action: 'add' | 'delete') => {
    if (!startDate || !endDate) {
      addToast('Invalid Range', 'Please select both a start and end date.', 'warning');
      return;
    }
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);

    if (end < start) {
      addToast('Invalid Range', 'End date cannot be before the start date.', 'warning');
      return;
    }

    const dates = [];
    let currentDate = start;
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    if (action === 'add') {
      onAddDaysOffBatch(dates);
    } else {
      onDeleteDaysOffBatch(dates);
    }

    setStartDate('');
    setEndDate('');
  };
  
  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="bg-white"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day));
    const dateKey = date.toISOString().split('T')[0];
    const dayEvents = eventsByDate.get(dateKey) || [];
    const dayNotes = notesByDate.get(dateKey) || [];
    const dayOffs = daysOffByDate.get(dateKey) || [];

    const isDetailSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    
    const eventColors: Array<CalendarEvent['color']> = [...new Set<CalendarEvent['color']>(dayEvents.map(e => e.color))];

    let dayClasses = 'bg-white hover:bg-primary-50 hover:border-primary-200';
    let eventDotIsWhite = false;
    
    if (dayOffs.length > 0) {
        dayClasses = 'bg-red-500 text-white font-bold hover:bg-red-600';
        eventDotIsWhite = true;
    } else if (dayNotes.length > 0) {
        const noteColorName = dayNotes[0].color;
        const color = noteColorMapping[noteColorName] || noteColorMapping['Gray'];
        dayClasses = `${color.bg} ${color.text} shadow-md opacity-90 hover:opacity-100`;
        eventDotIsWhite = true;
    }

    if (isDetailSelected) {
        dayClasses = 'bg-primary-600 text-white font-bold shadow-lg';
        eventDotIsWhite = true;
    }

    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={`relative p-3 text-center border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${dayClasses}`}
      >
        <span className="text-sm">{day}</span>
        <div className="flex justify-center items-center mt-2 space-x-1 h-2">
            {dayEvents.length > 0 && eventColors.slice(0, 3).map(color => {
              const colorClass = {
                blue: 'bg-blue-500',
                purple: 'bg-purple-500',
                green: 'bg-green-500',
                orange: 'bg-orange-500',
                red: 'bg-red-500',
              }[color];
              return <div key={color} className={`w-1.5 h-1.5 rounded-full ${eventDotIsWhite ? 'bg-white/70' : colorClass}`}></div>;
            })}
        </div>
      </button>
    );
  }

  const selectedDateKey = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
  const isCurrentUserOff = daysOff.some(d => d.userId === currentUser.id && d.date === selectedDateKey);

  const selectedDayEvents = selectedDate ? (eventsByDate.get(selectedDateKey) || []).sort((a,b) => {
    if (a.time === 'All Day' && b.time !== 'All Day') return -1;
    if (a.time !== 'All Day' && b.time === 'All Day') return 1;
    return a.time.localeCompare(b.time);
  }) : [];
  
  const eventCardColors = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600' },
      green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600' },
      red: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white' },
  };


  return (
    <div className="p-6 sm:p-10 h-full flex flex-col page-enter">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800">Calendar</h1>
          <p className="text-slate-500 mt-1">Schedule and manage appointments</p>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => selectedDate && onOpenNoteModal(selectedDate)} className="flex items-center justify-center bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 button-press">
                <PlusIcon className="w-5 h-5 mr-2" /> New Note
            </button>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center space-x-1">
                    <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-lg hover:bg-slate-100/50" aria-label="Previous month">
                        <ChevronLeftIcon className="w-6 h-6 text-slate-600" />
                    </button>
                    <button onClick={() => handleMonthChange(1)} className="p-2 rounded-lg hover:bg-slate-100/50" aria-label="Next month">
                        <ChevronRightIcon className="w-6 h-6 text-slate-600" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center font-semibold text-slate-500 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {calendarDays}
            </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium flex flex-col">
            {canMarkDayOff && (
              <div className="mb-6 p-4 bg-slate-100/70 rounded-lg border border-slate-200/50 flex-shrink-0">
                  <h3 className="font-semibold text-slate-700 mb-3">Mark Time Off Range</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                          <label className="text-xs font-medium text-slate-600" htmlFor="start-date">Start Date</label>
                          <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-1.5 border border-slate-300 rounded-md text-sm"/>
                      </div>
                      <div>
                          <label className="text-xs font-medium text-slate-600" htmlFor="end-date">End Date</label>
                          <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-1.5 border border-slate-300 rounded-md text-sm" />
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDateRangeAction('add')} className="w-full text-sm font-semibold bg-red-500 text-white px-3 py-1.5 rounded-md disabled:bg-slate-400">Mark Off</button>
                    <button onClick={() => handleDateRangeAction('delete')} className="w-full text-sm font-semibold bg-emerald-500 text-white px-3 py-1.5 rounded-md disabled:bg-slate-400">Mark Available</button>
                  </div>
              </div>
            )}
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex-shrink-0">
                Events for {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select a date'}
            </h2>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2 -mr-2">
                {selectedDayEvents.length > 0 ? selectedDayEvents.map(event => {
                    const colors = eventCardColors[event.color];
                    const agent = agentMap[event.agentId];
                    const isGoogleEvent = event.source === 'google';

                    return (
                        <div key={event.id} className="flex items-start space-x-3 card-enter">
                            {agent && !isGoogleEvent ? (
                                <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                  {isGoogleEvent && <GoogleIcon className="w-5 h-5" />}
                                </div>
                            )}
                            <div className={`flex-1 p-3 rounded-xl border-l-4 ${colors.bg} ${colors.border}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className={`font-bold leading-tight flex items-center ${colors.text === 'text-white' ? 'text-white' : 'text-slate-800'}`}>
                                            {event.title}
                                        </h3>
                                        {agent && !isGoogleEvent && <p className={`text-sm font-medium ${colors.text === 'text-white' ? 'text-white/80' : 'text-slate-500'} -mt-0.5`}>With: {agent.name}</p>}
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${colors.border} ${colors.text} bg-white flex-shrink-0 ml-2`}>{event.tag}</span>
                                </div>
                                <div className={`mt-2 space-y-1 text-sm ${colors.text === 'text-white' ? 'text-white/90' : 'text-slate-600'}`}>
                                    <div className="flex items-center">
                                        <ClockIcon className={`w-4 h-4 mr-1.5 ${colors.text === 'text-white' ? 'text-white/70' : 'text-slate-400'}`} />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <LocationPinIcon className={`w-4 h-4 mr-1.5 ${colors.text === 'text-white' ? 'text-white/70' : 'text-slate-400'}`} />
                                        <span>{event.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }) : (
                    <div className="flex items-center justify-center h-full text-center text-slate-500">
                        <p>No events for this day.</p>
                    </div>
                )}
            </div>
            {canMarkDayOff && selectedDate && (
                <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-slate-200/50 flex-shrink-0">
                     <button
                        onClick={() => selectedDate && onOpenNoteModal(selectedDate)}
                        className="w-full text-center font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                        View/Add Notes for Selected Day
                    </button>
                    <button
                        onClick={() => onToggleDayOff(selectedDateKey)}
                        className={`w-full text-center font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors ${isCurrentUserOff ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        {isCurrentUserOff ? 'Cancel Day Off' : 'Mark as Day Off'}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;