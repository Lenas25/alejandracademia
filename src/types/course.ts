import { Activity } from "./activity";

export interface Course {
  id?: number;
  name: string;
  description: string;
  imageUrl: string;
  initialDate: Date;
  endDate: Date;
  duration: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  activities: Activity[];
}

export interface CreateCourse extends Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'activities'> {
  activities: {name:string; percentage:number; new?:boolean}[];
}