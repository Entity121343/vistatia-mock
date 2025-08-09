import requests
import sys
import json
from datetime import datetime

class MUNAssistantAPITester:
    def __init__(self, base_url="https://e74af624-636c-4da5-9af8-2d7897fff58e.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = f"test_user_{datetime.now().strftime('%H%M%S')}"

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection error")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test creating a status check
        success, response = self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data={"client_name": "test_client"}
        )
        
        if not success:
            return False
            
        # Test getting status checks
        success, _ = self.run_test(
            "Get Status Checks",
            "GET", 
            "status",
            200
        )
        
        return success

    def test_generate_endpoint(self):
        """Test the main generate endpoint with different MUN tasks"""
        mun_tasks = [
            "research",
            "amendments", 
            "situation assessment",
            "directive",
            "draft resolution",
            "background guide",
            "poi/poo/r2r",
            "post assessment",
            "probable outcomes",
            "rebuttal",
            "speech",
            "strategy"
        ]
        
        all_passed = True
        
        for task in mun_tasks:
            success, response = self.run_test(
                f"Generate Response - {task}",
                "POST",
                "generate",
                200,
                data={
                    "userId": self.test_user_id,
                    "task": task,
                    "prompt": f"Test prompt for {task} task"
                }
            )
            
            if success and isinstance(response, dict):
                # Verify response structure
                required_fields = ["id", "userId", "task", "prompt", "response", "timestamp"]
                for field in required_fields:
                    if field not in response:
                        print(f"❌ Missing field '{field}' in response")
                        all_passed = False
                        break
                
                # Verify task-specific response content
                if "response" in response and len(response["response"]) < 10:
                    print(f"❌ Response too short for {task}")
                    all_passed = False
            else:
                all_passed = False
                
        return all_passed

    def test_chat_session_endpoints(self):
        """Test chat session management endpoints"""
        test_task = "research"
        
        # Test creating a chat session
        success, session_response = self.run_test(
            "Create Chat Session",
            "POST",
            f"chat/sessions?userId={self.test_user_id}&task={test_task}&title=Test Chat",
            200
        )
        
        if not success or not isinstance(session_response, dict):
            return False
            
        session_id = session_response.get("id")
        if not session_id:
            print("❌ No session ID returned")
            return False
            
        # Test getting chat sessions for user/task
        success, sessions_list = self.run_test(
            "Get Chat Sessions",
            "GET",
            f"chat/sessions/{self.test_user_id}/{test_task}",
            200
        )
        
        if not success:
            return False
            
        # Test getting specific chat session
        success, specific_session = self.run_test(
            "Get Specific Chat Session",
            "GET",
            f"chat/sessions/{session_id}",
            200
        )
        
        if not success:
            return False
            
        # Test adding message to session
        test_message = {
            "type": "user",
            "content": "Test message content",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        success, _ = self.run_test(
            "Add Message to Session",
            "POST",
            f"chat/sessions/{session_id}/messages",
            200,
            data=test_message
        )
        
        return success

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        # Test invalid generate request
        success, _ = self.run_test(
            "Invalid Generate Request",
            "POST",
            "generate",
            422,  # Validation error
            data={"invalid": "data"}
        )
        
        # Test non-existent session
        success2, _ = self.run_test(
            "Non-existent Session",
            "GET",
            "chat/sessions/non-existent-id",
            404
        )
        
        return success and success2

def main():
    print("🚀 Starting MUN Assistant API Tests")
    print("=" * 50)
    
    tester = MUNAssistantAPITester()
    
    # Run all tests
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Status Endpoints", tester.test_status_endpoints),
        ("Generate Endpoint", tester.test_generate_endpoint),
        ("Chat Session Endpoints", tester.test_chat_session_endpoints),
        ("Error Handling", tester.test_error_handling)
    ]
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} Tests...")
        try:
            result = test_func()
            if result:
                print(f"✅ {test_name} tests passed")
            else:
                print(f"❌ {test_name} tests failed")
        except Exception as e:
            print(f"❌ {test_name} tests failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())