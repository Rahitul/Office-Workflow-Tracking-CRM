const axios = require('axios');

let cookies = '';

async function test() {
  console.log('=== TESTING iomdaily Full Features ===\n');

  // Generate unique email
  const uniqueEmail = 'user' + Date.now() + '@test.com';

  // Test 1: Register
  try {
    const r = await axios.post('http://localhost:4001/api/auth/register', {
      name: 'New User',
      email: uniqueEmail,
      password: 'password123'
    });
    console.log('✅ 1. Register:', r.status === 201 ? 'SUCCESS' : 'FAILED');
  } catch (e) { console.log('❌ 1. Register:', e.response?.data || e.message); }

  // Test 2: Login
  try {
    const r = await axios.post('http://localhost:4001/api/auth/login', {
      email: uniqueEmail,
      password: 'password123'
    }, { withCredentials: true });
    
    // Get cookies from response
    cookies = r.headers['set-cookie'];
    console.log('✅ 2. Login:', r.status === 200 ? 'SUCCESS' : 'FAILED');
  } catch (e) { console.log('❌ 2. Login:', e.response?.data || e.message); }

  // Test 3: Get Current User (Me)
  try {
    const r = await axios.get('http://localhost:4001/api/auth/me', {
      withCredentials: true,
      headers: cookies ? { Cookie: cookies } : {}
    });
    console.log('✅ 3. Get Me:', r.status === 200 ? 'SUCCESS - ' + r.data.user?.name : 'FAILED');
  } catch (e) { console.log('❌ 3. Get Me:', e.response?.data || e.message); }

  // Test 4: Create Form (Admin only)
  try {
    const r = await axios.post('http://localhost:4001/api/forms', {
      title: 'Test Form',
      description: 'Test Description'
    }, { withCredentials: true, headers: cookies ? { Cookie: cookies } : {} });
    console.log('✅ 4. Create Form:', r.status === 201 ? 'SUCCESS' : 'FAILED');
  } catch (e) { console.log('❌ 4. Create Form:', e.response?.data || e.message); }

  // Test 5: Get Forms
  try {
    const r = await axios.get('http://localhost:4001/api/forms', {
      withCredentials: true,
      headers: cookies ? { Cookie: cookies } : {}
    });
    console.log('✅ 5. Get Forms:', r.status === 200 ? 'SUCCESS - ' + r.data.forms?.length + ' forms' : 'FAILED');
  } catch (e) { console.log('❌ 5. Get Forms:', e.response?.data || e.message); }

  // Test 6: Get KPI Targets
  try {
    const r = await axios.get('http://localhost:4001/api/kpi-targets', {
      withCredentials: true,
      headers: cookies ? { Cookie: cookies } : {}
    });
    console.log('✅ 6. Get KPI Targets:', r.status === 200 ? 'SUCCESS' : 'FAILED');
  } catch (e) { console.log('❌ 6. Get KPI Targets:', e.response?.data || e.message); }

  // Test 7: Get Responses
  try {
    const r = await axios.get('http://localhost:4001/api/responses', {
      withCredentials: true,
      headers: cookies ? { Cookie: cookies } : {}
    });
    console.log('✅ 7. Get Responses:', r.status === 200 ? 'SUCCESS' : 'FAILED');
  } catch (e) { console.log('❌ 7. Get Responses:', e.response?.data || e.message); }

  // Test 8: Logout
  try {
    const r = await axios.post('http://localhost:4001/api/auth/logout', {}, { withCredentials: true });
    console.log('✅ 8. Logout:', r.status === 200 ? 'SUCCESS' : 'FAILED');
  } catch (e) { console.log('❌ 8. Logout:', e.response?.data || e.message); }

  // Test 9: Protected route after logout (should fail)
  try {
    const r = await axios.get('http://localhost:4001/api/auth/me', {
      withCredentials: true
    });
    console.log('❌ 9. After Logout: Should have failed but got', r.status);
  } catch (e) {
    console.log('✅ 9. After Logout:', e.response?.status === 401 ? 'Correctly blocked' : 'Error');
  }

  console.log('\n=== ALL TESTS COMPLETE ===');
}

test();