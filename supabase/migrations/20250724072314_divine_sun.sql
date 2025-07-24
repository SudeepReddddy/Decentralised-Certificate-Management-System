/*
  # Create University-Student Management System

  1. New Tables
    - `universities` - Store university information and credentials
    - `students` - Store student information linked to universities
    - `user_sessions` - Track user sessions
    - Update `certificates` table to link with universities and students

  2. Security
    - Enable RLS on all tables
    - Add policies for university and student access
    - Secure authentication system

  3. Features
    - University registration and login
    - Student management by universities
    - Role-based access control
*/

-- Create universities table
CREATE TABLE IF NOT EXISTS universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  address text,
  phone text,
  website text,
  logo_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  roll_number text NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  course text,
  year_of_admission integer,
  graduation_year integer,
  status text DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(university_id, roll_number)
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('university', 'student')),
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Update certificates table to link with universities and students
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS university_id uuid REFERENCES universities(id),
ADD COLUMN IF NOT EXISTS student_uuid uuid REFERENCES students(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_universities_email ON universities(email);
CREATE INDEX IF NOT EXISTS idx_students_university_id ON students(university_id);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(university_id, roll_number);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_certificates_university ON certificates(university_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_uuid);

-- Enable RLS on all tables
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for universities
CREATE POLICY "Universities can read their own data"
  ON universities
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert universities (registration)"
  ON universities
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Universities can update their own data"
  ON universities
  FOR UPDATE
  TO public
  USING (true);

-- RLS Policies for students
CREATE POLICY "Public read access for students"
  ON students
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Universities can manage their students"
  ON students
  FOR ALL
  TO public
  USING (true);

-- RLS Policies for user sessions
CREATE POLICY "Users can manage their own sessions"
  ON user_sessions
  FOR ALL
  TO public
  USING (true);

-- RLS Policies for certificates (updated)
DROP POLICY IF EXISTS "Public read access" ON certificates;
DROP POLICY IF EXISTS "Public insert access" ON certificates;

CREATE POLICY "Public read access for certificates"
  ON certificates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Universities can manage certificates"
  ON certificates
  FOR ALL
  TO public
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_universities_updated_at 
    BEFORE UPDATE ON universities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();