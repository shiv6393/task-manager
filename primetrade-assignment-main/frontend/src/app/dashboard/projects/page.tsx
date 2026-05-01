'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import { projectAPI } from '../../lib/api';
import { Project } from '@/src/types';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectAPI.getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProjects();
  }, [user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await projectAPI.createProject(newProject);
      setProjects([...projects, created]);
      setIsModalOpen(false);
      setNewProject({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  if (loading) {
     return <div className="min-h-screen p-8 dark:bg-gray-900 dark:text-white">Loading projects...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your team projects</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Project
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link 
              key={project._id}
              href={`/dashboard/projects/${project._id}`} 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{project.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 truncate">{project.description || 'No description'}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{project.members.length} Members</span>
                <span>{new Date(project.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
               <p className="text-gray-500 mb-4">You don't have any projects yet.</p>
               {user?.role === 'admin' ? (
                 <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Create your first project</button>
               ) : (
                 <p className="text-sm text-gray-400">Please wait for an admin to invite you to a project.</p>
               )}
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Create New Project</h2>
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                  <input 
                    type="text" 
                    required 
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="E.g., Website Redesign"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea 
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Optional details"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
