// API Client for Teacher Scheduler
import type { Teacher, CourseGroup, ValidationError, DeleteReference, DivisionConfig } from '@/types/scheduler';

// Use Next.js API routes (/api/*) which work with Vercel KV
// Falls back to json-server (localhost:3001) for local development if API_URL is set
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: ValidationError[],
    public references?: DeleteReference[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(
      error.message || error.error || 'API request failed',
      response.status,
      error.errors
    );
  }

  return response.json();
}

// Teacher API
export const teacherApi = {
  getAll: async (): Promise<Teacher[]> => {
    const response = await fetch(`${API_BASE}/teachers`);
    return handleResponse<Teacher[]>(response);
  },

  getById: async (id: string): Promise<Teacher> => {
    const response = await fetch(`${API_BASE}/teachers/${id}`);
    return handleResponse<Teacher>(response);
  },

  create: async (teacher: Omit<Teacher, 'id'>): Promise<Teacher> => {
    const response = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...teacher,
        id: `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })
    });
    return handleResponse<Teacher>(response);
  },

  update: async (id: string, updates: Partial<Teacher>): Promise<Teacher> => {
    const response = await fetch(`${API_BASE}/teachers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse<Teacher>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/teachers/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new ApiError(error.message || 'Delete failed', response.status);
    }
  }
};

// Catalog API
export const catalogApi = {
  get: async () => {
    const response = await fetch(`${API_BASE}/catalog`);
    return handleResponse<{
      courseGroups: CourseGroup[];
      courses: Array<{ id: string; label: string; group: string; isCPT: boolean }>;
    }>(response);
  },

  // Course Groups
  createGroup: async (group: Omit<CourseGroup, 'id'> & { id: string }) => {
    const response = await fetch(`${API_BASE}/catalog/courseGroups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group)
    });
    return handleResponse<CourseGroup>(response);
  },

  updateGroup: async (id: string, updates: Partial<CourseGroup>) => {
    const response = await fetch(`${API_BASE}/catalog/courseGroups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse<CourseGroup>(response);
  },

  deleteGroup: async (id: string, cascade: boolean = false) => {
    const url = cascade
      ? `${API_BASE}/catalog/courseGroups/${id}?cascade=true`
      : `${API_BASE}/catalog/courseGroups/${id}`;

    const response = await fetch(url, { method: 'DELETE' });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new ApiError(error.message || 'Delete failed', response.status, error.errors, error.references);
    }
  },

  // Courses
  createCourse: async (course: { id: string; label: string; group: string; isCPT: boolean }) => {
    const response = await fetch(`${API_BASE}/catalog/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course)
    });
    return handleResponse(response);
  },

  updateCourse: async (id: string, updates: Partial<{ label: string; group: string; isCPT: boolean }>) => {
    const response = await fetch(`${API_BASE}/catalog/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse(response);
  },

  deleteCourse: async (id: string, force: boolean = false) => {
    const url = force
      ? `${API_BASE}/catalog/courses/${id}?force=true`
      : `${API_BASE}/catalog/courses/${id}`;

    const response = await fetch(url, { method: 'DELETE' });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new ApiError(error.message || 'Delete failed', response.status, error.errors, error.references);
    }
  }
};

// Divisions API
export const divisionApi = {
  getAll: async (): Promise<DivisionConfig[]> => {
    const response = await fetch(`${API_BASE}/divisions`);
    return handleResponse<DivisionConfig[]>(response);
  }
};

// Seed API (for Vercel KV deployment)
export const seedApi = {
  seed: async (clear = false) => {
    const response = await fetch(`${API_BASE}/seed?clear=${clear}`, {
      method: 'POST'
    });
    return handleResponse<{ success: boolean; message: string; counts: Record<string, number> }>(response);
  },

  clear: async () => {
    const response = await fetch(`${API_BASE}/seed`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  }
};

// Toast notification helper
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

// Simple toast store (will be used by components)
let toastListeners: Array<(toast: Toast) => void> = [];

export const toast = {
  subscribe: (listener: (toast: Toast) => void) => {
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  },

  show: (type: ToastType, message: string, description?: string) => {
    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      message,
      description
    };

    toastListeners.forEach(listener => listener(toast));
    return toast.id;
  },

  success: (message: string, description?: string) => toast.show('success', message, description),
  error: (message: string, description?: string) => toast.show('error', message, description),
  info: (message: string, description?: string) => toast.show('info', message, description),
  warning: (message: string, description?: string) => toast.show('warning', message, description)
};
