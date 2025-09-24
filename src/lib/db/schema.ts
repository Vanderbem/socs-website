import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const lesson = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonUrl: text('lesson_url').notNull(),
  lessonTitle: text('lesson_title'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teacher = pgTable('teachers', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id').references(() => lesson.id),
  isTeacher: boolean('is_teacher'),
  gradeLevel: text('grade_level'),// i.e., 'K', '3'
  schoolDistrict: text('school_district'), // Added school district field
  interactionType: text('interaction_type').notNull(), // e.g., 'skip', 'submitted'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
