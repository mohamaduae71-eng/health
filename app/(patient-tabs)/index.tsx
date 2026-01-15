import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Search, MapPin, Star, Filter } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

interface Doctor {
  id: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
  consultation_fee: number;
  location_city: string | null;
  rating_average: number;
  rating_count: number;
  specialties: Array<{
    specialty: {
      name_en: string;
      name_ar: string;
    };
  }>;
}

export default function PatientHomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState<any[]>([]);

  useEffect(() => {
    fetchDoctors();
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .limit(6);

      if (error) throw error;
      setSpecialties(data || []);
    } catch (error) {
      console.error('Error fetching specialties:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          id,
          consultation_fee,
          location_city,
          rating_average,
          rating_count,
          profile:profiles!inner(
            full_name,
            avatar_url
          ),
          specialties:doctor_specialties(
            specialty:specialties(
              name_en,
              name_ar
            )
          )
        `)
        .eq('verification_status', 'verified')
        .eq('is_active', true)
        .order('rating_average', { ascending: false })
        .limit(20);

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDoctorCard = ({ item }: { item: Doctor }) => {
    const primarySpecialty = item.specialties?.[0]?.specialty?.name_en || 'General Medicine';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/doctor/${item.id}`)}
      >
        <Card style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.profile?.full_name?.charAt(0) || 'D'}
              </Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{item.profile?.full_name}</Text>
              <Text style={styles.specialty}>{primarySpecialty}</Text>
              <View style={styles.location}>
                <MapPin size={14} color={colors.neutral[500]} />
                <Text style={styles.locationText}>
                  {item.location_city || 'Dubai'}
                </Text>
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <Star size={16} color={colors.warning[500]} fill={colors.warning[500]} />
              <Text style={styles.rating}>{item.rating_average.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({item.rating_count})</Text>
            </View>
          </View>
          <View style={styles.doctorFooter}>
            <Text style={styles.fee}>AED {item.consultation_fee}</Text>
            <Text style={styles.feeLabel}>Consultation Fee</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderSpecialtyChip = (specialty: any) => (
    <TouchableOpacity
      key={specialty.id}
      style={styles.specialtyChip}
      onPress={() => {}}
    >
      <Text style={styles.specialtyChipText}>{specialty.name_en}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {profile?.full_name}</Text>
        <Text style={styles.subtitle}>Find your medical specialist</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors, specialties..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtiesContainer}
          >
            {specialties.map(renderSpecialtyChip)}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Rated Doctors</Text>
          <FlatList
            data={doctors}
            renderItem={renderDoctorCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.doctorsList}
          />
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.neutral[900],
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  specialtiesContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  specialtyChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  specialtyChipText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.neutral[700],
  },
  doctorsList: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  doctorCard: {
    marginBottom: 0,
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
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
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  specialty: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  ratingContainer: {
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
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  doctorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  fee: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[500],
  },
  feeLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
});
