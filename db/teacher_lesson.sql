DROP TABLE IF EXISTS lessons CASCADE;

DROP TABLE IF EXISTS lessons CASCADE;
CREATE TABLE IF NOT EXISTS lessons (
  id integer PRIMARY KEY,
  title text NOT NULL,
  author text NOT NULL,
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