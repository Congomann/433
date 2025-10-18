import React, { useState, useMemo } from 'react';
import { CalendarEvent, User, Agent, CalendarNote } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, ClockIcon, LocationPinIcon, TagIcon } from './icons';

interface CalendarViewProps {
  currentUser: User;
  agents: Agent[];
  calendarEvents: CalendarEvent[];
  calendarNotes: CalendarNote[];
  users: User[];
  onOpenNoteModal: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ currentUser, agents, calendarEvents, calendarNotes, users, onOpenNoteModal }) => {
  const [currentDate, setCurrentDate] = useState(new Date('2025-10-01T12:00:00Z'));
  const [selectedDate, setSelectedDate] = useState(new Date('2025-10-16T12:00:00Z'));

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    calendarEvents.forEach(event => {
      const dateKey = event.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [calendarEvents]);
  
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
    const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newSelectedDate);
    onOpenNoteModal(newSelectedDate);
  }
  
  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="bg-white"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day));
    const dateKey = date.toISOString().split('T')[0];
    const dayEvents = eventsByDate.get(dateKey) || [];
    const dayNotes = notesByDate.get(dateKey) || [];
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    
    const eventColors: Array<CalendarEvent['color']> = [...new Set<CalendarEvent['color']>(dayEvents.map(e => e.color))];

    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={`relative p-3 text-center border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
          isSelected
            ? 'bg-primary-600 text-white font-bold shadow-lg'
            : 'bg-white hover:bg-primary-50 hover:border-primary-200'
        }`}
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
              return <div key={color} className={`w-1.5 h-1.5 rounded-full ${colorClass} ${isSelected ? 'bg-white' : ''}`}></div>;
            })}
        </div>
        {dayNotes.length > 0 && (
          <div className="absolute top-1.5 right-1.5">
            <TagIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white/70' : 'text-slate-400'}`} />
          </div>
        )}
      </button>
    );
  }

  const selectedDayEvents = selectedDate ? (eventsByDate.get(selectedDate.toISOString().split('T')[0]) || []).sort((a,b) => a.time.localeCompare(b.time)) : [];
  
  const eventCardColors = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600' },
      green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600' },
      red: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600' },
  };


  return (
    <div className="p-6 sm:p-10 h-full flex flex-col page-enter">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800">Calendar</h1>
          <p className="text-slate-500 mt-1">Schedule and manage appointments</p>
        </div>
        <button className="flex items-center justify-center bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 button-press">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Event
        </button>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium">
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
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex-shrink-0">
                Events - {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select a date'}
            </h2>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2 -mr-2">
                {selectedDayEvents.length > 0 ? selectedDayEvents.map(event => {
                    const colors = eventCardColors[event.color];
                    const agent = agentMap[event.agentId];
                    return (
                        <div key={event.id} className="flex items-start space-x-3 card-enter">
                            {agent ? (
                                <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                            )}
                            <div className={`flex-1 p-3 rounded-xl border-l-4 ${colors.bg} ${colors.border}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-800 leading-tight">{event.title}</h3>
                                        {agent && <p className="text-sm font-medium text-slate-500 -mt-0.5">With: {agent.name}</p>}
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${colors.border} ${colors.text} bg-white flex-shrink-0 ml-2`}>{event.tag}</span>
                                </div>
                                <div className="mt-2 space-y-1 text-sm text-slate-600">
                                    <div className="flex items-center">
                                        <ClockIcon className="w-4 h-4 mr-1.5 text-slate-400" />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <LocationPinIcon className="w-4 h-4 mr-1.5 text-slate-400" />
                                        <span>{event.location}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }) : (
                    <div className="flex items-center justify-center h-full text-center text-slate-500">
                        <p>No events for this day. Click a day to add notes.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;