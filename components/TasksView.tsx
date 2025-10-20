import React, { useState, useMemo } from 'react';
import { Task, Client } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, ArrowsUpDownIcon } from './icons';
import AddEditTaskModal from './AddEditTaskModal';

interface TasksViewProps {
  tasks: Task[];
  clients: Client[];
  onSaveTask: (task: Omit<Task, 'id' | 'completed'> & { id?: number }) => void;
  onToggleTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
  onSelectClient: (clientId: number) => void;
}

type FilterStatus = 'all' | 'active' | 'completed';
type SortByKey = 'dueDate' | 'title' | 'client';
type SortOrder = 'asc' | 'desc';

const FilterButton: React.FC<{buttonFilter: FilterStatus, label: string, count: number, activeFilter: FilterStatus, setFilter: (filter: FilterStatus) => void}> = ({ buttonFilter, label, count, activeFilter, setFilter }) => (
    <button
      onClick={() => setFilter(buttonFilter)}
      className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm button-press flex items-center gap-2 ${activeFilter === buttonFilter ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100/80 border border-slate-300'}`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeFilter === buttonFilter ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
    </button>
);

const TasksView: React.FC<TasksViewProps> = ({ tasks, clients, onSaveTask, onToggleTask, onDeleteTask, onSelectClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('active');
  const [sortBy, setSortBy] = useState<SortByKey>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const clientMap = useMemo(() => {
    return clients.reduce((map, client) => {
      map[client.id] = `${client.firstName} ${client.lastName}`;
      return map;
    }, {} as Record<number, string>);
  }, [clients]);

  const sortedTasks = useMemo(() => {
      const filtered = tasks.filter(task => {
          if (filter === 'active') return !task.completed;
          if (filter === 'completed') return task.completed;
          return true;
      });

      return filtered.sort((a, b) => {
          let compareA: string | number;
          let compareB: string | number;

          switch (sortBy) {
              case 'dueDate':
                  compareA = new Date(a.dueDate).getTime();
                  compareB = new Date(b.dueDate).getTime();
                  break;
              case 'title':
                  compareA = a.title.toLowerCase();
                  compareB = b.title.toLowerCase();
                  break;
              case 'client':
                  compareA = a.clientId ? clientMap[a.clientId]?.toLowerCase() || 'zzzz' : 'zzzz';
                  compareB = b.clientId ? clientMap[b.clientId]?.toLowerCase() || 'zzzz' : 'zzzz';
                  break;
              default:
                  return 0;
          }
          
          if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
          if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
      });
  }, [tasks, filter, sortBy, sortOrder, clientMap]);

  const handleAddTaskClick = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditTaskClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
        onDeleteTask(task.id);
    }
  }

  const getDueDateInfo = (dueDate: string, completed: boolean) => {
    if (completed) return { 
        text: 'Completed', 
        textColor: 'text-slate-500', 
        dotColor: 'bg-slate-400', 
        containerClasses: 'bg-slate-50/70 border-slate-200 opacity-70' 
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);

    if (due < today) return { 
        text: `Overdue - ${dueDate}`, 
        textColor: 'text-rose-700 font-semibold', 
        dotColor: 'bg-rose-500', 
        containerClasses: 'bg-rose-50/70 border-rose-300' 
    };
    if (due.getTime() === today.getTime()) return { 
        text: `Due Today - ${dueDate}`, 
        textColor: 'text-amber-700 font-semibold', 
        dotColor: 'bg-amber-500', 
        containerClasses: 'bg-amber-50/70 border-amber-300' 
    };
    return { 
        text: `Due: ${dueDate}`, 
        textColor: 'text-slate-500', 
        dotColor: 'bg-slate-400', 
        containerClasses: 'bg-white border-slate-200' 
    };
  };

  const TaskItem: React.FC<{task: Task}> = ({ task }) => {
    const dueDateInfo = getDueDateInfo(task.dueDate, task.completed);

    return (
        <div className={`p-4 rounded-2xl border shadow-premium flex items-center justify-between transition-all duration-300 group ${dueDateInfo.containerClasses}`}>
            <div className="flex items-center">
                 <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                    className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                />
                <div className="ml-4">
                    <p className={`relative font-semibold text-slate-800 transition-all ${task.completed ? 'text-slate-500' : ''}`}>
                      {task.title}
                      <span className={`absolute top-1/2 left-0 w-full h-0.5 bg-slate-400 transform transition-transform duration-300 ${task.completed ? 'scale-x-100' : 'scale-x-0'}`} style={{ transformOrigin: 'left' }}></span>
                    </p>
                    <div className="flex items-center text-sm mt-1">
                        <div className={`w-2 h-2 rounded-full mr-2 ${dueDateInfo.dotColor}`}></div>
                        <span className={dueDateInfo.textColor}>{dueDateInfo.text}</span>
                        {task.clientId && clientMap[task.clientId] && (
                            <>
                                <span className="mx-2 text-slate-300">|</span>
                                <button onClick={(e) => { e.stopPropagation(); onSelectClient(task.clientId!) }} className="text-primary-600 hover:underline font-medium">{clientMap[task.clientId]}</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => handleEditTaskClick(e, task)} className="text-slate-400 hover:text-primary-600 p-2 rounded-full hover:bg-slate-100" title="Edit task">
                    <PencilIcon className="w-5 h-5" />
                </button>
                <button onClick={(e) => handleDeleteClick(e, task)} className="text-slate-400 hover:text-rose-600 p-2 rounded-full hover:bg-slate-100" title="Delete task">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
  };


  return (
    <div className="p-6 sm:p-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-extrabold text-slate-800">My Tasks</h1>
            <p className="text-slate-500 mt-1">Stay organized and on top of your client follow-ups.</p>
        </div>
        <button onClick={handleAddTaskClick} className="flex items-center justify-center bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 button-press">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Task
        </button>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex space-x-2">
            <FilterButton buttonFilter="active" label="Active" count={tasks.filter(t => !t.completed).length} activeFilter={filter} setFilter={setFilter} />
            <FilterButton buttonFilter="completed" label="Completed" count={tasks.filter(t => t.completed).length} activeFilter={filter} setFilter={setFilter} />
            <FilterButton buttonFilter="all" label="All" count={tasks.length} activeFilter={filter} setFilter={setFilter} />
        </div>
        <div className="flex items-center space-x-2 sm:ml-auto">
            <label htmlFor="sort-by" className="text-sm font-medium text-slate-600">Sort by:</label>
            <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortByKey)} className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="dueDate">Due Date</option>
                <option value="title">Title</option>
                <option value="client">Client Name</option>
            </select>
            <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-100" aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}>
                <ArrowsUpDownIcon className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
        </div>
      </div>


      <div className="space-y-4">
          {sortedTasks.length > 0 ? sortedTasks.map(task => (
            <TaskItem key={task.id} task={task} />
          )) : (
            <div className="text-center py-16 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                <CalendarIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">All Clear!</h3>
                <p className="text-slate-500 mt-2">There are no {filter} tasks.</p>
            </div>
          )}
      </div>

      <AddEditTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveTask}
        taskToEdit={taskToEdit}
        clients={clients}
      />
    </div>
  );
};

export default TasksView;
