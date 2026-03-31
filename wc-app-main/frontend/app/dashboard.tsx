import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme/colors';
import { Card, SectionHeader } from '../src/components';
import { getDashboardStats } from '../src/api';
import { DashboardStats } from '../src/types';

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.log('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>FINANCIAL ANALYTICS</Text>
            <Text style={styles.title}>Analytics Dashboard</Text>
            <Text style={styles.date}>{dateString}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Stats Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="folder-outline" size={14} color={colors.yellow} />
            <Text style={styles.badgeText}>{stats?.total_cases || 0} Total Cases</Text>
          </View>
          <View style={[styles.badge, styles.badgeGreen]}>
            <Ionicons name="radio-button-on" size={10} color={colors.green} />
            <Text style={styles.badgeText}>Live Data</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="checkmark" size={14} color={colors.green} />
            <Text style={styles.badgeText}>Syncing...</Text>
          </View>
        </View>

        {/* Case Overview */}
        <SectionHeader title="Case Overview" color={colors.primary} />
        <Card>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Ionicons name="folder-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.overviewValue}>{stats?.total_cases || 0}</Text>
              <Text style={styles.overviewLabel}>Total Cases</Text>
            </View>
          </View>
        </Card>

        {/* Analysis Cards */}
        <View style={styles.analysisRow}>
          <TouchableOpacity style={styles.analysisCard} onPress={() => router.push('/wc')}>
            <Ionicons name="bar-chart-outline" size={20} color={colors.yellow} />
            <Text style={styles.analysisValue}>{stats?.wc_analysis_count || 0}</Text>
            <Text style={styles.analysisLabel}>WC Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.analysisCard, styles.analysisCardGreen]} onPress={() => router.push('/banking')}>
            <Ionicons name="business-outline" size={20} color={colors.green} />
            <Text style={styles.analysisValue}>{stats?.banking_count || 0}</Text>
            <Text style={styles.analysisLabel}>Banking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.analysisCard, styles.analysisCardCyan]} onPress={() => router.push('/trend')}>
            <Ionicons name="trending-up-outline" size={20} color={colors.cyan} />
            <Text style={styles.analysisValue}>{stats?.multi_year_count || 0}</Text>
            <Text style={styles.analysisLabel}>Multi-Year</Text>
          </TouchableOpacity>
        </View>

        {/* WC Trend */}
        <SectionHeader title="Working Capital Trend" color={colors.yellow} />
        <Card style={styles.trendCard}>
          <Ionicons name="bar-chart-outline" size={32} color={colors.textMuted} />
          <Text style={styles.noDataTitle}>No WC data yet</Text>
          <Text style={styles.noDataText}>Run a Working Capital analysis to see trends</Text>
          <TouchableOpacity style={styles.analyseButton} onPress={() => router.push('/wc')}>
            <Text style={styles.analyseButtonText}>Analyse Now</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* Banking Trend */}
        <SectionHeader title="Banking Performance Trend" color={colors.green} />
        <Card style={styles.trendCard}>
          <Ionicons name="business-outline" size={32} color={colors.textMuted} />
          <Text style={styles.noDataTitle}>No banking data yet</Text>
          <Text style={styles.noDataText}>Run a Banking Performance analysis to see scores</Text>
          <TouchableOpacity style={styles.analyseButton} onPress={() => router.push('/banking')}>
            <Text style={styles.analyseButtonText}>Analyse Now</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* Recent Activity */}
        <SectionHeader title="Recent Activity" color={colors.purple} />
        <Card style={styles.trendCard}>
          <Ionicons name="time-outline" size={32} color={colors.textMuted} />
          <Text style={styles.noDataTitle}>No cases yet</Text>
          <Text style={styles.noDataText}>Upload a financial document in any module to begin analysis</Text>
          <TouchableOpacity style={styles.analyseButton} onPress={() => router.push('/wc')}>
            <Text style={styles.analyseButtonText}>Start Analysis</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" color={colors.cyan} />
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/wc')}>
            <Ionicons name="bar-chart-outline" size={16} color={colors.yellow} />
            <Text style={styles.quickActionText}>WC Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/banking')}>
            <Ionicons name="business-outline" size={16} color={colors.green} />
            <Text style={styles.quickActionText}>Banking</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.quickActionFull} onPress={() => router.push('/trend')}>
          <Ionicons name="trending-up-outline" size={16} color={colors.cyan} />
          <Text style={styles.quickActionText}>Multi-Year</Text>
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
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  refreshButton: {
    padding: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeGreen: {
    borderWidth: 1,
    borderColor: colors.green,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  overviewItem: {
    alignItems: 'center',
    gap: 4,
  },
  overviewValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  overviewLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  analysisRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  analysisCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.yellow + '40',
  },
  analysisCardGreen: {
    borderColor: colors.green + '40',
  },
  analysisCardCyan: {
    borderColor: colors.cyan + '40',
  },
  analysisValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  analysisLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  trendCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noDataTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  noDataText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  analyseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  analyseButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickActionFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 20,
  },
  quickActionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
});
