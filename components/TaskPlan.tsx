import React from 'react';
import type { PlanState, Area, Task } from '../types';
import { ProgressBar } from './ProgressBar';
import { SparklesIcon } from './icons/Icons';

interface TaskPlanProps {
  planSummary: PlanState;
  areaPlans: Record<number, PlanState>;
  areas: Area[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  taskProgress: number;
}

export const TaskPlan: React.FC<TaskPlanProps> = ({ planSummary, areaPlans, areas, tasks, setTasks, taskProgress }) => {

  const handleGenerateTasks = () => {
    const newTasks: Task[] = [];
    areas.forEach(area => {
      const plan = areaPlans[area.id];
      if (plan && plan.content) {
        const recommendations = plan.content.split('\n')
          .filter(line => line.trim().startsWith('- '))
          .map(line => line.trim().substring(2).trim());

        recommendations.forEach((rec, index) => {
          newTasks.push({
            id: `${area.id}-${index}-${Date.now()}`,
            text: rec,
            completed: false,
            areaTitle: area.title,
          });
        });
      }
    });
    setTasks(newTasks);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };
  
  const tasksByArea = tasks.reduce((acc, task) => {
    (acc[task.areaTitle] = acc[task.areaTitle] || []).push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  if (!planSummary.content) {
    return (
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Plan de Tareas</h1>
        <p className="mt-2 text-slate-500">Convierte tu plan de desarrollo en acciones concretas.</p>
        <div className="mt-8 text-center bg-white p-12 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-slate-700">Aún no has generado tu plan de desarrollo.</h2>
          <p className="mt-2 text-slate-500">Ve a la sección de 'Resultados' para generar tu plan de desarrollo con IA. Una vez que lo tengas, podrás gestionar tus tareas aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Plan de Tareas</h1>
      <p className="mt-2 text-slate-500">Convierte tu plan de desarrollo en acciones concretas y sigue tu progreso.</p>

      {tasks.length === 0 ? (
        <div className="mt-8 text-center bg-white p-12 rounded-xl shadow-md">
           <h2 className="text-xl font-semibold text-slate-700">¡Listo para empezar!</h2>
           <p className="mt-2 text-slate-500 max-w-xl mx-auto">Tu plan de desarrollo profesional ha sido creado. Haz clic en el botón de abajo para extraer automáticamente las recomendaciones y convertirlas en una lista de tareas que puedes gestionar.</p>
           <button 
             onClick={handleGenerateTasks}
             className="mt-6 flex items-center justify-center gap-2 mx-auto px-6 py-3 text-sm font-semibold text-white bg-brand-accent border border-transparent rounded-lg shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors"
           >
             <SparklesIcon className="h-5 w-5"/>
             <span>Gestionar Tareas</span>
           </button>
        </div>
      ) : (
        <div className="mt-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-slate-600">Progreso General del Plan</h2>
                    <span className="text-lg font-semibold text-brand-primary">{Math.round(taskProgress)}%</span>
                </div>
                <ProgressBar percentage={taskProgress} />
            </div>

            <div className="mt-8 space-y-6">
                {Object.entries(tasksByArea).map(([areaTitle, areaTasks]) => (
                    <div key={areaTitle} className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{areaTitle}</h3>
                        <div className="space-y-3">
                            {/* FIX: Cast `areaTasks` to `Task[]` as `Object.entries` can lead to `unknown` type under strict checks. */}
                            {(areaTasks as Task[]).map(task => (
                                <label
                                    key={task.id}
                                    className="flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 border-slate-200 hover:bg-slate-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => handleToggleTask(task.id)}
                                        className="h-5 w-5 mt-0.5 text-brand-secondary rounded border-slate-300 focus:ring-brand-secondary"
                                    />
                                    <span className={`ml-4 text-sm font-medium text-slate-700 ${task.completed ? 'line-through text-slate-400' : ''}`}>
                                        {task.text}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};