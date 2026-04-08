const axios = require('axios');

async function test() {
  console.log('=== TESTING iomdaily API ===\n');

  // Test 1: Landing Page
  try {
    const r1 = await axios.get('http://localhost:4001');
    console.log('1. Landing Page:', r1.status === 200 ? '✅ OK' : '❌ Failed');
  } catch (e) { console.log('1. Landing Page: ❌', e.message); }

  // Test 2: Login Page
  try {
    const r2 = await axios.get('http://localhost:4001/login');
    console.log('2. Login Page:', r2.status === 200 ? '✅ OK' : '❌ Failed');
  } catch (e) { console.log('2. Login Page: ❌', e.message); }

  // Test 3: Register Page
  try {
    const r3 = await axios.get('http://localhost:4001/register');
    console.log('3. Register Page:', r3.status === 200 ? '✅ OK' : '❌ Failed');
  } catch (e) { console.log('3. Register Page: ❌', e.message); }

  // Test 4: Register API
  try {
    const r4 = await axios.post('http://localhost:4001/api/auth/register', {
      name: 'Test User',
      email: 'testuser' + Date.now() + '@test.com',
      password: 'test123456'
    });
    console.log('4. Register API:', r4.status === 201 ? '✅ OK' : '❌ Failed', r4.data);
  } catch (e) { console.log('4. Register API: ❌', e.response?.data || e.message); }

  // Test 5: Login API
  try {
    const r5 = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });
    console.log('5. Login API:', r5.status === 200 ? '✅ OK' : '❌ Failed');
  } catch (e) { console.log('5. Login API: ❌', e.response?.data || e.message); }

  // Test 6: Forms API
  try {
    const r6 = await axios.get('http://localhost:4001/api/forms');
    console.log('6. Forms API (no auth):', r6.status === 401 ? '✅ OK (401 as expected)' : '❌ Unexpected');
  } catch (e) { console.log('6. Forms API:', e.response?.status === 401 ? '✅ OK (401)' : '❌', e.response?.data || e.message); }

  console.log('\n=== TESTS COMPLETE ===');
}

test();