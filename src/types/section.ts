import { Activity } from "./activity";
import { Course } from "./course";
import { User } from "./user";

// Section: renamed from the old `Course` — a concrete offering under a
// parent catalog Course (tutor, dates, activities, enrollments). Mirrors
// BackSpa `src/section/entities/section.entity.ts` and
// `src/section/dto/create-section.dto.ts` exactly.
export interface Section {
  id?: number;
  name: string;
  initialDate: Date;
  endDate: Date;
  duration: number;
  installmentsCount?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  activities: Activity[];
  tutor?: User;
  id_tutor?: string;
  course?: Course;
  id_course: number;
}

export interface CreateSection
  extends Omit<Section, 'id' | 'createdAt' | 'updatedAt' | 'activities' | 'tutor' | 'course'> {
  activities: { id?: number; name: string; percentage: number; new?: boolean }[];
}
