// Catalog Course: public-facing parent entity only (name/description/image).
// Section-level fields (tutor, dates, duration, activities, enrollments)
// moved to the new `Section` type — see ./section.ts.
export interface Course {
  id?: number;
  name: string;
  description: string;
  imageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateCourse = Omit<Course, 'id' | 'createdAt' | 'updatedAt'>;