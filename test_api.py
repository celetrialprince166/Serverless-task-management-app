#!/usr/bin/env python3
"""
API Integration Test Script
Tests all deployed endpoints for the Task Management System
"""
import json
import urllib.request
import urllib.error
import sys

# Configuration
BASE_URL = "https://a9206bd8od.execute-api.eu-west-1.amazonaws.com/dev/api/v1"

def load_token():
    """Load authentication token from file"""
    try:
        with open("/tmp/auth.json") as f:
            auth = json.load(f)
        return auth["AuthenticationResult"]["IdToken"]
    except FileNotFoundError:
        print("ERROR: /tmp/auth.json not found. Run authentication first:")
        print("  aws cognito-idp initiate-auth \\")
        print("    --client-id 7hcomukkp5j7i36elpggbnld94 \\")
        print("    --auth-flow USER_PASSWORD_AUTH \\")
        print("    --auth-parameters USERNAME=testadmin@amalitech.com,PASSWORD=TestAdmin123! \\")
        print("    > /tmp/auth.json")
        sys.exit(1)

def api_request(method, endpoint, data=None, token=None):
    """Make an API request and return the response"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    
    if data:
        data = json.dumps(data).encode()
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except:
            body = {"error": str(e)}
        return e.code, body

def print_result(name, status, expected, body):
    """Print test result with pass/fail indicator"""
    passed = status == expected
    icon = "✅" if passed else "❌"
    print(f"\n{icon} {name}")
    print(f"   Status: {status} (expected {expected})")
    if not passed or status >= 400:
        print(f"   Response: {json.dumps(body, indent=2)[:200]}")
    return passed

def main():
    print("=" * 60)
    print("Task Management API - Integration Tests")
    print("=" * 60)
    
    # Load token
    token = load_token()
    print(f"\n📋 Token loaded (length: {len(token)})")
    
    results = []
    created_task_id = None
    
    # =========================================================================
    # HEALTH ENDPOINT
    # =========================================================================
    print("\n" + "-" * 40)
    print("HEALTH ENDPOINTS")
    print("-" * 40)
    
    # Test: Health check (public)
    status, body = api_request("GET", "/health", token=None)
    results.append(print_result("GET /health (public)", status, 200, body))
    
    # =========================================================================
    # TASKS ENDPOINTS
    # =========================================================================
    print("\n" + "-" * 40)
    print("TASKS ENDPOINTS")
    print("-" * 40)
    
    # Test: List tasks (empty initially)
    status, body = api_request("GET", "/tasks", token=token)
    results.append(print_result("GET /tasks (list)", status, 200, body))
    
    # Test: Create task
    task_data = {
        "title": "Integration Test Task",
        "description": "Created by test script",
        "priority": "MEDIUM",
        "dueDate": "2026-03-01"
    }
    status, body = api_request("POST", "/tasks", data=task_data, token=token)
    results.append(print_result("POST /tasks (create)", status, 201, body))
    
    if status == 201 and "data" in body:
        created_task_id = body["data"]["id"]
        print(f"   Created task ID: {created_task_id}")
    
    # Test: Get task by ID
    if created_task_id:
        status, body = api_request("GET", f"/tasks/{created_task_id}", token=token)
        results.append(print_result("GET /tasks/{id} (get)", status, 200, body))
    
    # Test: Update task
    if created_task_id:
        update_data = {
            "title": "Updated Test Task",
            "status": "IN_PROGRESS",
            "priority": "HIGH"
        }
        status, body = api_request("PUT", f"/tasks/{created_task_id}", data=update_data, token=token)
        results.append(print_result("PUT /tasks/{id} (update)", status, 200, body))
    
    # Test: Get task not found
    status, body = api_request("GET", "/tasks/nonexistent-id-12345", token=token)
    results.append(print_result("GET /tasks/{id} (not found)", status, 404, body))
    
    # Test: Create task without auth (should fail)
    status, body = api_request("POST", "/tasks", data=task_data, token=None)
    results.append(print_result("POST /tasks (no auth)", status, 401, body))
    
    # =========================================================================
    # USERS ENDPOINTS
    # =========================================================================
    print("\n" + "-" * 40)
    print("USERS ENDPOINTS")
    print("-" * 40)
    
    # Test: Get current user (me)
    status, body = api_request("GET", "/users/me", token=token)
    results.append(print_result("GET /users/me", status, 200, body))
    
    # Test: List users
    status, body = api_request("GET", "/users", token=token)
    results.append(print_result("GET /users (list)", status, 200, body))
    
    # Test: Get user by ID (use current user's ID)
    if status == 200 and "data" in body and len(body["data"]) > 0:
        user_id = body["data"][0].get("id") or body["data"][0].get("userId")
        if user_id:
            status, body = api_request("GET", f"/users/{user_id}", token=token)
            results.append(print_result("GET /users/{id}", status, 200, body))
    
    # Test: Get user not found
    status, body = api_request("GET", "/users/nonexistent-user-12345", token=token)
    results.append(print_result("GET /users/{id} (not found)", status, 404, body))
    
    # =========================================================================
    # CLEANUP - Delete the test task
    # =========================================================================
    print("\n" + "-" * 40)
    print("CLEANUP")
    print("-" * 40)
    
    if created_task_id:
        status, body = api_request("DELETE", f"/tasks/{created_task_id}", token=token)
        results.append(print_result("DELETE /tasks/{id}", status, 200, body))
        
        # Verify deletion
        status, body = api_request("GET", f"/tasks/{created_task_id}", token=token)
        results.append(print_result("GET /tasks/{id} (after delete)", status, 404, body))
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
