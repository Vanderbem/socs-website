CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS access_logs CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;

DROP TYPE IF EXISTS grade_level CASCADE;
DROP TYPE IF EXISTS lesson_subject CASCADE;
DROP TYPE IF EXISTS ct_concept CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grade_level') THEN
    CREATE TYPE grade_level AS ENUM ('K', '1', '2', '3', '4', '5');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_subject') THEN
    CREATE TYPE lesson_subject AS ENUM (
      'ELA',
      'ELD',
      'Math',
      'Other',
      'PE',
      'Science',
      'SEL',
      'Social Studies'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ct_concept') THEN
    CREATE TYPE ct_concept AS ENUM (
      'Abstraction',
      'Algorithms',
      'Decomposition',
      'Pattern Recognition'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL UNIQUE,
  email text NOT NULL,
  name text,
  grade grade_level,
  district text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lessons (
  id integer PRIMARY KEY,
  title text NOT NULL,
  grades grade_level[] NOT NULL,
  subjects lesson_subject[] NOT NULL,
  ct_concepts ct_concept[] NOT NULL,
  english_folder text NOT NULL,
  english_lesson text,
  spanish_folder text,
  spanish_lesson text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  lesson_id integer NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_spanish boolean NOT NULL DEFAULT false,
  time_accessed timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS access_logs_teacher_id_idx ON access_logs (teacher_id);
CREATE INDEX IF NOT EXISTS access_logs_lesson_id_idx ON access_logs (lesson_id);
CREATE INDEX IF NOT EXISTS access_logs_time_accessed_idx ON access_logs (time_accessed);

INSERT INTO lessons (
  id,
  title,
  grades,
  subjects,
  ct_concepts,
  english_folder,
  english_lesson,
  spanish_folder,
  spanish_lesson
) VALUES
  (
    45,
    'Decomposing teen numbers into a ten and some ones',
    ARRAY['1']::grade_level[],
    ARRAY['Math']::lesson_subject[],
    ARRAY['Decomposition']::ct_concept[],
    'https://drive.google.com/drive/folders/17DWXfXgUnFHGFk2vPaBe1A8J_ZikdoJP?usp=drive_link',
    'https://docs.google.com/document/d/1Q7IUp2ykLRpCGopCvJY51Wy4quk4E9HqtxdE8EMwzhE/edit',
    'https://drive.google.com/drive/folders/1Qf9IJeQxF7H2BOQawCbL6tC8lIb0GRsm',
    'https://docs.google.com/document/d/1doxuOyEv-l7LojvpdWTsOZuJX-8wh-L7oVwV0EABlHo/edit'
  ),
  (
    63,
    'What are living and nonliving things?',
    ARRAY['1']::grade_level[],
    ARRAY['ELA']::lesson_subject[],
    ARRAY['Algorithms']::ct_concept[],
    'https://drive.google.com/drive/folders/1V4-XarBA-RIi7jliR5riDHW82eAjyYB7?usp=drive_link',
    'https://docs.google.com/document/d/1Ryy6NdvkSTqxFoskKMfC5u0D_q0KIxwqwybYLzYDiVw/edit',
    'https://drive.google.com/drive/folders/1NES0d6Cn1RJIUr8MZTbJGe0pvSpZdrqt',
    'https://docs.google.com/document/d/1gTP5E1ZEFMx7qIv63-FhmuprNqwv9WycDzMlL0y3tIs/edit'
  ),
  (
    83,
    'Diorama of Habitat and Graphic Organizer',
    ARRAY['1']::grade_level[],
    ARRAY['ELA']::lesson_subject[],
    ARRAY['Abstraction']::ct_concept[],
    'https://drive.google.com/drive/folders/1bvEwl2f-U8qG3kAvkgSvaLlMQ6sOIkl3',
    'https://docs.google.com/document/d/1Owb7K4DYb8qXbje86E2Iguo-dz5hUBFpifkUV_zCQv4/edit?tab=t.0',
    NULL,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  grades = EXCLUDED.grades,
  subjects = EXCLUDED.subjects,
  ct_concepts = EXCLUDED.ct_concepts,
  english_folder = EXCLUDED.english_folder,
  english_lesson = EXCLUDED.english_lesson,
  spanish_folder = EXCLUDED.spanish_folder,
  spanish_lesson = EXCLUDED.spanish_lesson,
  updated_at = now();
