import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

interface AddAvailabilityModalProps {
  visible: boolean;
  dayOfWeek: number;
  dayName: string;
  onClose: () => void;
  onAdd: (startTime: string, endTime: string, slotDuration: number) => Promise<void>;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];
const SLOT_DURATIONS = [15, 30, 45, 60];

export const AddAvailabilityModal: React.FC<AddAvailabilityModalProps> = ({
  visible,
  dayOfWeek,
  dayName,
  onClose,
  onAdd,
}) => {
  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(17);
  const [endMinute, setEndMinute] = useState(0);
  const [slotDuration, setSlotDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  const formatTime = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  };

  const handleAdd = async () => {
    const startTime = formatTime(startHour, startMinute);
    const endTime = formatTime(endHour, endMinute);

    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    if (start >= end) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }

    setLoading(true);
    try {
      await onAdd(startTime, endTime, slotDuration);
      onClose();
    } catch (error) {
      console.error('Error adding availability:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Availability</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.dayName}>{dayName}</Text>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.label}>Start Time</Text>
              <View style={styles.timePickerRow}>
                <ScrollView
                  style={styles.timePicker}
                  showsVerticalScrollIndicator={false}
                >
                  {HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeItem,
                        startHour === hour && styles.timeItemSelected,
                      ]}
                      onPress={() => setStartHour(hour)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          startHour === hour && styles.timeTextSelected,
                        ]}
                      >
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.timeSeparator}>:</Text>
                <ScrollView
                  style={styles.timePicker}
                  showsVerticalScrollIndicator={false}
                >
                  {MINUTES.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeItem,
                        startMinute === minute && styles.timeItemSelected,
                      ]}
                      onPress={() => setStartMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          startMinute === minute && styles.timeTextSelected,
                        ]}
                      >
                        {String(minute).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>End Time</Text>
              <View style={styles.timePickerRow}>
                <ScrollView
                  style={styles.timePicker}
                  showsVerticalScrollIndicator={false}
                >
                  {HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeItem,
                        endHour === hour && styles.timeItemSelected,
                      ]}
                      onPress={() => setEndHour(hour)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          endHour === hour && styles.timeTextSelected,
                        ]}
                      >
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.timeSeparator}>:</Text>
                <ScrollView
                  style={styles.timePicker}
                  showsVerticalScrollIndicator={false}
                >
                  {MINUTES.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeItem,
                        endMinute === minute && styles.timeItemSelected,
                      ]}
                      onPress={() => setEndMinute(minute)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          endMinute === minute && styles.timeTextSelected,
                        ]}
                      >
                        {String(minute).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Appointment Duration (minutes)</Text>
              <View style={styles.durationContainer}>
                {SLOT_DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      slotDuration === duration && styles.durationButtonSelected,
                    ]}
                    onPress={() => setSlotDuration(duration)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        slotDuration === duration && styles.durationTextSelected,
                      ]}
                    >
                      {duration} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title={loading ? 'Adding...' : 'Add Availability'}
              onPress={handleAdd}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary[500],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[700],
    marginBottom: spacing.md,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  timePicker: {
    height: 150,
    width: 80,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  timeItem: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  timeItemSelected: {
    backgroundColor: colors.primary[500],
  },
  timeText: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[700],
  },
  timeTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeights.bold,
  },
  timeSeparator: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[600],
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    alignItems: 'center',
  },
  durationButtonSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  durationText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[700],
  },
  durationTextSelected: {
    color: colors.primary[700],
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
});
