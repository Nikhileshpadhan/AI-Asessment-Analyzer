-- ============================================
-- AnalytixAI — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Sections (classes) created by teachers
CREATE TABLE IF NOT EXISTS sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Analyzed assignments stored per section
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT DEFAULT 'Unknown Student',
  student_id TEXT DEFAULT '',
  file_name TEXT NOT NULL,
  relevance INT DEFAULT 0,
  understanding INT DEFAULT 0,
  logic INT DEFAULT 0,
  structure INT DEFAULT 0,
  clarity INT DEFAULT 0,
  overall_score INT DEFAULT 0,
  questions_solved INT DEFAULT 0,
  per_question_feedback JSONB DEFAULT '[]'::jsonb,
  feedback TEXT DEFAULT '',
  analyzed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row-Level Security (RLS)
-- Teachers can ONLY access their own data
-- ============================================

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Sections: full CRUD for owner only
CREATE POLICY "Teachers manage own sections"
  ON sections FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Assignments: full CRUD for owner only
CREATE POLICY "Teachers manage own assignments"
  ON assignments FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sections_teacher ON sections(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_section ON assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
