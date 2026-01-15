export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          preferred_language: 'en' | 'ar'
          user_type: 'doctor' | 'patient'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          preferred_language?: 'en' | 'ar'
          user_type: 'doctor' | 'patient'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          preferred_language?: 'en' | 'ar'
          user_type?: 'doctor' | 'patient'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      doctors: {
        Row: {
          id: string
          license_number: string
          verification_status: 'pending' | 'verified' | 'rejected'
          verification_date: string | null
          years_of_experience: number
          cv_url: string | null
          about_en: string | null
          about_ar: string | null
          consultation_fee: number
          location_address: string | null
          location_city: string | null
          location_lat: number | null
          location_lng: number | null
          rating_average: number
          rating_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          license_number: string
          verification_status?: 'pending' | 'verified' | 'rejected'
          verification_date?: string | null
          years_of_experience?: number
          cv_url?: string | null
          about_en?: string | null
          about_ar?: string | null
          consultation_fee?: number
          location_address?: string | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          rating_average?: number
          rating_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          license_number?: string
          verification_status?: 'pending' | 'verified' | 'rejected'
          verification_date?: string | null
          years_of_experience?: number
          cv_url?: string | null
          about_en?: string | null
          about_ar?: string | null
          consultation_fee?: number
          location_address?: string | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          rating_average?: number
          rating_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          emirates_id: string | null
          emirates_id_verified: boolean
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          blood_type: string | null
          medical_history: string | null
          allergies: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          emirates_id?: string | null
          emirates_id_verified?: boolean
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          blood_type?: string | null
          medical_history?: string | null
          allergies?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          emirates_id?: string | null
          emirates_id_verified?: boolean
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          blood_type?: string | null
          medical_history?: string | null
          allergies?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      specialties: {
        Row: {
          id: string
          name_en: string
          name_ar: string
          icon: string | null
          created_at: string
        }
      }
      insurance_providers: {
        Row: {
          id: string
          name_en: string
          name_ar: string
          logo_url: string | null
          is_active: boolean
          created_at: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          start_time: string
          end_time: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          cancellation_reason: string | null
          notes: string | null
          consultation_fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          appointment_date: string
          start_time: string
          end_time: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          cancellation_reason?: string | null
          notes?: string | null
          consultation_fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          appointment_date?: string
          start_time?: string
          end_time?: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          cancellation_reason?: string | null
          notes?: string | null
          consultation_fee?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          appointment_id: string
          doctor_id: string
          patient_id: string
          rating: number
          review_text: string | null
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          doctor_id: string
          patient_id: string
          rating: number
          review_text?: string | null
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          doctor_id?: string
          patient_id?: string
          rating?: number
          review_text?: string | null
          is_verified?: boolean
          created_at?: string
        }
      }
      subscription_tiers: {
        Row: {
          id: string
          name_en: string
          name_ar: string
          price_monthly: number
          max_appointments: number
          priority_listing: boolean
          analytics_access: boolean
          featured_badge: boolean
          description_en: string | null
          description_ar: string | null
          is_active: boolean
          created_at: string
        }
      }
    }
  }
}
