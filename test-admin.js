const axios = require('axios');

async function test() {
  console.log('=== TESTING Admin Features ===\n');

  // Test with admin role - create admin user directly in DB or use fixed credentials
  // Let's register a user and then manually check if we can access admin routes

  const adminEmail = 'admin' + Date.now() + '@test.com';

  // Register admin user
  try {
    await axios.post('http://localhost:4001/api/auth/register', {
      name: 'Admin User',
      email: adminEmail,
      password: 'admin123'
    });
    console.log('✅ Admin user registered');
  } catch (e) { console.log('Register:', e.response?.data || e.message); }

  // Login
  let cookies = '';
  try {
    const r = await axios.post('http://localhost:4001/api/auth/login', {
      email: adminEmail,
      password: 'admin123'
    }, { withCredentials: true });
    cookies = r.headers['set-cookie'];
    console.log('✅ Admin logged in');
  } catch (e) { console.log('Login:', e.response?.data || e.message); }

  // Test Admin Dashboard access
  try {
    const r = await axios.get('http://localhost:4001/admin/dashboard', {
      headers: cookies ? { Cookie: cookies } : {}
    });
    console.log('✅ Admin Dashboard Page:', r.status === 200 ? 'OK' : 'Failed');
  } catch (e) { console.log('Admin Dashboard:', e.response?.status || e.message); }

  // Test Admin Forms Page
  try {
    const r = await axios.get('http://localhost:4001/admin/forms', {
      headers: cookies ? { Cookie: cookies } : {}
    });
    console.log('✅ Admin Forms Page:', r.status === 200 ? 'OK' : 'Failed');
  } catch (e) { console.log('Admin Forms:', e.response?.status || e.message); }

  // Test Admin Users Page
  try {
    const r = await axios.get('http://localhost:4001/admin/users', {
      headers: cookies ? { Cookie: cookies } : {}
    });
    console.log('✅ Admin Users Page:', r.status === 200 ? 'OK' : 'Failed');
  } catch (e) { console.log('Admin Users:', e.response?.status || e.message); }

  // Test Admin KPI Page
  try {
    const r = await axios.get('http://localhost:4001/admin/kpi', {
      headers: cookies ? { Cookie: cookies } : {}
    });
    console.log('✅ Admin KPI Page:', r.status === 200 ? 'OK' : 'Failed');
  } catch (e) { console.log('Admin KPI:', e.response?.status || e.message); }

  // Test User Dashboard Page
  try {
    const r = await axios.get('http://localhost:4001/user/dashboard', {
      headers: cookies ? { Cookie: cookies } : {}
    });
    console.log('✅ User Dashboard Page:', r.status === 200 ? 'OK' : 'Failed');
  } catch (e) { console.log('User Dashboard:', e.response?.status || e.message); }

  console.log('\n=== Admin Tests Complete ===');
}

test();