'use client';

import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  
  if (loading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">Getting things ready...</p>
        </div>
      </div>
    );
  }

  
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">Taking you to your dashboard...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
            <span className="text-2xl font-bold text-zinc-800 dark:text-white">TaskFlow</span>
          </div>
          <div className="flex space-x-4">
            <Link 
              href="/login" 
              className="px-4 py-2 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white leading-tight">
                Organize Your
                <span className="text-blue-600 block">Work & Life</span>
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed">
                TaskFlow helps you stay organized and productive. Manage your tasks, 
                set priorities, and achieve your goals with our intuitive task management platform.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/register" 
                className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/40 text-center"
              >
                Start Free Today
              </Link>
              <Link 
                href="/features" 
                className="px-8 py-4 border-2 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-lg font-semibold rounded-xl hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 text-center"
              >
                See Features
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">10K+</div>
                <div className="text-zinc-500 dark:text-zinc-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">500K+</div>
                <div className="text-zinc-500 dark:text-zinc-400">Tasks Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">99%</div>
                <div className="text-zinc-500 dark:text-zinc-400">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right Content - App Preview */}
          <div className="relative">
            <div className="relative z-10 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-zinc-900 dark:text-white">Today&apos;s Tasks</div>
                  <div className="text-sm text-blue-600">3/5 completed</div>
                </div>
                
                {/* Sample Tasks */}
                {[
                  { title: 'Design meeting with team', completed: true, priority: 'high' },
                  { title: 'Finish project proposal', completed: true, priority: 'high' },
                  { title: 'Review client feedback', completed: true, priority: 'medium' },
                  { title: 'Update documentation', completed: false, priority: 'medium' },
                  { title: 'Plan weekly schedule', completed: false, priority: 'low' },
                ].map((task, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
                    <div className={`w-5 h-5 rounded-full border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-zinc-300 dark:border-zinc-600'}`}></div>
                    <div className={`flex-1 ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {task.title}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' : 
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Background decorative elements */}
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-200 dark:bg-blue-900 rounded-full opacity-50 blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-200 dark:bg-indigo-900 rounded-full opacity-50 blur-xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-white/50 dark:bg-zinc-800/30 rounded-3xl my-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Everything You Need to Stay Productive
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto">
            Powerful features designed to help you organize, prioritize, and complete your tasks efficiently.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '🚀',
              title: 'Quick Setup',
              description: 'Get started in minutes with our intuitive interface and easy task creation.'
            },
            {
              icon: '🎯',
              title: 'Smart Prioritization',
              description: 'Focus on what matters most with our priority-based task management system.'
            },
            {
              icon: '📱',
              title: 'Always Accessible',
              description: 'Access your tasks from any device, anywhere, with real-time synchronization.'
            },
            {
              icon: '🔔',
              title: 'Smart Reminders',
              description: 'Never miss a deadline with customizable notifications and due date alerts.'
            },
            {
              icon: '📊',
              title: 'Progress Tracking',
              description: 'Visualize your productivity with detailed progress reports and analytics.'
            },
            {
              icon: '🛡️',
              title: 'Secure & Private',
              description: 'Your data is encrypted and secure. We prioritize your privacy above all.'
            },
          ].map((feature, index) => (
            <div 
              key={index}
              className="p-6 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-zinc-100 dark:border-zinc-700"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-6">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-300 mb-8">
            Join thousands of users who have already simplified their task management with TaskFlow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/40"
            >
              Create Free Account
            </Link>
            <Link 
              href="/demo" 
              className="px-8 py-4 border-2 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-lg font-semibold rounded-xl hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-700 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-blue-600 rounded-lg"></div>
              <span className="text-lg font-bold text-zinc-800 dark:text-white">TaskFlow</span>
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">
              © {new Date().getFullYear()} TaskFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}