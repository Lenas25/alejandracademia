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
  // `id_course` is an *input-only* FK: SectionService.findAll()/findOne()
  // never selects it back (it's only exposed via the `course` relation), so
  // it must be optional here — a required scalar would misrepresent the
  // real GET /section response shape (fixed per PR3 verify-report WARNING).
  id_course?: number;
}

type ActivityInput = { id?: number; name: string; percentage: number; new?: boolean };

export interface CreateSection
  extends Omit<Section, 'id' | 'createdAt' | 'updatedAt' | 'activities' | 'tutor' | 'course' | 'id_course'> {
  id_course: number;
  activities: ActivityInput[];
}

// Update-shaped payload matching `UpdateSectionDto` (PartialType(CreateSectionDto)
// + isActive) exactly — every field optional, no nested `course`/`tutor`
// objects or raw `Activity[]`. Used by `updateSection` so the PATCH thunk
// can never leak non-whitelisted properties past the backend's
// `forbidNonWhitelisted: true` ValidationPipe (fixed per PR3 verify-report
// WARNING: the previous `Section`-shaped payload sent nested `course`/
// `tutor` objects and would have been rejected with 400 the first time a
// real edit flow used it).
export interface UpdateSection extends Partial<Omit<CreateSection, 'activities'>> {
  activities?: ActivityInput[];
  isActive?: boolean;
}
