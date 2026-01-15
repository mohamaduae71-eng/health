import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Plus, Clock, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { AddAvailabilityModal } from '@/components/AddAvailabilityModal';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_available: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorCalendarScreen() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  useEffect(() => {
    if (user) {
      fetchAvailability();
    }
  }, [user]);

  const fetchAvailability = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', user.id)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_availability')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
      fetchAvailability();
    } catch (error) {
      console.error('Error deleting slot:', error);
    }
  };

  const handleAddAvailability = async (
    startTime: string,
    endTime: string,
    slotDuration: number
  ) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.from('doctor_availability').insert({
        doctor_id: user.id,
        day_of_week: selectedDayIndex,
        start_time: startTime,
        end_time: endTime,
        slot_duration: slotDuration,
        is_available: true,
      } as any);

      if (error) throw error;

      Alert.alert('Success', 'Availability added successfully');
      fetchAvailability();
    } catch (error: any) {
      console.error('Error adding availability:', error);
      Alert.alert('Error', error.message || 'Failed to add availability');
      throw error;
    }
  };

  const openAddModal = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
    setModalVisible(true);
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderDaySlots = (dayIndex: number) => {
    const daySlots = availability.filter(slot => slot.day_of_week === dayIndex);

    return (
      <Card style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayName}>{DAYS[dayIndex]}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openAddModal(dayIndex)}
          >
            <Plus size={20} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {daySlots.length === 0 ? (
          <Text style={styles.noSlotsText}>No availability set</Text>
        ) : (
          <View style={styles.slotsList}>
            {daySlots.map((slot) => (
              <View key={slot.id} style={styles.slotItem}>
                <View style={styles.slotInfo}>
                  <Clock size={16} color={colors.neutral[500]} />
                  <Text style={styles.slotTime}>
                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </Text>
                  <Text style={styles.slotDuration}>({slot.slot_duration} min)</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteSlot(slot.id)}
                >
                  <Trash2 size={16} color={colors.error[500]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Calendar</Text>
        <Text style={styles.subtitle}>Manage your availability</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.daysContainer}>
          {DAYS.map((_, index) => renderDaySlots(index))}
        </View>
      </ScrollView>

      <AddAvailabilityModal
        visible={modalVisible}
        dayOfWeek={selectedDayIndex}
        dayName={DAYS[selectedDayIndex]}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddAvailability}
      />
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
  daysContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  dayCard: {
    padding: spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[400],
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  slotsList: {
    gap: spacing.sm,
  },
  slotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  slotTime: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[900],
    fontWeight: typography.fontWeights.medium,
  },
  slotDuration: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  deleteButton: {
    padding: spacing.sm,
  },
});
