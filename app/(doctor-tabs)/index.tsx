import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Users,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

interface DoctorStats {
  totalAppointments: number;
  todayAppointments: number;
  totalEarnings: number;
  rating: number;
  ratingCount: number;
}

interface TodayAppointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  patient: {
    profile: {
      full_name: string;
    };
  };
}

export default function DoctorDashboardScreen() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<DoctorStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    totalEarnings: 0,
    rating: 0,
    ratingCount: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const [doctorData, appointmentsData, todayData] = await Promise.all([
        supabase
          .from('doctors')
          .select('rating_average, rating_count')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('appointments')
          .select('id, consultation_fee')
          .eq('doctor_id', user.id)
          .eq('status', 'completed'),
        supabase
          .from('appointments')
          .select(`
            id,
            start_time,
            end_time,
            status,
            patient:patients!inner(
              profile:profiles!inner(
                full_name
              )
            )
          `)
          .eq('doctor_id', user.id)
          .eq('appointment_date', today)
          .order('start_time', { ascending: true }),
      ]);

      if (doctorData.data) {
        const totalEarnings = (appointmentsData.data as any)?.reduce(
          (sum: number, apt: any) => sum + (apt.consultation_fee || 0),
          0
        ) || 0;

        const doctor = doctorData.data as any;

        setStats({
          totalAppointments: appointmentsData.data?.length || 0,
          todayAppointments: todayData.data?.length || 0,
          totalEarnings,
          rating: doctor.rating_average || 0,
          ratingCount: doctor.rating_count || 0,
        });
      }

      setTodayAppointments((todayData.data as any) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.success[500];
      case 'scheduled':
        return colors.warning[500];
      case 'completed':
        return colors.primary[500];
      default:
        return colors.neutral[500];
    }
  };

  const renderAppointment = ({ item }: { item: TodayAppointment }) => (
    <View style={styles.appointmentItem}>
      <View style={styles.appointmentTime}>
        <Text style={styles.timeText}>{formatTime(item.start_time)}</Text>
      </View>
      <View style={styles.appointmentDetails}>
        <Text style={styles.patientName}>{item.patient.profile.full_name}</Text>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, Dr. {profile?.full_name?.split(' ')[0]}</Text>
          <Text style={styles.subtitle}>Here's your practice overview</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary[50] }]}>
              <CalendarIcon size={24} color={colors.primary[500]} />
            </View>
            <Text style={styles.statValue}>{stats.todayAppointments}</Text>
            <Text style={styles.statLabel}>Today's Appointments</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.secondary[50] }]}>
              <Users size={24} color={colors.secondary[500]} />
            </View>
            <Text style={styles.statValue}>{stats.totalAppointments}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.success[50] }]}>
              <DollarSign size={24} color={colors.success[500]} />
            </View>
            <Text style={styles.statValue}>AED {stats.totalEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning[50] }]}>
              <Star size={24} color={colors.warning[500]} />
            </View>
            <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>
              Rating ({stats.ratingCount} reviews)
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Card style={styles.scheduleCard}>
            {todayAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <CalendarIcon size={48} color={colors.neutral[300]} />
                <Text style={styles.emptyStateText}>No appointments today</Text>
              </View>
            ) : (
              <FlatList
                data={todayAppointments}
                renderItem={renderAppointment}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </Card>
        </View>
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
  greeting: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[600],
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: spacing.lg,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
    textAlign: 'center',
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
  scheduleCard: {
    padding: 0,
  },
  appointmentItem: {
    flexDirection: 'row',
    padding: spacing.lg,
  },
  appointmentTime: {
    width: 80,
    marginRight: spacing.md,
  },
  timeText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[500],
  },
  appointmentDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  patientName: {
    flex: 1,
    fontSize: typography.fontSizes.md,
    color: colors.neutral[900],
    fontWeight: typography.fontWeights.medium,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[600],
    textTransform: 'capitalize',
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyStateText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[400],
    marginTop: spacing.md,
  },
});
