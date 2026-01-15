import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Stethoscope } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { session, loading, profile } = useAuth();

  React.useEffect(() => {
    if (!loading && session && profile) {
      if (profile.user_type === 'doctor') {
        router.replace('/(doctor-tabs)');
      } else {
        router.replace('/(patient-tabs)');
      }
    }
  }, [session, loading, profile]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stethoscope size={48} color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Stethoscope size={64} color={colors.primary[500]} />
        </View>
        <Text style={styles.title}>Al-Nokhba</Text>
        <Text style={styles.subtitle}>Premium Medical Care at Your Fingertips</Text>
        <Text style={styles.subtitleArabic}>رعاية طبية متميزة في متناول يدك</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.featureContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Verified Medical Professionals</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Instant Appointment Booking</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Secure & Confidential</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Sign In"
          onPress={() => router.push('/sign-in')}
          size="lg"
          style={styles.button}
        />
        <Button
          title="Create Account"
          onPress={() => router.push('/sign-up')}
          variant="outline"
          size="lg"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes.display,
    fontWeight: typography.fontWeights.bold,
    color: colors.neutral[900],
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSizes.lg,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed * typography.fontSizes.lg,
  },
  subtitleArabic: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  featureContainer: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: typography.fontSizes.md,
    color: colors.neutral[700],
    fontWeight: typography.fontWeights.medium,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  button: {
    marginBottom: spacing.md,
  },
});
