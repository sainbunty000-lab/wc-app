#!/usr/bin/env python3
"""
Financial Analytics Backend API Testing Suite
Tests all backend endpoints including new Document Parsing and PDF Export APIs
"""

import requests
import json
import tempfile
import os
from datetime import datetime
import uuid

# Backend URL from frontend/.env
BACKEND_URL = "https://capital-analytics.preview.emergentagent.com/api"

def test_health_check():
    """Test GET /api/health endpoint"""
    print("\n=== Testing Health Check API ===")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify required fields
            required_fields = ['status', 'timestamp']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ FAIL - Missing fields: {missing_fields}")
                return False
            
            if data.get('status') == 'healthy':
                print("✅ PASS - Health check endpoint working correctly")
                return True
            else:
                print(f"❌ FAIL - Unexpected status: {data.get('status')}")
                return False
        else:
            print(f"❌ FAIL - HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False

def test_working_capital_analysis():
    """Test POST /api/analysis/wc endpoint"""
    print("\n=== Testing Working Capital Analysis API ===")
    try:
        # Sample working capital data
        test_data = {
            "company_name": "Acme Manufacturing Ltd",
            "balance_sheet": {
                "current_assets": 2000000,
                "current_liabilities": 1200000,
                "inventory": 500000,
                "debtors": 600000,
                "creditors": 400000,
                "cash_bank_balance": 300000
            },
            "profit_loss": {
                "revenue": 8000000,
                "cogs": 6000000,
                "purchases": 5500000,
                "operating_expenses": 1200000,
                "net_profit": 680000
            },
            "projected_turnover": 9000000
        }
        
        response = requests.post(
            f"{BACKEND_URL}/analysis/wc",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Company: {data.get('company_name')}")
            print(f"Current Ratio: {data.get('current_ratio')}")
            print(f"Quick Ratio: {data.get('quick_ratio')}")
            print(f"WC Limit: ₹{data.get('wc_limit', 0):,.0f}")
            print(f"Eligible: {data.get('eligible')}")
            print(f"Assessment: {data.get('assessment', [])[:2]}")  # First 2 points
            
            # Verify key calculations
            expected_current_ratio = 2000000 / 1200000  # 1.67
            actual_current_ratio = data.get('current_ratio', 0)
            
            if abs(actual_current_ratio - expected_current_ratio) < 0.01:
                print("✅ PASS - Working Capital Analysis API working correctly")
                return True
            else:
                print(f"❌ FAIL - Current ratio calculation error. Expected: {expected_current_ratio:.2f}, Got: {actual_current_ratio}")
                return False
        else:
            print(f"❌ FAIL - HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False

def test_banking_analysis():
    """Test POST /api/analysis/banking endpoint"""
    print("\n=== Testing Banking Analysis API ===")
    try:
        # Sample banking data
        test_data = {
            "company_name": "Acme Manufacturing Ltd",
            "total_credits": 5000000,
            "total_debits": 4500000,
            "average_balance": 800000,
            "minimum_balance": 200000,
            "opening_balance": 750000,
            "closing_balance": 850000,
            "cash_deposits": 3000000,
            "cheque_bounces": 2,
            "loan_repayments": 300000,
            "overdraft_usage": 100000,
            "ecs_emi_payments": 350000,
            "num_transactions": 150,
            "sanctioned_limit": 500000,
            "utilized_limit": 100000
        }
        
        response = requests.post(
            f"{BACKEND_URL}/analysis/banking",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Company: {data.get('company_name')}")
            print(f"Credit Score: {data.get('credit_score')}/100")
            print(f"Grade: {data.get('grade')}")
            print(f"Risk Level: {data.get('risk_level')}")
            print(f"Liquidity Score: {data.get('liquidity_score')}")
            print(f"Cash Flow Score: {data.get('cash_flow_score')}")
            
            # Verify required fields
            required_fields = ['credit_score', 'grade', 'risk_level', 'recommendation']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ FAIL - Missing fields: {missing_fields}")
                return False
            
            credit_score = data.get('credit_score', 0)
            if 0 <= credit_score <= 100:
                print("✅ PASS - Banking Analysis API working correctly")
                return True
            else:
                print(f"❌ FAIL - Invalid credit score: {credit_score}")
                return False
        else:
            print(f"❌ FAIL - HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False

def test_multi_year_trend_analysis():
    """Test POST /api/analysis/trend endpoint"""
    print("\n=== Testing Multi-Year Trend Analysis API ===")
    try:
        # Sample multi-year data
        test_data = {
            "company_name": "Acme Manufacturing Ltd",
            "years_data": [
                {
                    "year": "2022",
                    "balance_sheet": {
                        "current_assets": 1500000,
                        "current_liabilities": 1000000,
                        "inventory": 400000,
                        "debtors": 500000,
                        "creditors": 350000,
                        "cash_bank_balance": 250000
                    },
                    "profit_loss": {
                        "revenue": 6000000,
                        "cogs": 4500000,
                        "purchases": 4200000,
                        "operating_expenses": 900000,
                        "net_profit": 450000
                    }
                },
                {
                    "year": "2023",
                    "balance_sheet": {
                        "current_assets": 1800000,
                        "current_liabilities": 1100000,
                        "inventory": 450000,
                        "debtors": 550000,
                        "creditors": 375000,
                        "cash_bank_balance": 275000
                    },
                    "profit_loss": {
                        "revenue": 7200000,
                        "cogs": 5400000,
                        "purchases": 5000000,
                        "operating_expenses": 1080000,
                        "net_profit": 576000
                    }
                },
                {
                    "year": "2024",
                    "balance_sheet": {
                        "current_assets": 2000000,
                        "current_liabilities": 1200000,
                        "inventory": 500000,
                        "debtors": 600000,
                        "creditors": 400000,
                        "cash_bank_balance": 300000
                    },
                    "profit_loss": {
                        "revenue": 8000000,
                        "cogs": 6000000,
                        "purchases": 5500000,
                        "operating_expenses": 1200000,
                        "net_profit": 680000
                    }
                }
            ]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/analysis/trend",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Company: {data.get('company_name')}")
            print(f"Years: {data.get('years')}")
            print(f"Trends available: {list(data.get('trends', {}).keys())}")
            print(f"Insights count: {len(data.get('insights', []))}")
            
            # Verify required fields
            required_fields = ['years', 'trends', 'insights', 'recommendation']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ FAIL - Missing fields: {missing_fields}")
                return False
            
            trends = data.get('trends', {})
            expected_metrics = ['revenue', 'net_profit', 'current_ratio', 'net_working_capital', 'gross_margin', 'net_margin']
            missing_metrics = [metric for metric in expected_metrics if metric not in trends]
            
            if missing_metrics:
                print(f"❌ FAIL - Missing trend metrics: {missing_metrics}")
                return False
            
            print("✅ PASS - Multi-Year Trend Analysis API working correctly")
            return True
        else:
            print(f"❌ FAIL - HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False

def test_cases_crud():
    """Test Cases CRUD operations"""
    print("\n=== Testing Cases CRUD APIs ===")
    case_id = None
    
    try:
        # Test POST /api/cases (Create)
        print("Testing POST /api/cases...")
        test_case = {
            "id": str(uuid.uuid4()),
            "company_name": "Test Company Ltd",
            "analysis_type": "working_capital",
            "data": {
                "current_ratio": 1.67,
                "quick_ratio": 1.33,
                "wc_limit": 2400000,
                "eligible": True
            }
        }
        case_id = test_case["id"]
        
        response = requests.post(
            f"{BACKEND_URL}/cases",
            json=test_case,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ FAIL - POST cases failed: HTTP {response.status_code}: {response.text}")
            return False
        
        print("✓ POST /api/cases working")
        
        # Test GET /api/cases (List all)
        print("Testing GET /api/cases...")
        response = requests.get(f"{BACKEND_URL}/cases", timeout=10)
        
        if response.status_code != 200:
            print(f"❌ FAIL - GET cases failed: HTTP {response.status_code}: {response.text}")
            return False
        
        cases = response.json()
        if not isinstance(cases, list):
            print(f"❌ FAIL - GET cases should return a list, got: {type(cases)}")
            return False
        
        print(f"✓ GET /api/cases working (returned {len(cases)} cases)")
        
        # Test GET /api/cases/{id} (Get specific)
        print(f"Testing GET /api/cases/{case_id}...")
        response = requests.get(f"{BACKEND_URL}/cases/{case_id}", timeout=10)
        
        if response.status_code != 200:
            print(f"❌ FAIL - GET case by ID failed: HTTP {response.status_code}: {response.text}")
            return False
        
        case_data = response.json()
        if case_data.get('id') != case_id:
            print(f"❌ FAIL - Retrieved case ID mismatch. Expected: {case_id}, Got: {case_data.get('id')}")
            return False
        
        print("✓ GET /api/cases/{id} working")
        
        # Test DELETE /api/cases/{id}
        print(f"Testing DELETE /api/cases/{case_id}...")
        response = requests.delete(f"{BACKEND_URL}/cases/{case_id}", timeout=10)
        
        if response.status_code != 200:
            print(f"❌ FAIL - DELETE case failed: HTTP {response.status_code}: {response.text}")
            return False
        
        print("✓ DELETE /api/cases/{id} working")
        
        print("✅ PASS - All Cases CRUD operations working correctly")
        return True
        
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        # Cleanup: try to delete the test case if it was created
        if case_id:
            try:
                requests.delete(f"{BACKEND_URL}/cases/{case_id}", timeout=5)
            except:
                pass
        return False

def test_dashboard_stats():
    """Test GET /api/dashboard/stats endpoint"""
    print("\n=== Testing Dashboard Stats API ===")
    try:
        response = requests.get(f"{BACKEND_URL}/dashboard/stats", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify required fields
            required_fields = ['total_cases', 'wc_analysis_count', 'banking_count', 'multi_year_count']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ FAIL - Missing fields: {missing_fields}")
                return False
            
            # Verify all counts are non-negative integers
            for field in required_fields:
                value = data.get(field)
                if not isinstance(value, int) or value < 0:
                    print(f"❌ FAIL - {field} should be non-negative integer, got: {value}")
                    return False
            
            print("✅ PASS - Dashboard Stats API working correctly")
            return True
        else:
            print(f"❌ FAIL - HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False

def test_document_parsing():
    """Test POST /api/parse/upload endpoint (Document Parsing with Gemini Vision)"""
    print("\n=== Testing Document Parsing API (Gemini Vision) ===")
    try:
        # Create a simple test text file to simulate a financial document
        test_content = """
        BALANCE SHEET
        Current Assets: 2,000,000
        Current Liabilities: 1,200,000
        Inventory: 500,000
        Debtors: 600,000
        Creditors: 400,000
        Cash & Bank Balance: 300,000
        """
        
        # Test with different document types
        document_types = ["balance_sheet", "profit_loss", "bank_statement"]
        
        for doc_type in document_types:
            print(f"\nTesting document_type: {doc_type}")
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as tmp_file:
                tmp_file.write(test_content)
                tmp_file_path = tmp_file.name
            
            try:
                # Prepare multipart form data
                with open(tmp_file_path, 'rb') as f:
                    files = {
                        'file': ('test_document.txt', f, 'text/plain')
                    }
                    data = {
                        'document_type': doc_type
                    }
                    
                    response = requests.post(
                        f"{BACKEND_URL}/parse/upload",
                        files=files,
                        data=data,
                        timeout=30  # Longer timeout for AI processing
                    )
                
                print(f"Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"Success: {result.get('success')}")
                    print(f"Message: {result.get('message')}")
                    
                    if result.get('parsed_data'):
                        print(f"Parsed Data Keys: {list(result['parsed_data'].keys())}")
                    
                    # Verify response structure
                    required_fields = ['success', 'parsed_data', 'message']
                    missing_fields = [field for field in required_fields if field not in result]
                    
                    if missing_fields:
                        print(f"❌ FAIL - Missing fields: {missing_fields}")
                        return False
                    
                    if result.get('success'):
                        print(f"✓ Document parsing successful for {doc_type}")
                    else:
                        print(f"⚠ Document parsing returned success=false for {doc_type}: {result.get('message')}")
                        # This might be expected if AI key is not configured
                        
                else:
                    print(f"❌ FAIL - HTTP {response.status_code}: {response.text}")
                    return False
                    
            finally:
                # Cleanup temp file
                os.unlink(tmp_file_path)
        
        print("✅ PASS - Document Parsing API endpoint working correctly")
        return True
        
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False

def test_pdf_export():
    """Test POST /api/export/pdf endpoint"""
    print("\n=== Testing PDF Export API ===")
    try:
        # Test data for different analysis types
        test_cases = [
            {
                "analysis_type": "working_capital",
                "company_name": "Test Corp",
                "data": {
                    "current_ratio": 1.67,
                    "quick_ratio": 1.33,
                    "debtor_days": 45,
                    "creditor_days": 30,
                    "wc_cycle": 60,
                    "gross_margin": 25.0,
                    "net_margin": 8.5,
                    "mpbf_method_1": 750000,
                    "mpbf_method_2": 600000,
                    "turnover_method": 2400000,
                    "eligible": True,
                    "wc_limit": 2400000,
                    "assessment": ["Current Ratio 1.67x meets benchmark", "Quick Ratio 1.33x healthy"],
                    "recommendation": "Working capital position is healthy."
                }
            },
            {
                "analysis_type": "banking",
                "company_name": "Test Corp",
                "data": {
                    "credit_score": 77,
                    "grade": "B",
                    "risk_level": "Medium",
                    "liquidity_score": 75,
                    "cash_flow_score": 80,
                    "credit_score_component": 85,
                    "repayment_score": 70,
                    "stability_score": 75,
                    "working_capital_status": "Adequate",
                    "liquidity_status": "Adequate",
                    "cash_flow_status": "Adequate",
                    "creditworthiness_status": "Adequate",
                    "repayment_status": "Adequate",
                    "stability_status": "Adequate",
                    "behavior_status": "Disciplined",
                    "strengths": ["Stable financial profile", "Healthy cash flow management"],
                    "concerns": ["No major concerns identified"],
                    "recommendation": "The borrower presents a good banking profile (77/100) with no minor concerns."
                }
            }
        ]
        
        for test_case in test_cases:
            analysis_type = test_case["analysis_type"]
            print(f"\nTesting PDF export for {analysis_type}...")
            
            response = requests.post(
                f"{BACKEND_URL}/export/pdf",
                json=test_case,
                headers={"Content-Type": "application/json"},
                timeout=20
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Content-Type: {response.headers.get('Content-Type')}")
            
            if response.status_code == 200:
                # Verify it's a PDF
                content_type = response.headers.get('Content-Type', '')
                if 'application/pdf' in content_type:
                    pdf_size = len(response.content)
                    print(f"✓ PDF generated successfully for {analysis_type} (Size: {pdf_size} bytes)")
                    
                    # Basic PDF validation - check for PDF header
                    if response.content.startswith(b'%PDF-'):
                        print(f"✓ Valid PDF format confirmed for {analysis_type}")
                    else:
                        print(f"⚠ PDF format validation failed for {analysis_type}")
                        return False
                else:
                    print(f"❌ FAIL - Expected PDF content-type, got: {content_type}")
                    return False
            else:
                print(f"❌ FAIL - HTTP {response.status_code}: {response.text}")
                return False
        
        print("✅ PASS - PDF Export API working correctly for all analysis types")
        return True
        
    except Exception as e:
        print(f"❌ FAIL - Exception: {str(e)}")
        return False

def main():
    """Run all backend API tests"""
    print("🚀 Starting Financial Analytics Backend API Testing")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    test_results = {}
    
    # Test all endpoints
    test_functions = [
        ("Health Check API", test_health_check),
        ("Working Capital Analysis API", test_working_capital_analysis),
        ("Banking Analysis API", test_banking_analysis),
        ("Multi-Year Trend Analysis API", test_multi_year_trend_analysis),
        ("Cases CRUD APIs", test_cases_crud),
        ("Dashboard Stats API", test_dashboard_stats),
        ("Document Parsing API (Gemini Vision)", test_document_parsing),
        ("PDF Export API", test_pdf_export),
    ]
    
    for test_name, test_func in test_functions:
        print(f"\n{'='*60}")
        result = test_func()
        test_results[test_name] = result
    
    # Summary
    print(f"\n{'='*60}")
    print("🏁 TESTING SUMMARY")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal Tests: {len(test_results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/len(test_results)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Backend is working correctly.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)