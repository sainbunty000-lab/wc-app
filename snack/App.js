/**
 * Financial Analytics Dashboard – Expo Snack Edition
 *
 * Paste this file into https://snack.expo.dev and hit "Run".
 *
 * External packages used (all supported by Expo Snack):
 *   • react-native-safe-area-context
 *   • @expo/vector-icons
 *
 * No native modules, no env vars, no expo-router.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── API ──────────────────────────────────────────────────────────────────────

const API_BASE = 'https://perfect-backend-production-8ad7.up.railway.app';

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── THEME ────────────────────────────────────────────────────────────────────

const colors = {
  background:    '#F4F6F4',
  card:          '#FFFFFF',
  cardBorder:    '#E2EDE2',
  primary:       '#4CAF50',
  primaryDark:   '#388E3C',
  primaryLight:  '#E8F5E9',
  green:         '#43A047',
  yellow:        '#F9A825',
  red:           '#E53935',
  cyan:          '#00ACC1',
  orange:        '#FB8C00',
  text:          '#1A2E1A',
  textSecondary: '#5A7A5A',
  textMuted:     '#9CB49C',
  chartBar:      '#81C784',
  chartBarAlt:   '#A5D6A7',
  chartGrid:     '#E2EDE2',
  tabActive:     '#4CAF50',
  tabInactive:   '#9CB49C',
  tabBar:        '#FFFFFF',
  tabBarBorder:  '#E2EDE2',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatCurrency(value) {
  if (value == null) return '–';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}₹${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${sign}₹${(abs / 1_000).toFixed(0)}K`;
  return `${sign}₹${abs}`;
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function extractInsights(summary) {
  if (!summary) return [];
  const text = summary.toLowerCase();
  const insights = [];

  // Liquidity — use word boundary to avoid matching 'illiquid', 'liquidation' substrings
  const hasLiquidity = /\bliquid(ity)?\b/.test(text) || /\bcurrent ratio\b/.test(text) || /\bcash\b/.test(text);
  if (hasLiquidity) {
    const positive =
      /\bstrong\b/.test(text) || /\badequate\b/.test(text) ||
      /\bsufficient\b/.test(text) || /\bhealthy\b/.test(text) ||
      /\bcomfortable\b/.test(text);
    insights.push({
      label: positive ? 'Strong Liquidity' : 'Liquidity Concern',
      icon:  positive ? 'water-outline'    : 'warning-outline',
      color: positive ? colors.green       : colors.yellow,
    });
  }

  // Risk / Debt — match whole words only
  const hasRisk = /\brisk\b/.test(text) || /\bdebt\b/.test(text) || /\bliabilities?\b/.test(text);
  if (hasRisk) {
    const high =
      /\bhigh risk\b/.test(text) || /\belevated\b/.test(text) ||
      /\bsignificant risk\b/.test(text) || /\bdeficit\b/.test(text);
    insights.push({
      label: high ? 'High Risk'        : 'Managed Risk',
      icon:  high ? 'alert-circle-outline' : 'shield-checkmark-outline',
      color: high ? colors.red         : colors.cyan,
    });
  }

  // Growth / Stability — match whole words
  const hasGrowth =
    /\bgrowth\b/.test(text) || /\bstable\b/.test(text) ||
    /\brevenue\b/.test(text) || /\bprofit(able)?\b/.test(text);
  if (hasGrowth) {
    const positive =
      /\bstable\b/.test(text) || /\bpositive\b/.test(text) ||
      /\bgrowth\b/.test(text) || /\bprofitabl/.test(text) ||
      /\bconsistent\b/.test(text);
    insights.push({
      label: positive ? 'Stable Growth'   : 'Declining Trend',
      icon:  positive ? 'trending-up-outline' : 'trending-down-outline',
      color: positive ? colors.primary    : colors.orange,
    });
  }

  // Fallback
  if (insights.length === 0) {
    insights.push(
      { label: 'Analysis Complete', icon: 'checkmark-done-outline', color: colors.cyan },
      { label: 'Review Summary',    icon: 'document-text-outline',  color: colors.yellow },
    );
  }

  return insights.slice(0, 3);
}

// ─── ANIMATION HOOKS ─────────────────────────────────────────────────────────

function useFadeSlideIn(delay = 0) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);

  return { opacity, transform: [{ translateY }] };
}

function useBarAnimation(delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 600, delay, useNativeDriver: false }).start();
  }, [delay, anim]);
  return anim;
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────

function SectionHeader({ title, color = colors.primary }) {
  return (
    <View style={sh.row}>
      <View style={[sh.bar, { backgroundColor: color }]} />
      <Text style={sh.label}>{title}</Text>
    </View>
  );
}

const sh = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  bar:   { width: 4, height: 16, borderRadius: 2, marginRight: 10 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ title, value, subtitle, icon, iconColor = colors.primary, trend, trendValue, delay = 0 }) {
  const animStyle = useFadeSlideIn(delay);
  const trendColor = trend === 'up' ? colors.green : trend === 'down' ? colors.red : colors.textMuted;
  const trendIcon  = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove';

  return (
    <Animated.View style={[kpi.card, animStyle]}>
      <View style={[kpi.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={kpi.title}>{title}</Text>
      <Text style={kpi.value}>{value}</Text>
      {subtitle  ? <Text style={kpi.subtitle}>{subtitle}</Text> : null}
      {trend && trendValue ? (
        <View style={kpi.trendRow}>
          <Ionicons name={trendIcon} size={12} color={trendColor} />
          <Text style={[kpi.trendText, { color: trendColor }]}>{trendValue}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const kpi = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...Platform.select({
      ios:     { shadowColor: '#1A2E1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  title:    { color: colors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value:    { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 2 },
  subtitle: { color: colors.textMuted, fontSize: 11 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  trendText:{ fontSize: 11, fontWeight: '600' },
});

// ── Bar Chart ─────────────────────────────────────────────────────────────────
const BAR_CHART_HEIGHT = 140;

function BarChart({ data, delay = 0, colorFn }) {
  const maxAbs = Math.max(...data.map(d => Math.abs(d.value)), 1);

  return (
    <View style={bc.container}>
      {/* Y-axis grid lines */}
      {[1, 0.5, 0].map(pct => (
        <View
          key={pct}
          style={[bc.gridLine, { bottom: pct * BAR_CHART_HEIGHT }]}
        />
      ))}

      {/* Bars */}
      <View style={bc.barsRow}>
        {data.map((item, idx) => (
          <AnimatedBar
            key={item.label}
            item={item}
            maxAbs={maxAbs}
            delay={delay + idx * 60}
            color={colorFn ? colorFn(item) : item.value >= 0 ? colors.chartBar : colors.red}
          />
        ))}
      </View>
    </View>
  );
}

function AnimatedBar({ item, maxAbs, delay, color }) {
  const anim = useBarAnimation(delay);
  const pct  = Math.abs(item.value) / maxAbs;
  const maxH = BAR_CHART_HEIGHT * 0.85;
  const barH = anim.interpolate({ inputRange: [0, 1], outputRange: [0, pct * maxH] });
  const isNeg = item.value < 0;

  return (
    <View style={bc.barWrapper}>
      <Text style={bc.labelTop}>{item.labelTop}</Text>
      <View style={bc.barArea}>
        <Animated.View style={[bc.bar, { height: barH, backgroundColor: color, alignSelf: isNeg ? 'flex-start' : 'flex-end' }]} />
      </View>
      <Text style={bc.label}>{item.label}</Text>
    </View>
  );
}

const bc = StyleSheet.create({
  container: { position: 'relative', height: BAR_CHART_HEIGHT + 40, width: '100%' },
  gridLine:  { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.chartGrid },
  barsRow:   { flexDirection: 'row', alignItems: 'flex-end', height: BAR_CHART_HEIGHT, paddingBottom: 0 },
  barWrapper:{ flex: 1, alignItems: 'center' },
  barArea:   { height: BAR_CHART_HEIGHT * 0.85, width: '60%', justifyContent: 'flex-end' },
  bar:       { width: '100%', borderRadius: 4 },
  label:     { color: colors.textMuted, fontSize: 9, marginTop: 4, textAlign: 'center' },
  labelTop:  { color: colors.textMuted, fontSize: 9, marginBottom: 2, textAlign: 'center' },
});

// ── Data Table ─────────────────────────────────────────────────────────────────
function DataTable({ rows }) {
  return (
    <View style={dt.table}>
      {rows.map((row, i) => (
        <View key={i} style={[dt.row, i < rows.length - 1 && dt.rowBorder]}>
          <Text style={[dt.label, row.bold && dt.bold]}>{row.label}</Text>
          <Text style={[dt.value, row.bold && dt.bold, row.valueColor && { color: row.valueColor }]}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const dt = StyleSheet.create({
  table:     { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 14, overflow: 'hidden' },
  row:       { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  label:     { color: colors.textSecondary, fontSize: 13 },
  value:     { color: colors.text, fontSize: 13 },
  bold:      { fontWeight: '700' },
});

// ── Health Status Card ─────────────────────────────────────────────────────────
function HealthCard({ status, loading, error, onPress }) {
  const animStyle = useFadeSlideIn(100);
  const dot = status?.status === 'ok' ? colors.green : error ? colors.red : colors.yellow;

  return (
    <Animated.View style={[hc.card, animStyle]}>
      <View style={hc.top}>
        <View style={hc.titleRow}>
          <View style={[hc.dot, { backgroundColor: dot }]} />
          <Text style={hc.title}>API Health</Text>
        </View>
        <TouchableOpacity style={hc.btn} onPress={onPress} disabled={loading} activeOpacity={0.75}>
          {loading
            ? <ActivityIndicator size={14} color={colors.primary} />
            : <Ionicons name="refresh-outline" size={16} color={colors.primary} />
          }
          <Text style={hc.btnText}>Check</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={hc.error}>{error}</Text>
      ) : status ? (
        <View>
          <Text style={hc.ok}>✓ Backend reachable</Text>
          <Text style={hc.sub}>URL: {API_BASE}</Text>
          {status.version && <Text style={hc.sub}>Version: {status.version}</Text>}
        </View>
      ) : (
        <Text style={hc.sub}>Tap "Check" to test the API connection.</Text>
      )}
    </Animated.View>
  );
}

const hc = StyleSheet.create({
  card:     { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 14 },
  top:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:      { width: 10, height: 10, borderRadius: 5 },
  title:    { color: colors.text, fontSize: 15, fontWeight: '700' },
  btn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primaryLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  btnText:  { color: colors.primary, fontSize: 12, fontWeight: '600' },
  ok:       { color: colors.green, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  sub:      { color: colors.textMuted, fontSize: 12 },
  error:    { color: colors.red, fontSize: 13 },
});

// ── Eligibility Badge ─────────────────────────────────────────────────────────

function EligibilityBadge({ status, confidence, animStyle }) {
  const isEligible = status === 'Eligible';
  const isConditional = status === 'Conditional' || status === 'CONDITIONALLY ELIGIBLE';
  const bg         = isEligible ? '#E8F5E9' : isConditional ? '#FFF8E1' : '#FFEBEE';
  const border     = isEligible ? '#A5D6A7' : isConditional ? '#FFD54F' : '#FFCDD2';
  const textColor  = isEligible ? colors.green : isConditional ? colors.yellow : colors.red;
  const icon       = isEligible ? 'checkmark-circle' : isConditional ? 'alert-circle' : 'close-circle';
  const label      = status ?? 'Unknown';

  return (
    <Animated.View style={[eb.wrap, animStyle]}>
      <View style={[eb.badge, { backgroundColor: bg, borderColor: border }]}>
        <Ionicons name={icon} size={30} color={textColor} />
        <Text style={[eb.text, { color: textColor }]}>{label}</Text>
      </View>
      <Text style={eb.sub}>Eligibility Status</Text>
      {confidence != null && (
        <Text style={[eb.confidence, { color: textColor }]}>
          Confidence: {Math.round(confidence * 100)}%
        </Text>
      )}
    </Animated.View>
  );
}

const eb = StyleSheet.create({
  wrap:  { alignItems: 'center', marginBottom: 24 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 1.5,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  text:       { fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  sub:        { color: colors.textMuted, fontSize: 12, fontWeight: '500', marginTop: 8, letterSpacing: 0.4 },
  confidence: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({ summary, animStyle }) {
  return (
    <Animated.View style={[sc.card, animStyle]}>
      <View style={sc.titleRow}>
        <View style={sc.iconWrap}>
          <Ionicons name="document-text-outline" size={17} color={colors.primary} />
        </View>
        <Text style={sc.title}>Financial Summary</Text>
      </View>
      <Text style={sc.body}>{summary || 'No summary available.'}</Text>
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...Platform.select({
      ios:     { shadowColor: '#1A2E1A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrap: { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title:    { color: colors.text, fontSize: 16, fontWeight: '700' },
  body:     { color: colors.textSecondary, fontSize: 14, lineHeight: 23 },
});

// ── Insight Chip ──────────────────────────────────────────────────────────────

function InsightChip({ label, icon, color, animStyle }) {
  return (
    <Animated.View style={[ic.chip, { borderColor: `${color}50`, backgroundColor: `${color}12` }, animStyle]}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[ic.label, { color }]} numberOfLines={2}>{label}</Text>
    </Animated.View>
  );
}

const ic = StyleSheet.create({
  chip:  { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 12, borderRadius: 12, borderWidth: 1.2, flex: 1 },
  label: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});

// ── Analysis Result Card (reusable) ───────────────────────────────────────────

function AnalysisResultCard({ analysis }) {
  const badgeAnim   = useFadeSlideIn(0);
  const summaryAnim = useFadeSlideIn(180);
  const chip0Anim   = useFadeSlideIn(320);
  const chip1Anim   = useFadeSlideIn(400);
  const chip2Anim   = useFadeSlideIn(480);
  const riskAnim    = useFadeSlideIn(560);
  const chipAnims   = [chip0Anim, chip1Anim, chip2Anim];

  const insights  = extractInsights(analysis?.summary);
  const risks     = analysis?.risks ?? [];
  const strengths = analysis?.strengths ?? [];
  const confidence = analysis?.confidence != null ? analysis.confidence : null;

  return (
    <View>
      <EligibilityBadge
        status={analysis?.eligibility_status}
        confidence={confidence}
        animStyle={badgeAnim}
      />
      <SummaryCard summary={analysis?.summary} animStyle={summaryAnim} />
      {insights.length > 0 && (
        <>
          <SectionHeader title="Key Insights" color={colors.cyan} />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {insights.map((ins, idx) => (
              <InsightChip
                key={ins.label}
                label={ins.label}
                icon={ins.icon}
                color={ins.color}
                animStyle={chipAnims[idx] ?? chip0Anim}
              />
            ))}
          </View>
        </>
      )}
      {risks.length > 0 && risks[0] !== 'No major risks identified from available data.' && (
        <Animated.View style={[ra.card, riskAnim]}>
          <View style={ra.titleRow}>
            <Ionicons name="warning-outline" size={16} color={colors.red} />
            <Text style={ra.title}>Risk Alerts</Text>
          </View>
          {risks.map((r, i) => (
            <View key={i} style={ra.row}>
              <View style={ra.dot} />
              <Text style={ra.text}>{r}</Text>
            </View>
          ))}
        </Animated.View>
      )}
      {strengths.length > 0 && strengths[0] !== 'Financial data available for analysis.' && (
        <Animated.View style={[str.card, riskAnim]}>
          <View style={str.titleRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.green} />
            <Text style={str.title}>Strengths</Text>
          </View>
          {strengths.map((s, i) => (
            <View key={i} style={str.row}>
              <Ionicons name="checkmark" size={12} color={colors.green} />
              <Text style={str.text}>{s}</Text>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const ra = StyleSheet.create({
  card:     { backgroundColor: '#FFF8F8', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#FFCDD2' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title:    { color: colors.red, fontSize: 14, fontWeight: '700' },
  row:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red, marginTop: 6 },
  text:     { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
});

const str = StyleSheet.create({
  card:     { backgroundColor: '#F1FFF4', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#A5D6A7' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title:    { color: colors.green, fontSize: 14, fontWeight: '700' },
  row:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  text:     { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
});

// ─── PLACEHOLDER CHART DATA ───────────────────────────────────────────────────

const TREND_DATA = [
  { value: 420000, label: 'Jan', labelTop: '420K' },
  { value: 380000, label: 'Feb', labelTop: '380K' },
  { value: 510000, label: 'Mar', labelTop: '510K' },
  { value: 470000, label: 'Apr', labelTop: '470K' },
  { value: 560000, label: 'May', labelTop: '560K' },
  { value: 620000, label: 'Jun', labelTop: '620K' },
];

const MOM_DATA = [
  { value:  120000, label: 'Jan', labelTop: '+120K' },
  { value: -40000,  label: 'Feb', labelTop: '-40K'  },
  { value:  130000, label: 'Mar', labelTop: '+130K' },
  { value: -30000,  label: 'Apr', labelTop: '-30K'  },
  { value:  90000,  label: 'May', labelTop: '+90K'  },
  { value:  60000,  label: 'Jun', labelTop: '+60K'  },
];

// ── Animated Case Card ────────────────────────────────────────────────────────
function AnimatedCaseCard({ caseItem, delay }) {
  const anim = useFadeSlideIn(delay);
  return (
    <Animated.View style={[s.caseCard, anim]}>
      <View style={[s.caseIcon, { backgroundColor: `${colors.primary}18` }]}>
        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.caseName} numberOfLines={1}>{caseItem.company_name}</Text>
        <Text style={s.caseMeta}>{caseItem.analysis_type?.toUpperCase()} · {formatDate(caseItem.timestamp)}</Text>
      </View>
    </Animated.View>
  );
}

// ─── DASHBOARD SCREEN ─────────────────────────────────────────────────────────

function DashboardScreen() {
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  // All animations declared at top level (Rules of Hooks)
  const headerAnim   = useFadeSlideIn(0);
  const badgeAnim    = useFadeSlideIn(100);
  const chart1Anim   = useFadeSlideIn(500);
  const chart2Anim   = useFadeSlideIn(600);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const data = await apiFetch('/api/dashboard/stats');
      setStats(data);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  // Derive KPI values from latest WC case
  const latestWC    = stats?.recent_cases?.find(c => c.analysis_type === 'wc')?.data;
  const wc          = latestWC?.net_working_capital ?? null;
  const cr          = latestWC?.current_ratio       ?? null;
  const prevWC      = stats?.recent_cases?.filter(c => c.analysis_type === 'wc')?.[1]?.data?.net_working_capital ?? null;
  const changeWC    = wc !== null && prevWC !== null ? wc - prevWC : null;
  const ca          = latestWC?.input_data?.balance_sheet?.current_assets      ?? null;
  const cl          = latestWC?.input_data?.balance_sheet?.current_liabilities ?? null;
  const inv         = latestWC?.input_data?.balance_sheet?.inventory            ?? null;
  const debtors     = latestWC?.input_data?.balance_sheet?.debtors              ?? null;
  const creditors   = latestWC?.input_data?.balance_sheet?.creditors            ?? null;
  const cashBank    = latestWC?.input_data?.balance_sheet?.cash_bank_balance    ?? null;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {/* ── Header ── */}
        <Animated.View style={[s.header, headerAnim]}>
          <View>
            <Text style={s.brand}>FINANCIAL ANALYTICS</Text>
            <Text style={s.title}>Dashboard</Text>
            <Text style={s.date}>{today}</Text>
          </View>
          <TouchableOpacity style={s.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Status Badges ── */}
        <Animated.View style={[s.badgeRow, badgeAnim]}>
          <View style={s.badge}>
            <Ionicons name="folder-outline"    size={13} color={colors.yellow} />
            <Text style={s.badgeText}>{stats?.total_cases ?? 0} Cases</Text>
          </View>
          <View style={[s.badge, s.badgePrimary]}>
            <Ionicons name="radio-button-on"   size={10} color={colors.primary} />
            <Text style={[s.badgeText, { color: colors.primary }]}>Live Data</Text>
          </View>
          <View style={s.badge}>
            <Ionicons name="sync-outline"      size={13} color={colors.textSecondary} />
            <Text style={s.badgeText}>Auto-sync</Text>
          </View>
        </Animated.View>

        {/* ── Loading / Error ── */}
        {loading && !refreshing ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>Loading dashboard…</Text>
          </View>
        ) : error ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.red} />
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={fetchStats}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── KPI Cards ── */}
        <SectionHeader title="Key Performance Indicators" />
        <View style={s.kpiRow}>
          <KPICard
            title="Working Capital"
            value={wc !== null ? formatCurrency(wc) : '–'}
            subtitle="Net current position"
            icon="wallet-outline"
            iconColor={colors.primary}
            trend={changeWC !== null ? (changeWC >= 0 ? 'up' : 'down') : undefined}
            trendValue={changeWC !== null ? `${changeWC >= 0 ? '+' : ''}${formatCurrency(changeWC)} vs prev` : undefined}
            delay={200}
          />
          <KPICard
            title="Current Ratio"
            value={cr !== null ? cr.toFixed(2) : '–'}
            subtitle={cr !== null ? (cr >= 1.5 ? 'Healthy ✓' : 'Watch closely') : 'No data yet'}
            icon="analytics-outline"
            iconColor={cr !== null && cr >= 1.5 ? colors.green : colors.yellow}
            trend={cr !== null ? (cr >= 1.5 ? 'up' : 'down') : undefined}
            trendValue={cr !== null ? (cr >= 1.5 ? 'Strong' : 'Weak') : undefined}
            delay={320}
          />
        </View>
        <View style={{ marginBottom: 20 }}>
          <KPICard
            title="Change in Working Capital"
            value={changeWC !== null ? formatCurrency(Math.abs(changeWC)) : '–'}
            subtitle="vs previous period"
            icon="swap-vertical-outline"
            iconColor={changeWC !== null && changeWC >= 0 ? colors.green : colors.red}
            trend={changeWC !== null ? (changeWC >= 0 ? 'up' : 'down') : undefined}
            trendValue={changeWC !== null ? (changeWC >= 0 ? 'Improved' : 'Declined') : undefined}
            delay={440}
          />
        </View>

        {/* ── WC Trend Chart ── */}
        <SectionHeader title="Working Capital Trend" color={colors.primary} />
        <Animated.View style={[s.chartCard, chart1Anim]}>
          <Text style={s.chartTitle}>WC Over Time</Text>
          <Text style={s.chartSub}>
            {latestWC ? 'Based on analysis history' : 'Sample data – run an analysis to see real data'}
          </Text>
          <BarChart
            data={TREND_DATA}
            delay={550}
            colorFn={() => colors.chartBar}
          />
        </Animated.View>

        {/* ── Month-on-Month Chart ── */}
        <SectionHeader title="Monthly WC Changes" color={colors.green} />
        <Animated.View style={[s.chartCard, chart2Anim]}>
          <Text style={s.chartTitle}>Month-on-Month Δ Working Capital</Text>
          <Text style={s.chartSub}>Green = increase · Red = decrease</Text>
          <BarChart
            data={MOM_DATA}
            delay={650}
            colorFn={item => item.value >= 0 ? colors.chartBar : colors.red}
          />
        </Animated.View>

        {/* ── Current Assets ── */}
        <SectionHeader title="Current Assets Breakdown" color={colors.primary} />
        <DataTable rows={[
          { label: 'Cash & Bank Balance',  value: cashBank  !== null ? formatCurrency(cashBank)  : '–' },
          { label: 'Debtors / Receivables', value: debtors   !== null ? formatCurrency(debtors)   : '–' },
          { label: 'Inventory',            value: inv       !== null ? formatCurrency(inv)       : '–' },
          { label: 'Total Current Assets', value: ca        !== null ? formatCurrency(ca)        : '–', bold: true, valueColor: colors.primary },
        ]} />

        {/* ── Current Liabilities ── */}
        <SectionHeader title="Current Liabilities Breakdown" color={colors.red} />
        <DataTable rows={[
          { label: 'Creditors / Payables',      value: creditors !== null ? formatCurrency(creditors) : '–' },
          { label: 'Total Current Liabilities', value: cl        !== null ? formatCurrency(cl)        : '–', bold: true, valueColor: colors.red },
        ]} />

        {/* ── Analysis Summary ── */}
        <SectionHeader title="Analysis Overview" color={colors.yellow} />
        <View style={s.analysisRow}>
          {[
            { label: 'WC Analyses', value: stats?.wc_analysis_count  ?? 0, color: colors.yellow, icon: 'bar-chart-outline' },
            { label: 'Banking',     value: stats?.banking_count       ?? 0, color: colors.primary, icon: 'business-outline' },
            { label: 'Multi-Year',  value: stats?.multi_year_count    ?? 0, color: colors.cyan,    icon: 'trending-up-outline' },
          ].map(item => (
            <View key={item.label} style={[s.aCard, { borderColor: `${item.color}30` }]}>
              <View style={[s.aIcon, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={s.aValue}>{item.value}</Text>
              <Text style={s.aLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Recent Cases ── */}
        {stats?.recent_cases?.length > 0 && (
          <>
            <SectionHeader title="Recent Cases" color={colors.cyan} />
            {stats.recent_cases.slice(0, 4).map((c, i) => (
              <AnimatedCaseCard key={c.id ?? i} caseItem={c} delay={700 + i * 60} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── API HEALTH SCREEN ────────────────────────────────────────────────────────

function ApiHealthScreen() {
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const headerAnim = useFadeSlideIn(0);
  const rawAnim    = useFadeSlideIn(200);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const data = await apiFetch('/api/health');
      setStatus(data);
    } catch (e) {
      setError(e.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-check on mount
  useEffect(() => { checkHealth(); }, [checkHealth]);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[s.header, headerAnim]}>
          <View>
            <Text style={s.brand}>FINANCIAL ANALYTICS</Text>
            <Text style={s.title}>API Status</Text>
            <Text style={s.date}>{API_BASE}</Text>
          </View>
          <View style={[s.refreshBtn, { backgroundColor: status?.status === 'ok' ? colors.primaryLight : error ? '#FFEBEE' : colors.primaryLight }]}>
            <Ionicons
              name={status?.status === 'ok' ? 'checkmark-circle-outline' : error ? 'alert-circle-outline' : 'cloud-outline'}
              size={22}
              color={status?.status === 'ok' ? colors.green : error ? colors.red : colors.textMuted}
            />
          </View>
        </Animated.View>

        {/* Health card */}
        <HealthCard
          status={status}
          loading={loading}
          error={error}
          onPress={checkHealth}
        />

        {/* Raw response */}
        {status && (
          <Animated.View style={[s.rawCard, rawAnim]}>
            <Text style={s.rawTitle}>Raw Response</Text>
            <Text style={s.rawBody}>{JSON.stringify(status, null, 2)}</Text>
          </Animated.View>
        )}

        {/* Endpoint list */}
        <SectionHeader title="Available Endpoints" color={colors.cyan} />
        {[
          { method: 'GET',  path: '/api/health',          desc: 'Health check' },
          { method: 'GET',  path: '/api/dashboard/stats', desc: 'Dashboard stats' },
          { method: 'POST', path: '/api/analysis/wc',     desc: 'Working Capital analysis' },
          { method: 'POST', path: '/api/analysis/banking',desc: 'Banking analysis' },
          { method: 'POST', path: '/api/analysis/trend',  desc: 'Multi-year trend' },
          { method: 'GET',  path: '/api/cases',           desc: 'List all cases' },
        ].map(ep => (
          <View key={ep.path} style={s.epRow}>
            <View style={[s.epMethod, { backgroundColor: ep.method === 'GET' ? `${colors.cyan}20` : `${colors.yellow}20` }]}>
              <Text style={[s.epMethodText, { color: ep.method === 'GET' ? colors.cyan : colors.yellow }]}>{ep.method}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.epPath}>{ep.path}</Text>
              <Text style={s.epDesc}>{ep.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ANALYSIS SCREEN ─────────────────────────────────────────────────────────

const DEMO_ANALYSES = [
  {
    eligibility_status: 'Eligible',
    summary:
      'The company demonstrates strong financial health with adequate liquidity ratios and stable revenue growth. ' +
      'Current ratio of 2.1 indicates comfortable coverage of short-term liabilities. ' +
      'Cash flow is consistently positive, and working capital management has been well-maintained over the past three years. ' +
      'Profit margins are healthy, reflecting sound operational efficiency.',
  },
  {
    eligibility_status: 'Not Eligible',
    summary:
      'Analysis reveals elevated risk levels due to a high debt-to-equity ratio and declining revenue trends. ' +
      'A liquidity deficit is observed with a current ratio below 1.0, signaling an inability to meet short-term obligations. ' +
      'Working capital is negative and requires immediate corrective action. ' +
      'Significant risk exposure to creditor defaults has been identified.',
  },
];

function AnalysisScreen() {
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const headerAnim = useFadeSlideIn(0);

  const runDemo = useCallback(async (index) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    await new Promise(r => setTimeout(r, 900));
    setAnalysis(DEMO_ANALYSES[index]);
    setLoading(false);
  }, []);

  const runLive = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const data = await apiPost('/api/analysis/wc', {
        company_name: 'Demo Company',
        balance_sheet: {
          current_assets: 500000,
          current_liabilities: 240000,
          inventory: 80000,
          debtors: 120000,
          creditors: 100000,
          cash_bank_balance: 60000,
        },
        profit_loss: {
          revenue: 1200000,
          cogs: 800000,
          operating_expenses: 200000,
          net_profit: 200000,
        },
      });
      setAnalysis(data?.analysis ?? data);
    } catch (e) {
      setError(e.message || 'Analysis failed. Check API connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Animated.View style={[s.header, headerAnim]}>
          <View>
            <Text style={s.brand}>FINANCIAL ANALYTICS</Text>
            <Text style={s.title}>AI Analysis</Text>
            <Text style={s.date}>Powered by Gemini AI</Text>
          </View>
          <View style={[s.refreshBtn, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="pulse-outline" size={22} color={colors.primary} />
          </View>
        </Animated.View>

        {/* ── Action Buttons ── */}
        <SectionHeader title="Run Analysis" color={colors.primary} />
        <View style={az.btnRow}>
          <TouchableOpacity
            style={[az.demoBtn, az.demoBtnGreen]}
            onPress={() => runDemo(0)}
            activeOpacity={0.75}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.green} />
            <Text style={[az.demoBtnText, { color: colors.green }]}>Demo: Eligible</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[az.demoBtn, az.demoBtnRed]}
            onPress={() => runDemo(1)}
            activeOpacity={0.75}
            disabled={loading}
          >
            <Ionicons name="close-circle-outline" size={16} color={colors.red} />
            <Text style={[az.demoBtnText, { color: colors.red }]}>Demo: Not Eligible</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={az.liveBtn} onPress={runLive} activeOpacity={0.75} disabled={loading}>
          <Ionicons name="cloud-upload-outline" size={16} color={colors.card} />
          <Text style={az.liveBtnText}>Run Live API Analysis</Text>
        </TouchableOpacity>

        {/* ── Loading ── */}
        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>Analyzing financial data…</Text>
          </View>
        )}

        {/* ── Error ── */}
        {!!error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.red} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Result ── */}
        {!loading && analysis && (
          <>
            <SectionHeader title="Analysis Result" color={colors.yellow} />
            <AnalysisResultCard analysis={analysis} />
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && !analysis && !error && (
          <View style={az.empty}>
            <Ionicons name="analytics-outline" size={52} color={colors.textMuted} />
            <Text style={az.emptyTitle}>No Analysis Yet</Text>
            <Text style={az.emptyText}>
              Tap a button above to run an analysis and see the AI-generated eligibility result.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const az = StyleSheet.create({
  btnRow:       { flexDirection: 'row', gap: 10, marginBottom: 12 },
  demoBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1.2 },
  demoBtnGreen: { backgroundColor: colors.primaryLight, borderColor: colors.green },
  demoBtnRed:   { backgroundColor: '#FFEBEE', borderColor: colors.red },
  demoBtnText:  { fontSize: 13, fontWeight: '600' },
  liveBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, marginBottom: 24, ...Platform.select({ ios: { shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 4 } }) },
  liveBtnText:  { color: colors.card, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  empty:        { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyTitle:   { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyText:    { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});

// ─── BANKING SCREEN ───────────────────────────────────────────────────────────

const DEMO_BANKING = {
  company_name: 'Demo Business',
  total_credits: 1200000,
  total_debits: 960000,
  average_balance: 180000,
  minimum_balance: 42000,
  opening_balance: 150000,
  closing_balance: 210000,
  cash_deposits: 90000,
  cheque_bounces: 1,
  loan_repayments: 60000,
  overdraft_usage: 0,
  ecs_emi_payments: 80000,
  num_transactions: 120,
  sanctioned_limit: 500000,
  utilized_limit: 0,
};

function ScoreRing({ score }) {
  const label = score >= 85 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 55 ? 'MODERATE' : score >= 40 ? 'RISKY' : 'CRITICAL';
  const bg    = score >= 85 ? colors.green  : score >= 70 ? colors.primary : score >= 55 ? colors.yellow : colors.red;
  return (
    <View style={sr.wrap}>
      <View style={[sr.ring, { borderColor: bg }]}>
        <Text style={[sr.score, { color: bg }]}>{score}</Text>
        <Text style={sr.scoreLabel}>/100</Text>
      </View>
      <Text style={[sr.status, { color: bg }]}>{label}</Text>
    </View>
  );
}

const sr = StyleSheet.create({
  wrap:       { alignItems: 'center', marginBottom: 8 },
  ring:       { width: 100, height: 100, borderRadius: 50, borderWidth: 8, alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }) },
  score:      { fontSize: 28, fontWeight: '800' },
  scoreLabel: { color: colors.textMuted, fontSize: 11 },
  status:     { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginTop: 6 },
});

function RiskAlert({ text }) {
  return (
    <View style={ral.row}>
      <Ionicons name="warning" size={14} color={colors.red} />
      <Text style={ral.text}>{text}</Text>
    </View>
  );
}

const ral = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  text: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
});

function BankingScreen() {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const headerAnim = useFadeSlideIn(0);
  const resultAnim = useFadeSlideIn(100);

  const runDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiPost('/api/analysis/banking', DEMO_BANKING);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Banking analysis failed. Check API connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fmtK = (v) => v == null ? '–' : formatCurrency(v);
  const scoreColor = (s) => s >= 85 ? colors.green : s >= 65 ? colors.yellow : s >= 50 ? colors.orange : colors.red;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[s.header, headerAnim]}>
          <View>
            <Text style={s.brand}>FINANCIAL ANALYTICS</Text>
            <Text style={s.title}>Banking Analysis</Text>
            <Text style={s.date}>Perfios-style Credit Assessment</Text>
          </View>
          <View style={[s.refreshBtn, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="business-outline" size={22} color={colors.primary} />
          </View>
        </Animated.View>

        {/* Demo Button */}
        <SectionHeader title="Run Analysis" color={colors.primary} />
        <TouchableOpacity style={bk.liveBtn} onPress={runDemo} activeOpacity={0.75} disabled={loading}>
          <Ionicons name="analytics-outline" size={16} color={colors.card} />
          <Text style={bk.liveBtnText}>Run Demo Banking Analysis</Text>
        </TouchableOpacity>

        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>Analyzing banking data…</Text>
          </View>
        )}

        {!!error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.red} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {!loading && result && (
          <Animated.View style={resultAnim}>
            {/* 1. Banking Health Score */}
            <SectionHeader title="Banking Health Score" color={colors.primary} />
            <View style={bk.healthCard}>
              <ScoreRing score={result.health_score} />
              <View style={bk.healthInfo}>
                <Text style={bk.healthGrade}>Grade {result.grade}</Text>
                <Text style={bk.healthRisk}>Risk: {result.risk_level}</Text>
                <View style={[bk.eligBadge, {
                  backgroundColor: result.eligibility_status === 'ELIGIBLE' ? '#E8F5E9'
                    : result.eligibility_status === 'CONDITIONALLY ELIGIBLE' ? '#FFF8E1' : '#FFEBEE',
                  borderColor: result.eligibility_status === 'ELIGIBLE' ? colors.green
                    : result.eligibility_status === 'CONDITIONALLY ELIGIBLE' ? colors.yellow : colors.red,
                }]}>
                  <Text style={[bk.eligText, {
                    color: result.eligibility_status === 'ELIGIBLE' ? colors.green
                      : result.eligibility_status === 'CONDITIONALLY ELIGIBLE' ? colors.yellow : colors.red,
                  }]}>
                    {result.eligibility_status}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. Banking KPI Cards */}
            <SectionHeader title="Key Banking Metrics" color={colors.yellow} />
            <View style={s.kpiRow}>
              <KPICard
                title="Monthly Inflow"
                value={fmtK(result.monthly_inflow)}
                subtitle="Avg monthly credits"
                icon="trending-up-outline"
                iconColor={colors.green}
                delay={100}
              />
              <KPICard
                title="Monthly Outflow"
                value={fmtK(result.monthly_outflow)}
                subtitle="Avg monthly debits"
                icon="trending-down-outline"
                iconColor={colors.red}
                delay={200}
              />
            </View>
            <View style={s.kpiRow}>
              <KPICard
                title="Avg Balance"
                value={fmtK(result.input_data?.average_balance)}
                subtitle="Average account balance"
                icon="wallet-outline"
                iconColor={colors.primary}
                delay={300}
              />
              <KPICard
                title="EMI Obligations"
                value={fmtK(result.input_data?.ecs_emi_payments)}
                subtitle="Monthly EMI payments"
                icon="card-outline"
                iconColor={colors.orange}
                delay={400}
              />
            </View>

            {/* 3. Cash Flow Trend Chart */}
            {result.cash_flow_trend?.length > 0 && (
              <>
                <SectionHeader title="Cash Flow Trend" color={colors.cyan} />
                <View style={s.chartCard}>
                  <Text style={s.chartTitle}>Monthly Cash Flow (6 months)</Text>
                  <Text style={s.chartSub}>Green = Inflow · Red = Outflow</Text>
                  <BarChart
                    data={result.cash_flow_trend.map(m => ({
                      value: m.inflow,
                      label: m.month,
                      labelTop: formatCurrency(m.inflow),
                    }))}
                    delay={200}
                    colorFn={() => colors.chartBar}
                  />
                </View>
              </>
            )}

            {/* 4. Risk Alerts */}
            {result.risks?.length > 0 && (
              <>
                <SectionHeader title="Risk Alerts" color={colors.red} />
                <View style={bk.riskCard}>
                  {result.risks.map((r, i) => <RiskAlert key={i} text={r} />)}
                </View>
              </>
            )}

            {/* 5. Insight Chips */}
            {result.insights?.length > 0 && (
              <>
                <SectionHeader title="Insights" color={colors.cyan} />
                <View style={bk.insightRow}>
                  {result.insights.slice(0, 3).map((ins, i) => {
                    const insColor = i === 0 ? colors.primary : i === 1 ? colors.yellow : colors.cyan;
                    const insIcon  = i === 0 ? 'analytics-outline' : i === 1 ? 'cash-outline' : 'shield-outline';
                    return (
                      <View
                        key={i}
                        style={[ic.chip, { borderColor: `${insColor}50`, backgroundColor: `${insColor}12` }]}
                      >
                        <Ionicons name={insIcon} size={15} color={insColor} />
                        <Text style={[ic.label, { color: insColor }]} numberOfLines={2}>{ins}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* 6. AI Summary */}
            {result.ai_summary ? (
              <>
                <SectionHeader title="AI Summary" color={colors.primary} />
                <SummaryCard summary={result.ai_summary} animStyle={resultAnim} />
              </>
            ) : null}

            {/* 7. Score Breakdown */}
            <SectionHeader title="Score Breakdown" color={colors.textSecondary} />
            <DataTable rows={[
              { label: 'Liquidity Score',    value: `${result.liquidity_score}/100`,    bold: false, valueColor: scoreColor(result.liquidity_score) },
              { label: 'Cash Flow Score',    value: `${result.cash_flow_score}/100`,    bold: false, valueColor: scoreColor(result.cash_flow_score) },
              { label: 'Credit Score',       value: `${result.credit_score_component}/100`, bold: false, valueColor: scoreColor(result.credit_score_component) },
              { label: 'Repayment Score',    value: `${result.repayment_score}/100`,    bold: false, valueColor: scoreColor(result.repayment_score) },
              { label: 'Stability Score',    value: `${result.stability_score}/100`,    bold: false, valueColor: scoreColor(result.stability_score) },
              { label: 'Overall Score',      value: `${result.credit_score}/100`,       bold: true,  valueColor: scoreColor(result.credit_score) },
            ]} />
          </Animated.View>
        )}

        {!loading && !result && !error && (
          <View style={az.empty}>
            <Ionicons name="business-outline" size={52} color={colors.textMuted} />
            <Text style={az.emptyTitle}>No Banking Analysis Yet</Text>
            <Text style={az.emptyText}>
              Tap the button above to run a Perfios-style banking analysis with health score, risk alerts, and AI summary.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const bk = StyleSheet.create({
  liveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, marginBottom: 24, ...Platform.select({ ios: { shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 4 } }) },
  liveBtnText: { color: colors.card, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  healthCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 14, gap: 20, ...Platform.select({ ios: { shadowColor: '#1A2E1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 }, android: { elevation: 2 } }) },
  healthInfo:  { flex: 1, gap: 6 },
  healthGrade: { color: colors.text, fontSize: 20, fontWeight: '800' },
  healthRisk:  { color: colors.textSecondary, fontSize: 13 },
  eligBadge:   { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  eligText:    { fontSize: 12, fontWeight: '700' },
  riskCard:    { backgroundColor: '#FFF8F8', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#FFCDD2' },
  insightRow:  { flexDirection: 'row', gap: 8, marginBottom: 20 },
});

// ─── TREND SCREEN ─────────────────────────────────────────────────────────────

const DEMO_TREND = {
  company_name: 'Demo Corp',
  years_data: [
    { year: '2022', balance_sheet: { current_assets: 800000, current_liabilities: 550000, inventory: 150000, debtors: 200000, creditors: 180000, cash_bank_balance: 90000 }, profit_loss: { revenue: 2000000, cogs: 1300000, purchases: 900000, operating_expenses: 350000, net_profit: 120000 } },
    { year: '2023', balance_sheet: { current_assets: 950000, current_liabilities: 600000, inventory: 170000, debtors: 240000, creditors: 190000, cash_bank_balance: 130000 }, profit_loss: { revenue: 2400000, cogs: 1520000, purchases: 1050000, operating_expenses: 380000, net_profit: 160000 } },
    { year: '2024', balance_sheet: { current_assets: 1100000, current_liabilities: 650000, inventory: 190000, debtors: 280000, creditors: 200000, cash_bank_balance: 180000 }, profit_loss: { revenue: 2900000, cogs: 1780000, purchases: 1200000, operating_expenses: 420000, net_profit: 220000 } },
  ],
};

function GrowthBadge({ label, value, positive }) {
  const color = positive ? colors.green : colors.red;
  const icon  = positive ? 'trending-up' : 'trending-down';
  return (
    <View style={[gb.badge, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[gb.label, { color }]}>{label}</Text>
      <Text style={[gb.value, { color }]}>{value}</Text>
    </View>
  );
}

const gb = StyleSheet.create({
  badge:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  label:  { flex: 1, fontSize: 13, fontWeight: '600' },
  value:  { fontSize: 13, fontWeight: '700' },
});

function TrendScreen() {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const headerAnim = useFadeSlideIn(0);
  const resultAnim = useFadeSlideIn(100);

  const runDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiPost('/api/analysis/trend', DEMO_TREND);
      setResult(data);
    } catch (e) {
      setError(e.message || 'Trend analysis failed. Check API connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fmtL = (v) => v == null ? '–' : `₹${(v / 100000).toFixed(1)}L`;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[s.header, headerAnim]}>
          <View>
            <Text style={s.brand}>FINANCIAL ANALYTICS</Text>
            <Text style={s.title}>Multi-Year Trend</Text>
            <Text style={s.date}>Growth & Pattern Analysis</Text>
          </View>
          <View style={[s.refreshBtn, { backgroundColor: `${colors.cyan}20` }]}>
            <Ionicons name="trending-up-outline" size={22} color={colors.cyan} />
          </View>
        </Animated.View>

        <SectionHeader title="Run Analysis" color={colors.cyan} />
        <TouchableOpacity style={tr.liveBtn} onPress={runDemo} activeOpacity={0.75} disabled={loading}>
          <Ionicons name="bar-chart-outline" size={16} color={colors.card} />
          <Text style={tr.liveBtnText}>Run 3-Year Demo Analysis</Text>
        </TouchableOpacity>

        {loading && (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.cyan} />
            <Text style={s.loadingText}>Analyzing multi-year trends…</Text>
          </View>
        )}

        {!!error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.red} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {!loading && result && (
          <Animated.View style={resultAnim}>
            {/* 1. Revenue Trend Chart */}
            <SectionHeader title="Revenue Trend" color={colors.primary} />
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Revenue by Year</Text>
              <Text style={s.chartSub}>Amounts in Lakhs (₹)</Text>
              <BarChart
                data={result.years.map((y, i) => ({
                  value: result.trends.revenue[i] || 0,
                  label: y,
                  labelTop: fmtL(result.trends.revenue[i]),
                }))}
                delay={100}
                colorFn={() => colors.primary}
              />
            </View>

            {/* 2. Net Profit Trend Chart */}
            <SectionHeader title="Net Profit Trend" color={colors.green} />
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Net Profit by Year</Text>
              <Text style={s.chartSub}>Green = profit · Red = loss</Text>
              <BarChart
                data={result.years.map((y, i) => ({
                  value: result.trends.net_profit[i] || 0,
                  label: y,
                  labelTop: fmtL(result.trends.net_profit[i]),
                }))}
                delay={200}
                colorFn={(item) => item.value >= 0 ? colors.green : colors.red}
              />
            </View>

            {/* 3. Year Comparison Table */}
            <SectionHeader title="Year Comparison" color={colors.yellow} />
            <DataTable rows={[
              { label: 'Year', value: result.years.join(' → '), bold: true },
              ...result.years.map((y, i) => ({
                label: `FY ${y} Revenue`,
                value: fmtL(result.trends.revenue[i]),
                valueColor: colors.primary,
              })),
              ...result.years.map((y, i) => ({
                label: `FY ${y} Net Profit`,
                value: fmtL(result.trends.net_profit[i]),
                valueColor: (result.trends.net_profit[i] || 0) >= 0 ? colors.green : colors.red,
              })),
              ...result.years.map((y, i) => ({
                label: `FY ${y} Current Ratio`,
                value: `${(result.trends.current_ratio[i] || 0).toFixed(2)}x`,
                valueColor: (result.trends.current_ratio[i] || 0) >= 1.33 ? colors.green : colors.yellow,
              })),
            ]} />

            {/* 4. Growth Patterns */}
            {result.patterns && Object.keys(result.patterns).length > 0 && (
              <>
                <SectionHeader title="Growth Patterns" color={colors.cyan} />
                <View style={tr.patternsCard}>
                  {Object.entries(result.patterns).map(([metric, pattern]) => (
                    <GrowthBadge
                      key={metric}
                      label={metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      value={pattern}
                      positive={pattern === 'growing' || pattern === 'stable'}
                    />
                  ))}
                </View>
              </>
            )}

            {/* 5. CAGR */}
            {result.growth_trends?.cagr && (
              <>
                <SectionHeader title="CAGR Metrics" color={colors.orange} />
                <DataTable rows={Object.entries(result.growth_trends.cagr)
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => ({
                    label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    value: `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
                    valueColor: v >= 0 ? colors.green : colors.red,
                  }))
                } />
              </>
            )}

            {/* 6. AI Analysis */}
            {result.ai_analysis && (
              <>
                <SectionHeader title="AI Analysis" color={colors.primary} />
                <AnalysisResultCard analysis={result.ai_analysis} />
              </>
            )}

            {/* 7. Key Insights */}
            <SectionHeader title="Key Insights" color={colors.primary} />
            <View style={tr.insightsCard}>
              {result.insights.map((insight, i) => (
                <View key={i} style={tr.insightRow}>
                  <Ionicons name="information-circle" size={16} color={colors.primary} />
                  <Text style={tr.insightText}>{insight}</Text>
                </View>
              ))}
            </View>

            {/* 8. Recommendation */}
            <SectionHeader title="Recommendation" color={colors.green} />
            <SummaryCard summary={result.recommendation} animStyle={resultAnim} />
          </Animated.View>
        )}

        {!loading && !result && !error && (
          <View style={az.empty}>
            <Ionicons name="trending-up-outline" size={52} color={colors.textMuted} />
            <Text style={az.emptyTitle}>No Trend Analysis Yet</Text>
            <Text style={az.emptyText}>
              Tap the button above to run a 3-year trend analysis with growth patterns, CAGR, and AI insights.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const tr = StyleSheet.create({
  liveBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.cyan, borderRadius: 12, paddingVertical: 14, marginBottom: 24, ...Platform.select({ ios: { shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }, android: { elevation: 4 } }) },
  liveBtnText:  { color: colors.card, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  patternsCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.cardBorder },
  insightsCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.cardBorder },
  insightRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  insightText:  { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
});

// ─── BOTTOM TAB BAR ───────────────────────────────────────────────────────────

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'stats-chart-outline' },
  { key: 'analysis',  label: 'Analysis',  icon: 'pulse-outline'       },
  { key: 'banking',   label: 'Banking',   icon: 'business-outline'    },
  { key: 'trend',     label: 'Trend',     icon: 'trending-up-outline' },
];

function TabBar({ active, onChange }) {
  return (
    <View style={tb.bar}>
      {TABS.map(tab => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={tb.tab}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
              size={22}
              color={isActive ? colors.tabActive : colors.tabInactive}
            />
            <Text style={[tb.label, isActive && tb.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar:         { flexDirection: 'row', backgroundColor: colors.tabBar, borderTopWidth: 1, borderTopColor: colors.tabBarBorder, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 20 : 10, height: Platform.OS === 'ios' ? 82 : 62 },
  tab:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label:       { fontSize: 10, fontWeight: '600', color: colors.tabInactive },
  labelActive: { color: colors.tabActive },
});

// ─── STYLES ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  scroll:      { padding: 20, paddingBottom: 32 },

  // Header
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  brand:       { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  title:       { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 2 },
  date:        { color: colors.textSecondary, fontSize: 12 },
  refreshBtn:  { padding: 8, backgroundColor: colors.primaryLight, borderRadius: 20 },

  // Badges
  badgeRow:    { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.cardBorder },
  badgePrimary:{ borderColor: colors.primary, backgroundColor: colors.primaryLight },
  badgeText:   { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },

  // Loading / error
  loadingBox:  { alignItems: 'center', paddingVertical: 32, gap: 10 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  errorBox:    { alignItems: 'center', paddingVertical: 24, gap: 8, backgroundColor: '#FFF8F8', borderRadius: 14, borderWidth: 1, borderColor: '#FFCDD2', marginBottom: 16 },
  errorText:   { color: colors.red, fontSize: 13 },
  retryBtn:    { backgroundColor: colors.primaryLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  retryText:   { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // KPI
  kpiRow:      { flexDirection: 'row', gap: 12, marginBottom: 12 },

  // Chart card
  chartCard:   { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, padding: 16, marginBottom: 14, ...Platform.select({ ios: { shadowColor: '#1A2E1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 }, android: { elevation: 2 } }) },
  chartTitle:  { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  chartSub:    { color: colors.textSecondary, fontSize: 12, marginBottom: 12 },

  // Analysis summary
  analysisRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  aCard:       { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
  aIcon:       { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  aValue:      { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  aLabel:      { color: colors.textSecondary, fontSize: 11, fontWeight: '500', textAlign: 'center' },

  // Recent cases
  caseCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 8 },
  caseIcon:    { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  caseName:    { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  caseMeta:    { color: colors.textMuted, fontSize: 11 },

  // Health screen
  rawCard:     { backgroundColor: '#F8FFF8', borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, padding: 14, marginBottom: 14 },
  rawTitle:    { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  rawBody:     { color: colors.text, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  epRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 8 },
  epMethod:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  epMethodText:{ fontSize: 10, fontWeight: '700' },
  epPath:      { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  epDesc:      { color: colors.textMuted, fontSize: 11 },
});

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {activeTab === 'dashboard' ? <DashboardScreen />
          : activeTab === 'analysis' ? <AnalysisScreen />
          : activeTab === 'banking'  ? <BankingScreen />
          : <TrendScreen />}
        <TabBar active={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaProvider>
  );
}
