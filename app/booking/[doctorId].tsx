import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

interface DoctorInfo {
  profile: {
    full_name: string;
  };
  consultation_fee: number;
  specialties: Array<{
    specialty: {
      name_en: string;
    };
  }>;
}

export default function BookingScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [dates, setDates] = useState<Date[]>([]);

  useEffect(() => {
    if (doctorId) {
      fetchDoctorInfo();
      generateDates();
    }
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate && doctorId) {
      fetchAvailableSlots();
    }
  }, [selectedDate, doctorId]);

  const generateDates = () => {
    const datesArray: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      datesArray.push(date);
    }
    setDates(datesArray);
  };

  const fetchDoctorInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          consultation_fee,
          profile:profiles!inner(
            full_name
          ),
          specialties:doctor_specialties(
            specialty:specialties(
              name_en
            )
          )
        `)
        .eq('id', doctorId)
        .maybeSingle();

      if (error) throw error;
      setDoctor(data);
    } catch (error) {
      console.error('Error fetching doctor info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const dayOfWeek = selectedDate.getDay();
      const dateString = selectedDate.toISOString().split('T')[0];

      const { data: availabilityData, error: availError } = await supabase
        .from('doctor_availability')
        .select('start_time, end_time, slot_duration')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (availError) throw availError;

      const { data: bookedSlots, error: bookedError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('doctor_id', doctorId)
        .eq('appointment_date', dateString)
        .in('status', ['scheduled', 'confirmed']);

      if (bookedError) throw bookedError;

      const slots: TimeSlot[] = [];

      availabilityData?.forEach((availability) => {
        const slotDuration = availability.slot_duration || 30;
        const startTime = parseTime(availability.start_time);
        const endTime = parseTime(availability.end_time);

        let currentTime = startTime;
        while (currentTime < endTime) {
          const slotEnd = currentTime + slotDuration * 60000;
          if (slotEnd <= endTime) {
            const startTimeStr = formatTimeToString(currentTime);
            const endTimeStr = formatTimeToString(slotEnd);

            const isBooked = bookedSlots?.some(
              (booked) =>
                booked.start_time === startTimeStr && booked.end_time === endTimeStr
            );

            const slotDateTime = new Date(selectedDate);
            const [hours, minutes] = startTimeStr.split(':');
            slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            const isPast = slotDateTime < new Date();

            slots.push({
              start_time: startTimeStr,
              end_time: endTimeStr,
              available: !isBooked && !isPast,
            });
          }
          currentTime = slotEnd;
        }
      });

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  };

  const formatTimeToString = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateFull = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleBookAppointment = async () => {
    if (!user || !selectedSlot || !doctorId) return;

    try {
      setBooking(true);
      const dateString = selectedDate.toISOString().split('T')[0];

      const { error } = await supabase.from('appointments').insert({
        patient_id: user.id,
        doctor_id: doctorId,
        appointment_date: dateString,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        status: 'scheduled',
        consultation_fee: doctor?.consultation_fee || 0,
      } as any);

      if (error) throw error;

      Alert.alert(
        'Booking Confirmed',
        'Your appointment has been booked successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(patient-tabs)/appointments'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      Alert.alert('Booking Failed', error.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.doctorCard}>
          <View style={styles.doctorInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {doctor.profile?.full_name?.charAt(0) || 'D'}
              </Text>
            </View>
            <View style={styles.infoText}>
              <Text style={styles.doctorName}>Dr. {doctor.profile?.full_name}</Text>
              <Text style={styles.specialty}>{primarySpecialty}</Text>
              <Text style={styles.fee}>AED {doctor.consultation_fee}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarIcon size={20} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {dates.map((date, index) => {
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                >
                  <Text
                    style={[styles.dateDay, isSelected && styles.dateDaySelected]}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text
                    style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}
                  >
                    {date.getDate()}
                  </Text>
                  <Text
                    style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}
                  >
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.primary[500]} />
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
          </View>
          <Text style={styles.selectedDateText}>{formatDateFull(selectedDate)}</Text>
          <View style={styles.slotsContainer}>
            {availableSlots.length === 0 ? (
              <Card>
                <Text style={styles.noSlotsText}>No available slots for this date</Text>
              </Card>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot, index) => {
                  const isSelected =
                    selectedSlot?.start_time === slot.start_time;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.slotItem,
                        !slot.available && styles.slotItemDisabled,
                        isSelected && styles.slotItemSelected,
                      ]}
                      onPress={() => slot.available && setSelectedSlot(slot)}
                      disabled={!slot.available}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          !slot.available && styles.slotTextDisabled,
                          isSelected && styles.slotTextSelected,
                        ]}
                      >
                        {formatTime(slot.start_time)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {selectedSlot && (
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Appointment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Doctor:</Text>
              <Text style={styles.summaryValue}>Dr. {doctor.profile?.full_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{formatDateShort(selectedDate)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>
                {formatTime(selectedSlot.start_time)} -{' '}
                {formatTime(selectedSlot.end_time)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total:</Text>
              <Text style={styles.summaryTotalValue}>
                AED {doctor.consultation_fee}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={booking ? 'Booking...' : 'Confirm Booking'}
          onPress={handleBookAppointment}
          disabled={!selectedSlot || booking}
          loading={booking}
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
  doctorCard: {
    margin: spacing.xl,
    marginBottom: 0,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[700],
  },
  infoText: {
    flex: 1,
  },
  doctorName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    marginBottom: spacing.xs / 2,
  },
  specialty: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  fee: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[500],
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
  },
  datesContainer: {
    gap: spacing.sm,
  },
  dateItem: {
    width: 70,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[200],
  },
  dateItemSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  dateDay: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
    marginBottom: spacing.xs / 2,
  },
  dateDaySelected: {
    color: colors.white,
  },
  dateNumber: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    marginBottom: spacing.xs / 2,
  },
  dateNumberSelected: {
    color: colors.white,
  },
  dateMonth: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  dateMonthSelected: {
    color: colors.white,
  },
  selectedDateText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[600],
    marginBottom: spacing.md,
  },
  slotsContainer: {
    marginBottom: spacing.lg,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    minWidth: 100,
    alignItems: 'center',
  },
  slotItemDisabled: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[100],
    opacity: 0.5,
  },
  slotItemSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  slotText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[900],
  },
  slotTextDisabled: {
    color: colors.neutral[400],
  },
  slotTextSelected: {
    color: colors.white,
  },
  noSlotsText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[400],
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  summaryCard: {
    margin: spacing.xl,
    marginTop: 0,
  },
  summaryTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[600],
  },
  summaryValue: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[900],
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  summaryTotalLabel: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
  },
  summaryTotalValue: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[500],
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
});
