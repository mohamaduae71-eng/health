import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Calendar as CalendarIcon, Clock, MapPin, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  consultation_fee: number;
  doctor: {
    profile: {
      full_name: string;
    };
    location_city: string;
    specialties: Array<{
      specialty: {
        name_en: string;
      };
    }>;
  };
}

export default function PatientAppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, filter]);

  const fetchAppointments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          consultation_fee,
          doctor:doctors!inner(
            profile:profiles!inner(
              full_name
            ),
            location_city,
            specialties:doctor_specialties(
              specialty:specialties(
                name_en
              )
            )
          )
        `)
        .eq('patient_id', user.id);

      if (filter === 'upcoming') {
        query = query
          .gte('appointment_date', today)
          .in('status', ['scheduled', 'confirmed'])
          .order('appointment_date', { ascending: true });
      } else {
        query = query
          .lt('appointment_date', today)
          .order('appointment_date', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await (supabase
        .from('appointments')
        .update as any)({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success[500];
      case 'scheduled':
        return colors.warning[500];
      case 'completed':
        return colors.primary[500];
      case 'cancelled':
        return colors.error[500];
      default:
        return colors.neutral[500];
    }
  };

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const primarySpecialty = item.doctor.specialties?.[0]?.specialty?.name_en || 'General Medicine';

    return (
      <Card style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.doctor.profile.full_name.charAt(0)}
            </Text>
          </View>
          <View style={styles.appointmentInfo}>
            <Text style={styles.doctorName}>{item.doctor.profile.full_name}</Text>
            <Text style={styles.specialty}>{primarySpecialty}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <CalendarIcon size={16} color={colors.neutral[500]} />
            <Text style={styles.detailText}>{formatDate(item.appointment_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color={colors.neutral[500]} />
            <Text style={styles.detailText}>
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.neutral[500]} />
            <Text style={styles.detailText}>{item.doctor.location_city || 'Dubai'}</Text>
          </View>
        </View>

        {filter === 'upcoming' && item.status !== 'cancelled' && (
          <View style={styles.appointmentActions}>
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onPress={() => handleCancelAppointment(item.id)}
            />
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text
            style={[styles.filterButtonText, filter === 'upcoming' && styles.filterButtonTextActive]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'past' && styles.filterButtonActive]}
          onPress={() => setFilter('past')}
        >
          <Text
            style={[styles.filterButtonText, filter === 'past' && styles.filterButtonTextActive]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarIcon size={64} color={colors.neutral[300]} />
            <Text style={styles.emptyStateText}>
              {filter === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={appointments}
            renderItem={renderAppointment}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.appointmentsList}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl * 1.5,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.white,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary[500],
  },
  filterButtonText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[600],
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  appointmentsList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  appointmentCard: {
    marginBottom: 0,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[700],
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    marginBottom: spacing.xs / 2,
  },
  specialty: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'capitalize',
  },
  appointmentDetails: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyStateText: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[400],
    marginTop: spacing.lg,
  },
});
