import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const gradeLevel = pgEnum('grade_level', ['K', '1', '2', '3', '4', '5']);

export const lessonSubject = pgEnum('lesson_subject', [
  'ELA',
  'ELA Cooking',
  'ELD',
  'Math',
  'Other',
  'PE',
  'Science',
  'SEL',
  'Social Studies',
]);

export const ctConcept = pgEnum('ct_concept', [
  'Abstraction',
  'Algorithms',
  'Decomposition',
  'Pattern Recognition',
]);

export const teachers = pgTable('teachers', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  grade: gradeLevel('grade'),
  district: text('district'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const lessons = pgTable('lessons', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  grades: gradeLevel('grades').array().notNull(),
  subjects: lessonSubject('subjects').array().notNull(),
  ctConcepts: ctConcept('ct_concepts').array().notNull(),
  englishFolder: text('english_folder').notNull(),
  englishLesson: text('english_lesson'),
  spanishFolder: text('spanish_folder'),
  spanishLesson: text('spanish_lesson'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accessLogs = pgTable('access_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => teachers.id, { onDelete: 'cascade' }),
  lessonId: integer('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  isSpanish: boolean('is_spanish').default(false).notNull(),
  timeAccessed: timestamp('time_accessed').defaultNow().notNull(),
});

export type GradeLevel = (typeof gradeLevel.enumValues)[number];
export type LessonSubject = (typeof lessonSubject.enumValues)[number];
export type CtConcept = (typeof ctConcept.enumValues)[number];
