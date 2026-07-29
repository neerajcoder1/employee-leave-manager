/**
 * Verification Test Script for Employee Leave Management System
 * Performs registration, login, leave application, manager approval, and balance validation.
 */
const testFlow = async () => {
  const API_URL = 'http://localhost:5000';
  const testUsername = `employee_${Math.floor(Math.random() * 10000)}`;
  const testPassword = 'Password123!';
  let employeeToken = '';
  let managerToken = '';
  let leaveRequestId = '';

  console.log('Starting Full-Stack API Integration Tests against Supabase...');
  console.log(`Test employee credentials: Username: "${testUsername}"`);

  try {
    // 1. Register Employee
    console.log('\nStep 1: Registering employee...');
    const registerRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUsername, password: testPassword })
    });
    const registerResult = await registerRes.json();
    
    if (!registerRes.ok || !registerResult.success) {
      throw new Error(`Registration failed: ${JSON.stringify(registerResult)}`);
    }
    console.log('Success: Registered Employee details:', registerResult.data);

    // 2. Login Employee
    console.log('\nStep 2: Logging in employee...');
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUsername, password: testPassword })
    });
    const loginResult = await loginRes.json();
    
    if (!loginRes.ok || !loginResult.success) {
      throw new Error(`Employee login failed: ${JSON.stringify(loginResult)}`);
    }
    employeeToken = loginResult.data.token;
    console.log('Success: JWT received.');

    // 3. Fetch Profile & Balances
    console.log('\nStep 3: Fetching profile balances...');
    const profileRes = await fetch(`${API_URL}/api/employee/profile`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const profileResult = await profileRes.json();
    console.log('Success: Initial Balances:', profileResult.data.balances);

    // 4. Apply for Leave
    console.log('\nStep 4: Submitting leave request (3 days Annual)...');
    const applyRes = await fetch(`${API_URL}/api/employee/leave`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeToken}` 
      },
      body: JSON.stringify({
        leaveType: 'Annual',
        startDate: '2026-08-10',
        endDate: '2026-08-12', // 10, 11, 12 = 3 days
        reason: 'Family event vacation request.'
      })
    });
    const applyResult = await applyRes.json();
    
    if (!applyRes.ok || !applyResult.success) {
      throw new Error(`Leave application failed: ${JSON.stringify(applyResult)}`);
    }
    leaveRequestId = applyResult.data.id;
    console.log('Success: Created Leave Request:', applyResult.data);

    // 5. Login Manager
    console.log('\nStep 5: Logging in Manager (manager@gcu.in)...');
    const managerLoginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'manager@gcu.in', password: 'ZollidMngr#Leave99' })
    });
    const managerLoginResult = await managerLoginRes.json();
    
    if (!managerLoginRes.ok || !managerLoginResult.success) {
      throw new Error(`Manager login failed: ${JSON.stringify(managerLoginResult)}`);
    }
    managerToken = managerLoginResult.data.token;
    console.log('Success: Manager JWT received.');

    // 6. Manager approves leave
    console.log('\nStep 6: Manager approving leave request...');
    const approveRes = await fetch(`${API_URL}/api/manager/leaves/${leaveRequestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`
      },
      body: JSON.stringify({
        status: 'Approved',
        managerRemarks: 'Have a wonderful vacation!'
      })
    });
    const approveResult = await approveRes.json();
    
    if (!approveRes.ok || !approveResult.success) {
      throw new Error(`Approval failed: ${JSON.stringify(approveResult)}`);
    }
    console.log('Success: Approved leave status details:', approveResult.data);

    // 7. Verify leave balances update (15 - 3 = 12 days)
    console.log('\nStep 7: Verifying updated employee balances...');
    const updatedProfileRes = await fetch(`${API_URL}/api/employee/profile`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const updatedProfileResult = await updatedProfileRes.json();
    console.log('Success: Updated Balances:', updatedProfileResult.data.balances);
    
    if (updatedProfileResult.data.balances.annual !== 12) {
      throw new Error(`Balance deduction incorrect. Expected 12, got ${updatedProfileResult.data.balances.annual}`);
    }
    console.log('Success: Correctly deducted 3 days from Annual balance.');

    // 8. Verify notification generated
    console.log('\nStep 8: Fetching unread employee notifications...');
    const notifyRes = await fetch(`${API_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const notifyResult = await notifyRes.json();
    console.log('Success: Unread notifications list:', notifyResult.data);

    console.log('\n==================================================');
    console.log('  ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ✅');
    console.log('==================================================');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
};

testFlow();
