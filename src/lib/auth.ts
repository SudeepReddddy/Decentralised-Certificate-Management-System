import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface University {
  id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  university_id: string;
  roll_number: string;
  name: string;
  email?: string;
  phone?: string;
  course?: string;
  year_of_admission?: number;
  graduation_year?: number;
  status: 'active' | 'graduated' | 'suspended';
  created_at: string;
  updated_at: string;
  university?: University;
}

export interface AuthUser {
  id: string;
  type: 'university' | 'student';
  data: University | Student;
  sessionToken: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;

  // University Registration
  async registerUniversity(data: {
    name: string;
    email: string;
    password: string;
    address?: string;
    phone?: string;
    website?: string;
  }): Promise<{ success: boolean; error?: string; university?: University }> {
    try {
      // Check if university already exists
      const { data: existingUniversity } = await supabase
        .from('universities')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingUniversity) {
        return { success: false, error: 'University with this email already exists' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Insert university
      const { data: university, error } = await supabase
        .from('universities')
        .insert({
          name: data.name,
          email: data.email,
          password_hash: passwordHash,
          address: data.address,
          phone: data.phone,
          website: data.website,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, university };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // University Login
  async loginUniversity(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      const { data: university, error } = await supabase
        .from('universities')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !university) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, university.password_hash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

      await supabase.from('user_sessions').insert({
        user_id: university.id,
        user_type: 'university',
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

      const user: AuthUser = {
        id: university.id,
        type: 'university',
        data: university,
        sessionToken,
      };

      this.currentUser = user;
      localStorage.setItem('auth_user', JSON.stringify(user));

      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Student Login
  async loginStudent(universityEmail: string, rollNumber: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      // First find the university
      const { data: university, error: univError } = await supabase
        .from('universities')
        .select('id, name, email')
        .eq('email', universityEmail)
        .single();

      if (univError || !university) {
        return { success: false, error: 'University not found' };
      }

      // Find the student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*, universities(*)')
        .eq('university_id', university.id)
        .eq('roll_number', rollNumber)
        .single();

      if (studentError || !student) {
        return { success: false, error: 'Student not found' };
      }

      if (student.status !== 'active') {
        return { success: false, error: 'Student account is not active' };
      }

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

      await supabase.from('user_sessions').insert({
        user_id: student.id,
        user_type: 'student',
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

      const user: AuthUser = {
        id: student.id,
        type: 'student',
        data: student,
        sessionToken,
      };

      this.currentUser = user;
      localStorage.setItem('auth_user', JSON.stringify(user));

      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Logout
  async logout(): Promise<void> {
    if (this.currentUser) {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', this.currentUser.sessionToken);
    }

    this.currentUser = null;
    localStorage.removeItem('auth_user');
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    if (this.currentUser) return this.currentUser;

    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch {
        localStorage.removeItem('auth_user');
      }
    }

    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Check if user is university
  isUniversity(): boolean {
    const user = this.getCurrentUser();
    return user?.type === 'university';
  }

  // Check if user is student
  isStudent(): boolean {
    const user = this.getCurrentUser();
    return user?.type === 'student';
  }

  // Validate session
  async validateSession(): Promise<boolean> {
    const user = this.getCurrentUser();
    if (!user) return false;

    try {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('expires_at')
        .eq('session_token', user.sessionToken)
        .single();

      if (!session || new Date(session.expires_at) < new Date()) {
        await this.logout();
        return false;
      }

      return true;
    } catch {
      await this.logout();
      return false;
    }
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export const authService = new AuthService();