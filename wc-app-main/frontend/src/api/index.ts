import axios from 'axios';
import {
  WorkingCapitalInput,
  WorkingCapitalResult,
  BankingInput,
  BankingResult,
  MultiYearInput,
  MultiYearResult,
  Case,
  DashboardStats,
} from '../types';

const PRODUCTION_API_URL = 'https://perfect-backend-production-8ad7.up.railway.app';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;

if (__DEV__) {
  console.log('[API] Using base URL:', API_BASE);
}

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Working Capital Analysis
export const analyzeWorkingCapital = async (data: WorkingCapitalInput): Promise<WorkingCapitalResult> => {
  const response = await api.post('/analysis/wc', data);
  return response.data;
};

// Banking Analysis
export const analyzeBanking = async (data: BankingInput): Promise<BankingResult> => {
  const response = await api.post('/analysis/banking', data);
  return response.data;
};

// Multi-Year Trend Analysis
export const analyzeMultiYear = async (data: MultiYearInput): Promise<MultiYearResult> => {
  const response = await api.post('/analysis/trend', data);
  return response.data;
};

// Cases
export const saveCase = async (caseData: Case): Promise<Case> => {
  const response = await api.post('/cases', caseData);
  return response.data;
};

export const getCases = async (): Promise<Case[]> => {
  const response = await api.get('/cases');
  return response.data;
};

export const getCase = async (caseId: string): Promise<Case> => {
  const response = await api.get(`/cases/${caseId}`);
  return response.data;
};

export const deleteCase = async (caseId: string): Promise<void> => {
  await api.delete(`/cases/${caseId}`);
};

// Dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

// Document Parsing via Backend (Gemini Vision AI)
export interface ParsedFinancialData {
  // Balance Sheet fields
  current_assets?: number;
  current_liabilities?: number;
  inventory?: number;
  debtors?: number;
  receivables?: number;
  creditors?: number;
  payables?: number;
  cash_bank_balance?: number;
  cash?: number;
  // P&L fields
  revenue?: number;
  sales?: number;
  cogs?: number;
  cost_of_goods_sold?: number;
  purchases?: number;
  operating_expenses?: number;
  expenses?: number;
  net_profit?: number;
  profit?: number;
  // Banking fields
  total_credits?: number;
  total_debits?: number;
  average_balance?: number;
  minimum_balance?: number;
  opening_balance?: number;
  closing_balance?: number;
  cash_deposits?: number;
  cheque_bounces?: number;
  loan_repayments?: number;
  overdraft_usage?: number;
  ecs_emi_payments?: number;
  num_transactions?: number;
}

export interface ParseDocumentResponse {
  success: boolean;
  parsed_data: ParsedFinancialData;
  message: string;
}

export const parseDocument = async (
  fileUri: string,
  fileName: string,
  mimeType: string,
  documentType: string
): Promise<ParseDocumentResponse> => {
  const formData = new FormData();

  // @ts-ignore - React Native FormData accepts this format
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType || 'image/jpeg',
  });
  formData.append('document_type', documentType);

  if (__DEV__) {
    console.log('[API] Uploading document to:', `${API_BASE}/api/parse/upload`);
    console.log('[API] File:', fileName, mimeType, 'Type:', documentType);
  }

  const response = await fetch(`${API_BASE}/api/parse/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Document parse failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (__DEV__) {
    console.log('[API] Parse response:', data);
  }

  return {
    success: data.success,
    parsed_data: data.parsed_data || {},
    message: data.message || '',
  };
};

// PDF Export
export const exportPDF = async (
  analysisType: string,
  data: any,
  companyName: string
): Promise<Blob> => {
  const response = await fetch(`${API_BASE}/api/export/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      analysis_type: analysisType,
      data: data,
      company_name: companyName,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF');
  }

  return await response.blob();
};

export default api;
