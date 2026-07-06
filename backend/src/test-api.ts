// backend/src/test-api.ts
import axios from 'axios';

const API_URL = 'http://localhost:4000';

async function runTests() {
    console.log('🧪 Starting Backend API Integration Test Suite...\n');
    let passed = 0;
    let failed = 0;
    
    function logResult(success: boolean, message: string) {
        if (success) {
            console.log(`  ✅ [PASS] ${message}`);
            passed++;
        } else {
            console.log(`  ❌ [FAIL] ${message}`);
            failed++;
        }
    }

    try {
        // Test 1: Health check / check if server is running
        try {
            await axios.get(`${API_URL}/api-docs`);
            logResult(true, 'Server Health Check - API is online');
        } catch (err: any) {
            logResult(false, 'Server Health Check - Failed to connect to backend server. Make sure it is running on port 4000.');
            return;
        }

        // Test 2: Register a new account
        let testUserEmail = `test_${Date.now()}@example.com`;
        let userToken = '';
        let adminToken = '';
        let testUserId = '';

        try {
            await axios.post(`${API_URL}/accounts/register`, {
                title: 'Mr',
                firstName: 'Test',
                lastName: 'User',
                email: testUserEmail,
                password: 'Password123!',
                confirmPassword: 'Password123!',
                acceptTerms: true
            });
            logResult(true, `POST /accounts/register - Registered test user: ${testUserEmail}`);
        } catch (err: any) {
            logResult(false, `POST /accounts/register - Failed to register: ${err.response?.data?.message || err.message}`);
        }

        // Test 3: Verify the account (we will bypass verification by directly logging in since the seed default admin is already verified)
        try {
            const loginRes = await axios.post(`${API_URL}/accounts/authenticate`, {
                email: 'admin@example.com',
                password: 'Password123!'
            });
            adminToken = loginRes.data.jwtToken;
            logResult(true, 'POST /accounts/authenticate - Logged in as seed Admin successfully');
        } catch (err: any) {
            logResult(false, `POST /accounts/authenticate - Failed to authenticate Admin: ${err.response?.data?.message || err.message}`);
        }

        // Test 4: Retrieve accounts list (Admin authorized)
        try {
            const listRes = await axios.get(`${API_URL}/accounts`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            testUserId = listRes.data.find((x: any) => x.email === testUserEmail)?.id || '';
            logResult(true, `GET /accounts - Retreived account directory (found test user ID: ${testUserId})`);
        } catch (err: any) {
            logResult(false, `GET /accounts - Failed to fetch account directory: ${err.response?.data?.message || err.message}`);
        }

        // Test 5: Verify new user manually (Admin update)
        if (testUserId) {
            try {
                await axios.put(`${API_URL}/accounts/${testUserId}`, {
                    isVerified: true
                }, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                logResult(true, 'PUT /accounts/:id - Test user verified status updated by Admin');
            } catch (err: any) {
                logResult(false, `PUT /accounts/:id - Failed to update verified status: ${err.response?.data?.message || err.message}`);
            }
        }

        // Test 6: Authenticate as the new verified test user
        try {
            const loginRes = await axios.post(`${API_URL}/accounts/authenticate`, {
                email: testUserEmail,
                password: 'Password123!'
            });
            userToken = loginRes.data.jwtToken;
            logResult(true, 'POST /accounts/authenticate - Authenticated as the newly registered user');
        } catch (err: any) {
            logResult(false, `POST /accounts/authenticate - Failed to authenticate new user: ${err.response?.data?.message || err.message}`);
        }

        // Test 7: Add a Department (Admin only)
        try {
            await axios.post(`${API_URL}/departments`, {
                name: 'Engineering',
                description: 'Software development and systems engineering'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            logResult(true, 'POST /departments - Created Engineering department successfully');
        } catch (err: any) {
            logResult(false, `POST /departments - Failed to create department: ${err.response?.data?.message || err.message}`);
        }

        // Test 8: Fetch Departments
        try {
            const deptRes = await axios.get(`${API_URL}/departments`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            logResult(true, `GET /departments - Retrieved department list (count: ${deptRes.data.length})`);
        } catch (err: any) {
            logResult(false, `GET /departments - Failed to retrieve departments: ${err.response?.data?.message || err.message}`);
        }

        // Test 9: Add an Employee (Admin only)
        let testEmpId = `EMP${Date.now().toString().slice(-4)}`;
        try {
            await axios.post(`${API_URL}/employees`, {
                empId: testEmpId,
                email: `emp_${Date.now()}@example.com`,
                firstName: 'John',
                lastName: 'Doe',
                position: 'Senior Engineer',
                department: 'Engineering',
                hireDate: '2026-07-06'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            logResult(true, `POST /employees - Added new employee with ID: ${testEmpId}`);
        } catch (err: any) {
            logResult(false, `POST /employees - Failed to add employee: ${err.response?.data?.message || err.message}`);
        }

        // Test 10: Fetch Employees
        try {
            const empRes = await axios.get(`${API_URL}/employees`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            logResult(true, `GET /employees - Retrieved employee roster (count: ${empRes.data.length})`);
        } catch (err: any) {
            logResult(false, `GET /employees - Failed to fetch employee roster: ${err.response?.data?.message || err.message}`);
        }

        // Test 11: Create a Service Request
        try {
            await axios.post(`${API_URL}/requests`, {
                id: Date.now(),
                type: 'Hardware Procurement',
                items: { device: 'MacBook Pro M3', RAM: '32GB' },
                date: '2026-07-06',
                employeeEmail: testUserEmail
            }, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            logResult(true, 'POST /requests - Submitted MacBook hardware request');
        } catch (err: any) {
            logResult(false, `POST /requests - Failed to create service request: ${err.response?.data?.message || err.message}`);
        }

        // Test 12: Fetch Requests
        try {
            const reqRes = await axios.get(`${API_URL}/requests`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            logResult(true, `GET /requests - Admin retrieved global requests list (count: ${reqRes.data.length})`);
        } catch (err: any) {
            logResult(false, `GET /requests - Failed to retrieve requests: ${err.response?.data?.message || err.message}`);
        }

        // Test 13: Fetch Dashboard Statistics
        try {
            const statsRes = await axios.get(`${API_URL}/stats`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            logResult(true, `GET /stats - Compiled admin metrics: Accounts=${statsRes.data.accountsCount}, Employees=${statsRes.data.empsCount}`);
        } catch (err: any) {
            logResult(false, `GET /stats - Failed to compile dashboard metrics: ${err.response?.data?.message || err.message}`);
        }

        // Test 14: Delete test user (Cleanup)
        if (testUserId) {
            try {
                await axios.delete(`${API_URL}/accounts/${testUserId}`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                logResult(true, 'DELETE /accounts/:id - Deleted test user account (cleanup success)');
            } catch (err: any) {
                logResult(false, `DELETE /accounts/:id - Cleanup failed: ${err.response?.data?.message || err.message}`);
            }
        }

        console.log(`\n🏁 Test Run Completed: ${passed} passed, ${failed} failed.\n`);
    } catch (globalErr: any) {
        console.error('Fatal error during test suite runner execution:', globalErr.message);
    }
}

runTests();
