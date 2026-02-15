export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  accessCode?: string;
  personalTrainer?: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface Student {
  id: string;
  name: string;
  accessCode: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  weight?: number;
  height?: number;
  trainingDays: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest?: string;
  weight?: string;
  notes?: string;
  order: number;
}

export interface Workout {
  id: string;
  name: string;
  dayOfWeek: string;
  description?: string;
  isActive: boolean;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  read: boolean;
  fromPersonal: boolean;
  createdAt: string;
  student: {
    name: string;
  };
  personalTrainer: {
    name: string;
  };
}

export interface ProgressRecord {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  arm?: number;
  thigh?: number;
  calf?: number;
  notes?: string;
  photoUrl?: string;
}

export type UserType = 'personal' | 'student';
