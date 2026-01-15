import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Shield,
  Award,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

interface DoctorProfile {
  verification_status: string;
  license_number: string;
  years_of_experience: number;
  consultation_fee: number;
  location_city: string;
}

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { profile, signOut, user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  const fetchDoctorProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('verification_status, license_number, years_of_experience, consultation_fee, location_city')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setDoctorProfile(data);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const getVerificationIcon = () => {
    switch (doctorProfile?.verification_status) {
      case 'verified':
        return <CheckCircle size={24} color={colors.success[500]} />;
      case 'rejected':
        return <XCircle size={24} color={colors.error[500]} />;
      default:
        return <Clock size={24} color={colors.warning[500]} />;
    }
  };

  const getVerificationText = () => {
    switch (doctorProfile?.verification_status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const getVerificationColor = () => {
    switch (doctorProfile?.verification_status) {
      case 'verified':
        return colors.success[500];
      case 'rejected':
        return colors.error[500];
      default:
        return colors.warning[500];
    }
  };

  const menuItems = [
    {
      icon: Shield,
      label: 'Edit Profile',
      subtitle: 'Update your professional information',
      onPress: () => {},
    },
    {
      icon: Award,
      label: 'Certifications',
      subtitle: 'Manage your medical certifications',
      onPress: () => {},
    },
    {
      icon: CreditCard,
      label: 'Subscription',
      subtitle: 'Manage your subscription plan',
      onPress: () => {},
    },
    {
      icon: Settings,
      label: 'Settings',
      subtitle: 'App preferences and privacy',
      onPress: () => {},
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0) || 'D'}
            </Text>
          </View>
          <Text style={styles.name}>Dr. {profile?.full_name}</Text>
          <Text style={styles.email}>{profile?.email}</Text>

          <View style={styles.verificationBadge}>
            {getVerificationIcon()}
            <Text style={[styles.verificationText, { color: getVerificationColor() }]}>
              {getVerificationText()}
            </Text>
          </View>
        </Card>

        {doctorProfile && (
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>License Number</Text>
              <Text style={styles.infoValue}>
                {doctorProfile.license_number || 'Not set'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoValue}>
                {doctorProfile.years_of_experience} years
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Consultation Fee</Text>
              <Text style={styles.infoValue}>
                AED {doctorProfile.consultation_fee}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {doctorProfile.location_city || 'Not set'}
              </Text>
            </View>
          </Card>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <item.icon size={20} color={colors.primary[500]} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleSignOut}
            style={styles.signOutButton}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  profileCard: {
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSizes.xxxl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary[700],
  },
  name: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[600],
    marginBottom: spacing.md,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[50],
  },
  verificationText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  infoCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral[600],
  },
  infoValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.neutral[900],
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[900],
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.xs / 2,
  },
  menuItemSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.neutral[500],
  },
  signOutButton: {
    marginHorizontal: spacing.xl,
  },
});
