import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Star,
  Calendar,
  Clock,
  DollarSign,
  Award,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

interface DoctorDetails {
  id: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
  consultation_fee: number;
  location_city: string | null;
  location_address: string | null;
  rating_average: number;
  rating_count: number;
  years_of_experience: number;
  about_en: string | null;
  specialties: Array<{
    specialty: {
      id: string;
      name_en: string;
      name_ar: string;
    };
  }>;
  availability: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDoctorDetails();
    }
  }, [id]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          id,
          consultation_fee,
          location_city,
          location_address,
          rating_average,
          rating_count,
          years_of_experience,
          about_en,
          profile:profiles!inner(
            full_name,
            avatar_url
          ),
          specialties:doctor_specialties(
            specialty:specialties(
              id,
              name_en,
              name_ar
            )
          ),
          availability:doctor_availability(
            id,
            day_of_week,
            start_time,
            end_time
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setDoctor(data);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAvailabilityByDay = () => {
    if (!doctor?.availability) return {};

    const grouped: { [key: number]: Array<{ start_time: string; end_time: string }> } = {};
    doctor.availability.forEach((slot) => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = [];
      }
      grouped[slot.day_of_week].push({
        start_time: slot.start_time,
        end_time: slot.end_time,
      });
    });
    return grouped;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Doctor not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const primarySpecialty = doctor.specialties?.[0]?.specialty?.name_en || 'General Medicine';
  const availabilityByDay = getAvailabilityByDay();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {doctor.profile?.full_name?.charAt(0) || 'D'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.doctorName}>Dr. {doctor.profile?.full_name}</Text>
              <Text style={styles.specialty}>{primarySpecialty}</Text>
              <View style={styles.ratingRow}>
                <Star size={16} color={colors.warning[500]} fill={colors.warning[500]} />
                <Text style={styles.rating}>{doctor.rating_average.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({doctor.rating_count} reviews)</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Award size={20} color={colors.primary[500]} />
              <Text style={styles.statValue}>{doctor.years_of_experience}+</Text>
              <Text style={styles.statLabel}>Years Exp.</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MapPin size={20} color={colors.primary[500]} />
              <Text style={styles.statValue}>{doctor.location_city || 'Dubai'}</Text>
              <Text style={styles.statLabel}>Location</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <DollarSign size={20} color={colors.primary[500]} />
              <Text style={styles.statValue}>AED {doctor.consultation_fee}</Text>
              <Text style={styles.statLabel}>Consultation</Text>
            </View>
          </View>
        </Card>

        {doctor.about_en && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Card>
              <Text style={styles.aboutText}>{doctor.about_en}</Text>
            </Card>
          </View>
        )}

        {doctor.location_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clinic Address</Text>
            <Card>
              <View style={styles.addressRow}>
                <MapPin size={20} color={colors.primary[500]} />
                <Text style={styles.addressText}>{doctor.location_address}</Text>
              </View>
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <Card>
            {Object.keys(availabilityByDay).length === 0 ? (
              <Text style={styles.noAvailabilityText}>
                No availability set by doctor
              </Text>
            ) : (
              <View style={styles.availabilityList}>
                {Object.entries(availabilityByDay).map(([day, slots]) => (
                  <View key={day} style={styles.availabilityDay}>
                    <Text style={styles.dayName}>{DAYS[parseInt(day)]}</Text>
                    <View style={styles.timeSlots}>
                      {slots.map((slot, index) => (
                        <Text key={index} style={styles.timeSlot}>
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>

        <View style={styles.specialtiesSection}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {doctor.specialties?.map((item) => (
              <View key={item.specialty.id} style={styles.specialtyChip}>
                <Text style={styles.specialtyChipText}>{item.specialty.name_en}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeAmount}>AED {doctor.consultation_fee}</Text>
        </View>
        <Button
          title="Book Appointment"
          onPress={() => router.push(`/booking/${id}`)}
          style={styles.bookButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.neutral[50],
  },
  errorText: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl * 1.5,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    margin: spacing.xl,
    marginBottom: 0,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[700],
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  specialty: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[600],
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
  },
  ratingCount: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[500],
  },
  statsContainer: {
    flexDirection: 'row',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    marginTop: spacing.xs / 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.neutral[100],
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  aboutText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[700],
    lineHeight: typography.lineHeights.relaxed * typography.fontSizes.md,
  },
  addressRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  addressText: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.neutral[700],
    lineHeight: typography.lineHeights.relaxed * typography.fontSizes.md,
  },
  availabilityList: {
    gap: spacing.md,
  },
  availabilityDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    width: 100,
  },
  timeSlots: {
    flex: 1,
    gap: spacing.xs,
  },
  timeSlot: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  noAvailabilityText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[400],
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  specialtiesSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  specialtyChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
  },
  specialtyChipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.primary[700],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  feeContainer: {
    flex: 1,
  },
  feeLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    marginBottom: spacing.xs / 2,
  },
  feeAmount: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[500],
  },
  bookButton: {
    flex: 1,
  },
});
