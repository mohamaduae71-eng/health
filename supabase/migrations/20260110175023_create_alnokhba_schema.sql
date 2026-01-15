/*
  # Al-Nokhba Medical Appointment Booking Platform - Database Schema

  ## Overview
  Complete database schema for a premium medical appointment booking platform
  connecting verified doctors with patients in the UAE market.

  ## New Tables

  ### 1. profiles
  Core user profiles extending Supabase auth.users
  - `id` (uuid, FK to auth.users)
  - `email` (text)
  - `full_name` (text)
  - `phone` (text)
  - `preferred_language` (text) - 'en' or 'ar'
  - `user_type` (text) - 'doctor' or 'patient'
  - `avatar_url` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. specialties
  Medical specialties lookup table
  - `id` (uuid, PK)
  - `name_en` (text) - English name
  - `name_ar` (text) - Arabic name
  - `icon` (text) - Icon identifier
  - `created_at` (timestamptz)

  ### 3. insurance_providers
  UAE insurance providers lookup table
  - `id` (uuid, PK)
  - `name_en` (text)
  - `name_ar` (text)
  - `logo_url` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 4. doctors
  Doctor-specific profile information
  - `id` (uuid, PK, FK to profiles.id)
  - `license_number` (text, unique)
  - `verification_status` (text) - 'pending', 'verified', 'rejected'
  - `verification_date` (timestamptz)
  - `years_of_experience` (integer)
  - `cv_url` (text)
  - `about_en` (text)
  - `about_ar` (text)
  - `consultation_fee` (decimal)
  - `location_address` (text)
  - `location_city` (text)
  - `location_lat` (decimal)
  - `location_lng` (decimal)
  - `rating_average` (decimal)
  - `rating_count` (integer)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. doctor_certifications
  Medical certifications and credentials
  - `id` (uuid, PK)
  - `doctor_id` (uuid, FK to doctors.id)
  - `certificate_name` (text)
  - `issuing_organization` (text)
  - `issue_date` (date)
  - `expiry_date` (date)
  - `certificate_url` (text)
  - `created_at` (timestamptz)

  ### 6. doctor_specialties
  Many-to-many relationship between doctors and specialties
  - `doctor_id` (uuid, FK to doctors.id)
  - `specialty_id` (uuid, FK to specialties.id)
  - `is_primary` (boolean)
  - `created_at` (timestamptz)

  ### 7. doctor_insurance
  Many-to-many relationship between doctors and insurance providers
  - `doctor_id` (uuid, FK to doctors.id)
  - `insurance_provider_id` (uuid, FK to insurance_providers.id)
  - `created_at` (timestamptz)

  ### 8. patients
  Patient-specific profile information
  - `id` (uuid, PK, FK to profiles.id)
  - `emirates_id` (text, unique)
  - `emirates_id_verified` (boolean)
  - `date_of_birth` (date)
  - `gender` (text)
  - `blood_type` (text)
  - `medical_history` (text)
  - `allergies` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 9. subscription_tiers
  Doctor subscription plans
  - `id` (uuid, PK)
  - `name_en` (text)
  - `name_ar` (text)
  - `price_monthly` (decimal)
  - `max_appointments` (integer)
  - `priority_listing` (boolean)
  - `analytics_access` (boolean)
  - `featured_badge` (boolean)
  - `description_en` (text)
  - `description_ar` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 10. doctor_subscriptions
  Active subscriptions for doctors
  - `id` (uuid, PK)
  - `doctor_id` (uuid, FK to doctors.id)
  - `tier_id` (uuid, FK to subscription_tiers.id)
  - `start_date` (timestamptz)
  - `end_date` (timestamptz)
  - `is_active` (boolean)
  - `payment_status` (text)
  - `created_at` (timestamptz)

  ### 11. doctor_availability
  Doctor available time slots
  - `id` (uuid, PK)
  - `doctor_id` (uuid, FK to doctors.id)
  - `day_of_week` (integer) - 0=Sunday, 6=Saturday
  - `start_time` (time)
  - `end_time` (time)
  - `slot_duration` (integer) - minutes
  - `is_available` (boolean)
  - `created_at` (timestamptz)

  ### 12. appointments
  Medical appointments between patients and doctors
  - `id` (uuid, PK)
  - `patient_id` (uuid, FK to patients.id)
  - `doctor_id` (uuid, FK to doctors.id)
  - `appointment_date` (date)
  - `start_time` (time)
  - `end_time` (time)
  - `status` (text) - 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
  - `cancellation_reason` (text)
  - `notes` (text)
  - `consultation_fee` (decimal)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 13. ratings
  Patient ratings and reviews for doctors
  - `id` (uuid, PK)
  - `appointment_id` (uuid, FK to appointments.id, unique)
  - `doctor_id` (uuid, FK to doctors.id)
  - `patient_id` (uuid, FK to patients.id)
  - `rating` (integer) - 1 to 5
  - `review_text` (text)
  - `is_verified` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Implement role-based access control
  - Doctors can only access their own data
  - Patients can only access their own data
  - Public can view verified doctor profiles
  - Only verified appointment attendees can rate

  ## Indexes
  - Performance indexes on frequently queried columns
  - Search indexes for doctor discovery
  - Geographic indexes for location-based search
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  preferred_language text DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
  user_type text NOT NULL CHECK (user_type IN ('doctor', 'patient')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create specialties lookup table
CREATE TABLE IF NOT EXISTS specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Create insurance providers lookup table
CREATE TABLE IF NOT EXISTS insurance_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  license_number text UNIQUE NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_date timestamptz,
  years_of_experience integer DEFAULT 0,
  cv_url text,
  about_en text,
  about_ar text,
  consultation_fee decimal(10,2) DEFAULT 0,
  location_address text,
  location_city text,
  location_lat decimal(10,7),
  location_lng decimal(10,7),
  rating_average decimal(3,2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create doctor certifications table
CREATE TABLE IF NOT EXISTS doctor_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  certificate_name text NOT NULL,
  issuing_organization text NOT NULL,
  issue_date date NOT NULL,
  expiry_date date,
  certificate_url text,
  created_at timestamptz DEFAULT now()
);

-- Create doctor specialties junction table
CREATE TABLE IF NOT EXISTS doctor_specialties (
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  specialty_id uuid NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (doctor_id, specialty_id)
);

-- Create doctor insurance junction table
CREATE TABLE IF NOT EXISTS doctor_insurance (
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  insurance_provider_id uuid NOT NULL REFERENCES insurance_providers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (doctor_id, insurance_provider_id)
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  emirates_id text UNIQUE,
  emirates_id_verified boolean DEFAULT false,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  blood_type text,
  medical_history text,
  allergies text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscription tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  price_monthly decimal(10,2) NOT NULL,
  max_appointments integer DEFAULT 0,
  priority_listing boolean DEFAULT false,
  analytics_access boolean DEFAULT false,
  featured_badge boolean DEFAULT false,
  description_en text,
  description_ar text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create doctor subscriptions table
CREATE TABLE IF NOT EXISTS doctor_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES subscription_tiers(id),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create doctor availability table
CREATE TABLE IF NOT EXISTS doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration integer DEFAULT 30,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  cancellation_reason text,
  notes text,
  consultation_fee decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_verified boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_verification ON doctors(verification_status);
CREATE INDEX IF NOT EXISTS idx_doctors_city ON doctors(location_city);
CREATE INDEX IF NOT EXISTS idx_doctors_rating ON doctors(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_ratings_doctor ON ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_specialties ON doctor_specialties(specialty_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for specialties (public read)
CREATE POLICY "Anyone can view specialties"
  ON specialties FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for insurance providers (public read)
CREATE POLICY "Anyone can view insurance providers"
  ON insurance_providers FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for doctors (public read for verified, own write)
CREATE POLICY "Anyone can view verified doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (verification_status = 'verified' AND is_active = true);

CREATE POLICY "Doctors can view own profile"
  ON doctors FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Doctors can update own profile"
  ON doctors FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Doctors can insert own profile"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for doctor certifications
CREATE POLICY "Anyone can view certifications of verified doctors"
  ON doctor_certifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = doctor_id
      AND doctors.verification_status = 'verified'
    )
  );

CREATE POLICY "Doctors can manage own certifications"
  ON doctor_certifications FOR ALL
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- RLS Policies for doctor specialties
CREATE POLICY "Anyone can view doctor specialties"
  ON doctor_specialties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Doctors can manage own specialties"
  ON doctor_specialties FOR ALL
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- RLS Policies for doctor insurance
CREATE POLICY "Anyone can view doctor insurance"
  ON doctor_insurance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Doctors can manage own insurance"
  ON doctor_insurance FOR ALL
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- RLS Policies for patients
CREATE POLICY "Patients can view own profile"
  ON patients FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Patients can update own profile"
  ON patients FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Patients can insert own profile"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Doctors can view patient profiles for appointments"
  ON patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.patient_id = patients.id
      AND appointments.doctor_id IN (
        SELECT id FROM doctors WHERE doctors.id = auth.uid()
      )
    )
  );

-- RLS Policies for subscription tiers (public read)
CREATE POLICY "Anyone can view subscription tiers"
  ON subscription_tiers FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for doctor subscriptions
CREATE POLICY "Doctors can view own subscriptions"
  ON doctor_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can manage own subscriptions"
  ON doctor_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

-- RLS Policies for doctor availability
CREATE POLICY "Anyone can view doctor availability"
  ON doctor_availability FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Doctors can manage own availability"
  ON doctor_availability FOR ALL
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- RLS Policies for appointments
CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE patients.id = auth.uid())
  );

CREATE POLICY "Doctors can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    doctor_id IN (SELECT id FROM doctors WHERE doctors.id = auth.uid())
  );

CREATE POLICY "Patients can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE patients.id = auth.uid())
  );

CREATE POLICY "Patients can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM patients WHERE patients.id = auth.uid())
  )
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE patients.id = auth.uid())
  );

CREATE POLICY "Doctors can update appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    doctor_id IN (SELECT id FROM doctors WHERE doctors.id = auth.uid())
  )
  WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE doctors.id = auth.uid())
  );

-- RLS Policies for ratings
CREATE POLICY "Anyone can view verified ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (is_verified = true);

CREATE POLICY "Patients can create ratings for completed appointments"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE patients.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.status = 'completed'
      AND appointments.patient_id = auth.uid()
    )
  );

-- Function to update doctor rating average
CREATE OR REPLACE FUNCTION update_doctor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE doctors
  SET 
    rating_average = (
      SELECT COALESCE(AVG(rating), 0)
      FROM ratings
      WHERE doctor_id = NEW.doctor_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings
      WHERE doctor_id = NEW.doctor_id
    )
  WHERE id = NEW.doctor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update doctor rating on new rating
CREATE TRIGGER trigger_update_doctor_rating
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_doctor_rating();

-- Insert sample specialties
INSERT INTO specialties (name_en, name_ar, icon) VALUES
  ('General Medicine', 'الطب العام', 'stethoscope'),
  ('Cardiology', 'أمراض القلب', 'heart'),
  ('Dermatology', 'الأمراض الجلدية', 'scan-face'),
  ('Pediatrics', 'طب الأطفال', 'baby'),
  ('Orthopedics', 'جراحة العظام', 'bone'),
  ('Neurology', 'الأمراض العصبية', 'brain'),
  ('Ophthalmology', 'طب العيون', 'eye'),
  ('Dentistry', 'طب الأسنان', 'tooth'),
  ('Psychiatry', 'الطب النفسي', 'brain'),
  ('Gynecology', 'أمراض النساء', 'user')
ON CONFLICT DO NOTHING;

-- Insert sample insurance providers
INSERT INTO insurance_providers (name_en, name_ar, is_active) VALUES
  ('Dubai Health Authority', 'هيئة الصحة دبي', true),
  ('Abu Dhabi Health Services', 'خدمات الصحة أبوظبي', true),
  ('Daman Insurance', 'ضمان للتأمين', true),
  ('Oman Insurance Company', 'شركة عمان للتأمين', true),
  ('MetLife AIG ANB', 'ميتلايف', true),
  ('AXA Insurance', 'أكسا للتأمين', true),
  ('Cigna Insurance', 'سيجنا للتأمين', true),
  ('Aetna International', 'إيتنا الدولية', true)
ON CONFLICT DO NOTHING;

-- Insert sample subscription tiers
INSERT INTO subscription_tiers (name_en, name_ar, price_monthly, max_appointments, priority_listing, analytics_access, featured_badge, description_en, description_ar) VALUES
  ('Basic', 'أساسي', 299.00, 50, false, false, false, 'Perfect for starting your practice', 'مثالي لبدء ممارستك الطبية'),
  ('Professional', 'احترافي', 599.00, 150, true, true, false, 'Enhanced visibility and analytics', 'رؤية محسنة وتحليلات'),
  ('Premium', 'مميز', 999.00, -1, true, true, true, 'Unlimited appointments and featured listing', 'مواعيد غير محدودة وقائمة مميزة')
ON CONFLICT DO NOTHING;