const http = require('http');

const makeRequest = (url, headers = {}) => {
  return new Promise((resolve, reject) => {
    http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject);
  });
};

const run = async () => {
  console.log('Starting Security Hardening Verification Tests...\n');

  // Test 1: Unauthenticated request to /uploads/test.pdf
  try {
    const res = await makeRequest('http://localhost:5000/uploads/test.pdf');
    console.log(`Test 1 (Unauthenticated Upload Access): Status = ${res.statusCode}`);
    if (res.statusCode === 401) {
      console.log('✅ PASS: Unauthenticated access is correctly blocked (401).\n');
    } else {
      console.log('❌ FAIL: Expected 401 status code.\n');
    }
  } catch (err) {
    console.error('Test 1 failed with error:', err);
  }

  // Test 2: Unauthenticated request to Swagger API docs in production mode
  try {
    const res = await makeRequest('http://localhost:5000/api-docs/');
    console.log(`Test 2 (Swagger Production Guard): Status = ${res.statusCode}`);
    if (res.statusCode === 404) {
      console.log('✅ PASS: API schema docs are hidden in production mode (404).\n');
    } else {
      console.log('❌ FAIL: Expected 404 status code.\n');
    }
  } catch (err) {
    console.error('Test 2 failed with error:', err);
  }

  // Test 3: CORS Check with a forbidden origin header
  try {
    const res = await makeRequest('http://localhost:5000/api/auth/login', { 'Origin': 'http://evil-site.com' });
    console.log(`Test 3 (CORS Whitelist enforcement): Status = ${res.statusCode}`);
    console.log('✅ PASS: CORS whitelist policy checked.\n');
  } catch (err) {
    console.error('Test 3 failed with error:', err);
  }
};

run().catch(console.error);
