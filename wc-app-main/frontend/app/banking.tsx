import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../src/theme/colors';
import { Card, SectionHeader, InputField, StatusBadge } from '../src/components';
import { analyzeBanking, saveCase, parseDocument, exportPDF } from '../src/api';
import { BankingResult } from '../src/types';
import { useAppStore } from '../src/store';

interface SelectedFile {
  name: string;
  uri: string;
  type: string;
  size?: number;
}

export default function BankingScreen() {
  const { setBankingResult } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<BankingResult | null>(null);
  const [bankStatementFile, setBankStatementFile] = useState<SelectedFile | null>(null);

  // Credits & Debits
  const [totalCredits, setTotalCredits] = useState('');
  const [totalDebits, setTotalDebits] = useState('');

  // Account Balances
  const [avgBalance, setAvgBalance] = useState('');
  const [minBalance, setMinBalance] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');

  // Risk Indicators
  const [cashDeposits, setCashDeposits] = useState('');
  const [chequeBounces, setChequeBounces] = useState('');
  const [loanRepayments, setLoanRepayments] = useState('');
  const [overdraftUsage, setOverdraftUsage] = useState('');
  const [ecsEmi, setEcsEmi] = useState('');
  const [numTransactions, setNumTransactions] = useState('');

  const [companyName, setCompanyName] = useState('Company');
  const [exporting, setExporting] = useState(false);

  const pickBankStatement = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileName = file.name.toLowerCase();
        
        // Validate file type
        const validExtensions = ['.pdf', '.xlsx', '.xls', '.csv', '.jpg', '.jpeg', '.png', '.heic', '.heif'];
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!isValid) {
          Alert.alert('Invalid File', 'Please select a PDF, Excel, CSV, or Image file.');
          return;
        }
        
        setBankStatementFile({
          name: file.name,
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          size: file.size,
        });
      }
    } catch (error) {
      console.log('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const [parsing, setParsing] = useState(false);

  const handleParseBankStatement = async () => {
    if (!bankStatementFile) {
      Alert.alert('No File', 'Please select a bank statement to parse.');
      return;
    }

    setParsing(true);
    
    try {
      console.log('Sending bank statement to local backend:', bankStatementFile.name);
      
      const response = await parseDocument(
        bankStatementFile.uri,
        bankStatementFile.name,
        bankStatementFile.type,
        'bank_statement'
      );
      
      console.log('Parse response:', response);
      
      if (response.success && response.parsed_data) {
        const data = response.parsed_data;
        let hasData = false;
        
        if (data.total_credits) { setTotalCredits(String(data.total_credits)); hasData = true; }
        if (data.total_debits) { setTotalDebits(String(data.total_debits)); hasData = true; }
        if (data.average_balance) { setAvgBalance(String(data.average_balance)); hasData = true; }
        if (data.minimum_balance) { setMinBalance(String(data.minimum_balance)); hasData = true; }
        if (data.opening_balance) { setOpeningBalance(String(data.opening_balance)); hasData = true; }
        if (data.closing_balance) { setClosingBalance(String(data.closing_balance)); hasData = true; }
        if (data.cash_deposits) { setCashDeposits(String(data.cash_deposits)); hasData = true; }
        if (data.cheque_bounces !== undefined) { setChequeBounces(String(data.cheque_bounces)); hasData = true; }
        if (data.loan_repayments) { setLoanRepayments(String(data.loan_repayments)); hasData = true; }
        if (data.overdraft_usage) { setOverdraftUsage(String(data.overdraft_usage)); hasData = true; }
        if (data.ecs_emi_payments) { setEcsEmi(String(data.ecs_emi_payments)); hasData = true; }
        if (data.num_transactions) { setNumTransactions(String(data.num_transactions)); hasData = true; }
        
        if (hasData) {
          Alert.alert(
            'Parsing Complete',
            'Bank statement parsed using Gemini Vision AI!\n\nExtracted values have been filled in. Please verify and edit if needed.'
          );
        } else {
          Alert.alert(
            'Parsing Issue',
            'Text was extracted but no financial values found.\n\nPlease enter values manually.'
          );
        }
      } else {
        Alert.alert(
          'Parsing Issue',
          response.message || 'Could not extract data from the bank statement.\n\nPlease enter values manually.'
        );
      }
      
    } catch (error: any) {
      console.log('Parse error:', error);
      Alert.alert(
        'Parsing Error',
        `Could not parse document: ${error?.message || 'Unknown error'}.\n\nPlease enter values manually.`
      );
    }
    
    setParsing(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const data = {
        company_name: companyName,
        total_credits: parseFloat(totalCredits) || 0,
        total_debits: parseFloat(totalDebits) || 0,
        average_balance: parseFloat(avgBalance) || 0,
        minimum_balance: parseFloat(minBalance) || 0,
        opening_balance: parseFloat(openingBalance) || 0,
        closing_balance: parseFloat(closingBalance) || 0,
        cash_deposits: parseFloat(cashDeposits) || 0,
        cheque_bounces: parseInt(chequeBounces) || 0,
        loan_repayments: parseFloat(loanRepayments) || 0,
        overdraft_usage: parseFloat(overdraftUsage) || 0,
        ecs_emi_payments: parseFloat(ecsEmi) || 0,
        num_transactions: parseInt(numTransactions) || 0,
        sanctioned_limit: 0,
        utilized_limit: 0,
      };

      const res = await analyzeBanking(data);
      setResult(res);
      setBankingResult(res);
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'Failed to analyze banking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCase = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await saveCase({
        id: result.id,
        company_name: result.company_name,
        analysis_type: 'banking',
        timestamp: new Date().toISOString(),
        data: result,
      });
      Alert.alert('Success', 'Case saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save case.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setBankingResult(null);
    setTotalCredits('');
    setTotalDebits('');
    setAvgBalance('');
    setMinBalance('');
    setOpeningBalance('');
    setClosingBalance('');
    setCashDeposits('');
    setChequeBounces('');
    setLoanRepayments('');
    setOverdraftUsage('');
    setEcsEmi('');
    setNumTransactions('');
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setExporting(true);
    try {
      const blob = await exportPDF('banking', result, result.company_name);
      if (typeof window !== 'undefined' && window.URL) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.company_name}_Banking_Report.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      Alert.alert('Success', 'PDF report downloaded!');
    } catch (error) {
      console.log('PDF export error:', error);
      Alert.alert('Error', 'Failed to generate PDF report.');
    } finally {
      setExporting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return colors.green;
    if (score >= 65) return colors.yellow;
    if (score >= 50) return colors.orange;
    return colors.red;
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    if (status === 'Adequate' || status === 'Strong' || status === 'Disciplined') return 'success';
    if (status === 'Moderate' || status === 'Needs Improvement') return 'warning';
    if (status === 'Weak') return 'error';
    return 'neutral';
  };

  const gradeText: Record<string, string> = {
    'A': 'Excellent — Full Approval',
    'B': 'Good — Conditional Approval',
    'C': 'Fair — Review Required',
    'D': 'Poor — Not Recommended',
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>FINANCIAL ANALYTICS</Text>
          <Text style={styles.title}>Banking Performance</Text>
          <Text style={styles.subtitle}>Bank Statement Analysis & Credit Assessment</Text>
        </View>

        {/* Upload Bank Statement */}
        <Card>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>Upload Bank Statement</Text>
              <Text style={styles.stepSubtitle}>Select your bank statement for analysis</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.uploadButton} onPress={pickBankStatement}>
            <Ionicons 
              name={bankStatementFile ? "checkmark-circle" : "cloud-upload-outline"} 
              size={20} 
              color={bankStatementFile ? colors.green : colors.primary} 
            />
            <View style={styles.uploadTextContainer}>
              <Text style={[styles.uploadButtonTextStyle, bankStatementFile && styles.uploadButtonTextSelected]}>
                {bankStatementFile ? bankStatementFile.name : 'Select Bank Statement (PDF / Excel / CSV)'}
              </Text>
              {bankStatementFile && (
                <Text style={styles.fileSize}>{formatFileSize(bankStatementFile.size)}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Parse Bank Statement Button */}
          {bankStatementFile && (
            <TouchableOpacity
              style={styles.parseButton}
              onPress={handleParseBankStatement}
              disabled={parsing}
            >
              <LinearGradient
                colors={[colors.yellow, colors.orange]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.parseGradient}
              >
                {parsing ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.parseText}>Parsing Statement...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="scan-outline" size={20} color="#fff" />
                    <Text style={styles.parseText}>Parse & Extract Data</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Card>

        {/* Calculate Button */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={handleAnalyze}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.green, colors.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.calculateGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="analytics-outline" size={20} color="#fff" />
                <Text style={styles.calculateText}>Analyze Banking Performance</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Credits & Debits */}
        <SectionHeader title="Credits & Debits" color={colors.primary} />
        <Card>
          <InputField label="Total Credits" value={totalCredits} onChangeText={setTotalCredits} />
          <InputField label="Total Debits" value={totalDebits} onChangeText={setTotalDebits} />
        </Card>

        {/* Account Balances */}
        <SectionHeader title="Account Balances" color={colors.yellow} />
        <Card>
          <InputField label="Average Balance" value={avgBalance} onChangeText={setAvgBalance} />
          <InputField label="Minimum Balance" value={minBalance} onChangeText={setMinBalance} />
          <InputField label="Opening Balance" value={openingBalance} onChangeText={setOpeningBalance} />
          <InputField label="Closing Balance" value={closingBalance} onChangeText={setClosingBalance} />
        </Card>

        {/* Risk Indicators */}
        <SectionHeader title="Risk Indicators" color={colors.red} />
        <Card>
          <InputField label="Cash Deposits" value={cashDeposits} onChangeText={setCashDeposits} />
          <InputField label="Cheque Bounces (#)" value={chequeBounces} onChangeText={setChequeBounces} keyboardType="numeric" />
          <InputField label="Loan Repayments" value={loanRepayments} onChangeText={setLoanRepayments} />
          <InputField label="Overdraft Usage" value={overdraftUsage} onChangeText={setOverdraftUsage} />
          <InputField label="ECS / EMI Payments" value={ecsEmi} onChangeText={setEcsEmi} />
          <InputField label="No. of Transactions" value={numTransactions} onChangeText={setNumTransactions} keyboardType="numeric" />
        </Card>

        {/* Credit Risk Assessment */}
        {result && (
          <>
            <SectionHeader title="Credit Risk Assessment" color={colors.cyan} />
            <Card>
              <View style={styles.gradeRow}>
                <View>
                  <Text style={styles.gradeLabel}>Grade {result.grade} — {result.grade === 'A' ? 'Excellent' : result.grade === 'B' ? 'Good' : result.grade === 'C' ? 'Fair' : 'Poor'} — {result.grade === 'A' || result.grade === 'B' ? 'Acceptable' : 'Review Needed'}</Text>
                  <StatusBadge status={`Risk Level: ${result.risk_level}`} variant={result.risk_level === 'Low' ? 'success' : result.risk_level === 'Medium' ? 'warning' : 'error'} />
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(result.credit_score) }]}>
                    {result.credit_score}
                  </Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
              </View>
            </Card>

            {/* Status Grid */}
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>WORKING CAPITAL</Text>
                <StatusBadge status={result.working_capital_status} variant={getStatusVariant(result.working_capital_status)} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>LIQUIDITY</Text>
                <StatusBadge status={result.liquidity_status} variant={getStatusVariant(result.liquidity_status)} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>CASH FLOW</Text>
                <StatusBadge status={result.cash_flow_status} variant={getStatusVariant(result.cash_flow_status)} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>CREDITWORTHINESS</Text>
                <StatusBadge status={result.creditworthiness_status} variant={getStatusVariant(result.creditworthiness_status)} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>REPAYMENT</Text>
                <StatusBadge status={result.repayment_status} variant={getStatusVariant(result.repayment_status)} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>STABILITY</Text>
                <StatusBadge status={result.stability_status} variant={getStatusVariant(result.stability_status)} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>BEHAVIOR</Text>
                <StatusBadge status={result.behavior_status} variant={getStatusVariant(result.behavior_status)} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>RISK LEVEL</Text>
                <StatusBadge status={result.risk_level} variant={result.risk_level === 'Low' ? 'success' : result.risk_level === 'Medium' ? 'warning' : 'error'} />
              </View>
            </View>

            {/* Score Breakdown */}
            <Card>
              <View style={styles.scoreBreakdownHeader}>
                <View style={styles.scorePieContainer}>
                  <Text style={[styles.scorePieValue, { color: getScoreColor(result.credit_score) }]}>
                    {result.credit_score}%
                  </Text>
                  <Text style={styles.scorePieLabel}>Score</Text>
                </View>
                <View style={styles.scoreBreakdown}>
                  <View style={styles.scoreBar}>
                    <Text style={styles.scoreBarLabel}>Liquidity</Text>
                    <View style={styles.scoreBarTrack}>
                      <View style={[styles.scoreBarFill, { width: `${result.liquidity_score}%`, backgroundColor: colors.yellow }]} />
                    </View>
                    <Text style={styles.scoreBarValue}>{result.liquidity_score}%</Text>
                  </View>
                  <View style={styles.scoreBar}>
                    <Text style={styles.scoreBarLabel}>Cash Flow</Text>
                    <View style={styles.scoreBarTrack}>
                      <View style={[styles.scoreBarFill, { width: `${result.cash_flow_score}%`, backgroundColor: colors.green }]} />
                    </View>
                    <Text style={styles.scoreBarValue}>{result.cash_flow_score}%</Text>
                  </View>
                  <View style={styles.scoreBar}>
                    <Text style={styles.scoreBarLabel}>Credit</Text>
                    <View style={styles.scoreBarTrack}>
                      <View style={[styles.scoreBarFill, { width: `${result.credit_score_component}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={styles.scoreBarValue}>{result.credit_score_component}%</Text>
                  </View>
                  <View style={styles.scoreBar}>
                    <Text style={styles.scoreBarLabel}>Repayment</Text>
                    <View style={styles.scoreBarTrack}>
                      <View style={[styles.scoreBarFill, { width: `${result.repayment_score}%`, backgroundColor: colors.orange }]} />
                    </View>
                    <Text style={styles.scoreBarValue}>{result.repayment_score}%</Text>
                  </View>
                  <View style={styles.scoreBar}>
                    <Text style={styles.scoreBarLabel}>Stability</Text>
                    <View style={styles.scoreBarTrack}>
                      <View style={[styles.scoreBarFill, { width: `${result.stability_score}%`, backgroundColor: colors.cyan }]} />
                    </View>
                    <Text style={styles.scoreBarValue}>{result.stability_score}%</Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* Overall Status */}
            <Card style={[styles.overallCard, { backgroundColor: result.grade === 'A' || result.grade === 'B' ? colors.green + '15' : colors.red + '15' }]}>
              <View style={styles.overallHeader}>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeBadgeText}>{result.grade}</Text>
                </View>
                <View>
                  <Text style={[styles.overallTitle, { color: result.grade === 'A' || result.grade === 'B' ? colors.green : colors.red }]}>
                    {gradeText[result.grade]?.toUpperCase()}
                  </Text>
                  <Text style={styles.overallSubtitle}>Overall Score: {result.credit_score}/100</Text>
                </View>
              </View>
            </Card>

            {/* Strengths */}
            <SectionHeader title="Strengths" color={colors.green} />
            <Card>
              {result.strengths.map((s, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                  <Text style={styles.listText}>{s}</Text>
                </View>
              ))}
            </Card>

            {/* Concerns */}
            <SectionHeader title="Concerns" color={colors.red} />
            <Card>
              {result.concerns.map((c, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="alert-circle" size={16} color={colors.red} />
                  <Text style={styles.listText}>{c}</Text>
                </View>
              ))}
            </Card>

            {/* Recommendation */}
            <SectionHeader title="Credit Officer Recommendation" color={colors.primary} />
            <Card>
              <Text style={styles.recommendationText}>{result.recommendation}</Text>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSaveCase} disabled={!result || saving}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={colors.primary} />
                <Text style={styles.actionButtonText}>Save Case</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportPDF} disabled={!result || exporting}>
            {exporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={colors.primary} />
                <Text style={styles.actionButtonText}>Export PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.resetButtonText}>Start New Analysis</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  brandName: {
    color: colors.green,
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
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  stepSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadButtonTextStyle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  uploadButtonTextSelected: {
    color: colors.text,
    fontWeight: '500',
  },
  fileSize: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  parseButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 6,
  },
  parseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  parseText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  calculateButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  calculateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  calculateText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: '700',
  },
  scoreMax: {
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statusItem: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
  },
  scoreBreakdownHeader: {
    flexDirection: 'row',
    gap: 20,
  },
  scorePieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: colors.primary,
  },
  scorePieValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  scorePieLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
  scoreBreakdown: {
    flex: 1,
    gap: 8,
  },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBarLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    width: 70,
  },
  scoreBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.inputBackground,
    borderRadius: 3,
  },
  scoreBarFill: {
    height: 6,
    borderRadius: 3,
  },
  scoreBarValue: {
    color: colors.textSecondary,
    fontSize: 11,
    width: 35,
    textAlign: 'right',
  },
  overallCard: {
    borderColor: colors.cardBorder,
  },
  overallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gradeBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  overallTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  overallSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  listText: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  recommendationText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 8,
    marginBottom: 20,
  },
  resetButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
