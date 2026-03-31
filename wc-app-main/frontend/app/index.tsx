import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../src/theme/colors';
import { Card, Button } from '../src/components';

export default function HomeScreen() {
  const router = useRouter();

  const modules = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'ANALYTICS',
      icon: 'stats-chart-outline',
      color: colors.primary,
      route: '/dashboard',
    },
    {
      id: 'wc',
      title: 'Working Capital',
      subtitle: 'CORE MODULE',
      icon: 'bar-chart-outline',
      color: colors.yellow,
      route: '/wc',
    },
    {
      id: 'banking',
      title: 'Banking\nPerformance',
      subtitle: 'CORE MODULE',
      icon: 'business-outline',
      color: colors.yellow,
      route: '/banking',
    },
    {
      id: 'trend',
      title: 'Multi-Year\nAnalysis',
      subtitle: 'ADVANCED',
      icon: 'trending-up-outline',
      color: colors.green,
      route: '/trend',
    },
    {
      id: 'cases',
      title: 'Saved Cases',
      subtitle: 'RECORDS',
      icon: 'folder-outline',
      color: colors.orange,
      route: '/cases',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>FINANCIAL ANALYTICS</Text>
            <Text style={styles.title}>Capital Analytics</Text>
            <Text style={styles.subtitle}>Professional Financial Analysis Platform</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="folder-outline" size={14} color={colors.yellow} />
            <Text style={styles.statText}>0 Cases Saved</Text>
          </View>
          <View style={[styles.statBadge, styles.statBadgeGreen]}>
            <Ionicons name="flash-outline" size={14} color={colors.green} />
            <Text style={styles.statText}>AI-Powered OCR</Text>
          </View>
        </View>
        <View style={styles.accuracyBadge}>
          <Ionicons name="checkmark-circle-outline" size={14} color={colors.yellow} />
          <Text style={styles.statText}>100% Accurate</Text>
        </View>

        {/* Module Cards */}
        <View style={styles.modulesGrid}>
          {modules.map((module, index) => (
            <TouchableOpacity
              key={module.id}
              style={[
                styles.moduleCard,
                index === modules.length - 1 && styles.moduleCardFull,
              ]}
              onPress={() => router.push(module.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.moduleBadge, { borderColor: module.color }]}>
                <Text style={[styles.moduleBadgeText, { color: module.color }]}>
                  {module.subtitle}
                </Text>
              </View>
              <View style={[styles.moduleIconContainer, { backgroundColor: `${module.color}20` }]}>
                <Ionicons name={module.icon as any} size={24} color={module.color} />
              </View>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <View style={styles.openRow}>
                <Text style={[styles.openText, { color: module.color }]}>Open</Text>
                <Ionicons name="arrow-forward" size={14} color={module.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Analysis Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/wc')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Start New Analysis</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  brandName: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  refreshButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statBadgeGreen: {
    borderColor: colors.green,
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  moduleCardFull: {
    width: '48%',
  },
  moduleBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  moduleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  moduleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openText: {
    fontSize: 13,
    fontWeight: '500',
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});
