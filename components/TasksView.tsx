import React, { useState, useMemo } from 'react';
import { Task, Client } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon } from './icons';
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

  const clientMap = useMemo(() => {
    return clients.reduce((map, client) => {
      map[client.id] = `${client.firstName} ${client.lastName}`;
      return map;
    }, {} as Record<number, string>);
  }, [clients]);

  const { activeTasks, completedTasks } = useMemo(() => {
    const active: Task[] = [];
    const completed: Task[] = [];
    tasks.forEach(task => {
        if (task.completed) {
            completed.push(task);
        } else {
            active.push(task);
        }
    });
    const sortByDueDate = (a: Task, b: Task) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return { activeTasks: active.sort(sortByDueDate), completedTasks: completed.sort(sortByDueDate) };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
      if (filter === 'active') return activeTasks;
      if (filter === 'completed') return completedTasks;
      return [...activeTasks, ...completedTasks];
  }, [activeTasks, completedTasks, filter]);


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
            <div className="flex items-center cursor-pointer" onClick={() => onToggleTask(task.id)}>
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${task.completed ? 'bg-primary-600 border-primary-600' : 'border-slate-300 group-hover:border-primary-400'}`}>
                    {task.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="ml-4">
                    <p className={`font-semibold text-slate-800 transition-all ${task.completed ? 'line-through text-slate-500' : ''}`}>{task.title}</p>
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
      
      <div className="mb-6 flex space-x-2">
        <FilterButton buttonFilter="active" label="Active" count={activeTasks.length} activeFilter={filter} setFilter={setFilter} />
        <FilterButton buttonFilter="completed" label="Completed" count={completedTasks.length} activeFilter={filter} setFilter={setFilter} />
        <FilterButton buttonFilter="all" label="All" count={tasks.length} activeFilter={filter} setFilter={setFilter} />
      </div>

      <div className="space-y-4">
          {filteredTasks.length > 0 ? filteredTasks.map(task => (
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