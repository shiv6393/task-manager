export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'member';
}

export interface ProjectMember {
  user: User;
  role: 'admin' | 'member';
  _id?: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: ProjectMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  _id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  project: string | Project;
  assignee?: string | User;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Add this to your existing types
export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}