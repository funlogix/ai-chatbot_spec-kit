// Test script to verify the backend API endpoints are working correctly

// Test configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || 'your-admin-access-key';

// Test functions
async function testHealthEndpoint() {
  console.log('Testing health endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✓ Health check:', data);
    return true;
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
    return false;
  }
}

async function testAvailableProviders() {
  console.log('Testing available providers endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/providers/available`);
    const data = await response.json();
    console.log('✓ Available providers:', data.providers.map(p => p.name));
    return true;
  } catch (error) {
    console.error('✗ Available providers test failed:', error.message);
    return false;
  }
}

async function testProviderStatus() {
  console.log('Testing provider status endpoints...');
  try {
    const providers = ['openai', 'groq', 'gemini', 'openrouter'];
    for (const providerId of providers) {
      const response = await fetch(`${BASE_URL}/api/providers/${providerId}/status`);
      const data = await response.json();
      console.log(`✓ ${providerId} status:`, data.status);
    }
    return true;
  } catch (error) {
    console.error('✗ Provider status test failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('Starting backend API tests...\n');

  const tests = [
    await testHealthEndpoint(),
    await testAvailableProviders(),
    await testProviderStatus()
  ];

  const passed = tests.filter(t => t).length;
  const total = tests.length;

  console.log(`\nTests completed: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('✓ All tests passed!');
  } else {
    console.log('✗ Some tests failed');
  }
}

// Run the tests
runTests().catch(console.error);