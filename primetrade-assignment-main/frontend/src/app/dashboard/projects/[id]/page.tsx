'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { projectAPI, taskAPI } from '../../../lib/api';
import { Project, Task, User } from '@/src/types';
import { useParams } from 'next/navigation';

export default function ProjectDetail() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', status: 'pending', assignee: '' });
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projData, tasksData] = await Promise.all([
        projectAPI.getProject(projectId),
        taskAPI.getTasks({ projectId })
      ]);
      setProject(projData);
      setTasks(tasksData.tasks);
    } catch (error) {
      console.error('Failed to load project details', error);
      setErrorMsg('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && projectId) fetchData();
  }, [user, projectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await taskAPI.createTask({
        ...newTask,
        project: projectId,
        assignee: newTask.assignee || undefined
      } as any);
      setTasks([created, ...tasks]);
      setIsTaskModalOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', status: 'pending', assignee: '' });
    } catch (error: any) {
      alert(error.message || 'Failed to create task');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedProject = await projectAPI.addMember(projectId, newMemberEmail);
      setProject(updatedProject);
      setIsMemberModalOpen(false);
      setNewMemberEmail('');
    } catch (error: any) {
      alert(error.message || 'Failed to add member');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const updated = await taskAPI.updateTaskStatus(taskId, newStatus);
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: updated.status } : t));
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="min-h-screen p-8 dark:bg-gray-900 text-center dark:text-white">Loading project...</div>;
  if (!project) return <div className="min-h-screen p-8 dark:bg-gray-900 text-center text-red-500">{errorMsg || 'Project not found.'}</div>;

  const isAdmin = project.members.find(m => m.user._id === user?.id)?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <button onClick={() => setIsMemberModalOpen(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400">
                  Manage Members
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setIsTaskModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  + Add Task
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Tasks Area */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-xl font-bold dark:text-white mb-4">Tasks</h2>
            {['pending', 'in progress', 'completed'].map(status => (
              <div key={status} className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 capitalize mb-3 border-b pb-2 dark:border-gray-700">
                  {status} ({tasks.filter(t => t.status === status).length})
                </h3>
                <div className="space-y-3">
                  {tasks.filter(t => t.status === status).map(task => (
                    <div key={task._id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                      <div>
                        <h4 className="font-medium dark:text-white">{task.title}</h4>
                        {task.assignee && (
                           <p className="text-xs text-gray-500 mt-1">Assignee: {(task.assignee as User).name || 'Unknown'}</p>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}>{task.priority}</span>
                      </div>
                      <select 
                        value={task.status} 
                        onChange={(e) => handleStatusChange(task._id!, e.target.value)}
                        className="text-sm bg-white dark:bg-gray-800 border rounded p-1 dark:text-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="in progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  ))}
                  {tasks.filter(t => t.status === status).length === 0 && (
                    <p className="text-sm text-gray-400 p-2">No tasks in this stage.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Members Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold dark:text-white mb-4">Team Members</h2>
              <div className="space-y-3">
                {project.members.map(member => (
                  <div key={member.user._id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{member.user.name}</p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded capitalize">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Add Task</h2>
              <form onSubmit={handleCreateTask}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Title</label>
                    <input type="text" required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Description</label>
                    <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Assign To</label>
                    <select value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option value="">Unassigned</option>
                      {project.members.map(m => (
                        <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-gray-300">Priority</label>
                    <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isMemberModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Add Member</h2>
              <form onSubmit={handleAddMember}>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">User Email</label>
                  <input type="email" required value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsMemberModalOpen(false)} className="px-4 py-2 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Invite</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
