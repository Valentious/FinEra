/**
 * FinEra Registration Flow Test
 * Run: npx tsx scripts/test-registration-flow.ts
 * Requires: PostgreSQL + all services running (auth, user, ledger, credit, admin)
 *
 * By default tests via API Gateway (TEST_VIA_GATEWAY !== '0').
 * Set TEST_VIA_GATEWAY=0 to hit services directly.
 */

import axios from 'axios';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5000';
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const USER_URL = process.env.USER_SERVICE_URL || 'http://localhost:4002';
const LEDGER_URL = process.env.LEDGER_SERVICE_URL || 'http://localhost:4004';
const CREDIT_URL = process.env.CREDIT_ENGINE_URL || 'http://localhost:4003';
const ADMIN_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:4006';

async function testRegistrationFlow() {
  const useGateway = process.env.TEST_VIA_GATEWAY !== '0';
  const baseUrl = useGateway ? GATEWAY_URL : AUTH_URL;
  const profileUrl = useGateway ? GATEWAY_URL : USER_URL;
  const ledgerUrl = useGateway ? GATEWAY_URL : LEDGER_URL;
  const creditUrl = useGateway ? GATEWAY_URL : CREDIT_URL;
  // Admin routes require ADMIN+ via gateway; use direct service for audit verification
  const adminUrl = ADMIN_URL;

  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test@123456',
    firstName: 'Test',
    lastName: 'User',
    userType: 'STUDENT',
    phoneNumber: '+1234567890',
  };

  console.log('🚀 Testing registration flow...');
  console.log('Mode:', useGateway ? 'via Gateway' : 'direct services');
  console.log('Test user:', testUser.email);

  try {
    const registerRes = await axios.post(`${baseUrl}/api/v1/auth/register`, testUser);
    const { data } = registerRes.data;

    if (!data?.userId) {
      throw new Error('No userId in response');
    }

    const { userId, services, token } = data;
    console.log('\n✅ Registration response:', JSON.stringify(data, null, 2));

    const authHeaders = useGateway && token ? { Authorization: `Bearer ${token}` } : {};

    const profileRes = await axios.get(`${profileUrl}/api/v1/users/profile/${userId}`, {
      headers: authHeaders,
    });
    console.log('\n✅ User profile created:', profileRes.data.success);

    const walletRes = await axios.get(`${ledgerUrl}/api/v1/ledger/wallets/${userId}`, {
      headers: authHeaders,
    });
    console.log('✅ Wallet created:', walletRes.data.success);
    console.log('   Wallet ID:', walletRes.data.data?.id);
    console.log('   Balance:', walletRes.data.data?.balance);

    const creditRes = await axios.get(`${creditUrl}/api/v1/credit/score/${userId}`, {
      headers: authHeaders,
    });
    console.log('\n✅ Credit score initialized:', creditRes.data.success);
    console.log('   Score:', creditRes.data.data?.overallScore);
    console.log('   Risk Level:', creditRes.data.data?.riskLevel);

    const auditRes = await axios.get(`${adminUrl}/api/v1/admin/audit/${userId}`);
    console.log('\n✅ Audit logs created:', auditRes.data.success);
    console.log('   Log entries:', auditRes.data.data?.length ?? 0);

    console.log('\n📊 Service Health Status:');
    console.log('   User Service:', (services as any)?.user?.success ? '✅' : '❌');
    console.log('   Ledger Service:', (services as any)?.wallet?.success ? '✅' : '❌');
    console.log('   Credit Engine:', (services as any)?.credit?.success ? '✅' : '❌');
    console.log('   Admin Service:', (services as any)?.admin?.success ? '✅' : '❌');

    console.log('\n✨ Registration flow completed successfully!');
  } catch (err: unknown) {
    const e = err as {
      response?: { status?: number; statusText?: string; data?: unknown };
      message?: string;
      code?: string;
    };
    const details = e.response?.data ?? e.message ?? e.code ?? String(err);
    console.error('\n❌ Registration flow failed:', details);
    if (e.response) {
      console.error('   Status:', e.response.status, e.response.statusText);
    }
    if (e.code) console.error('   Code:', e.code);
    process.exit(1);
  }
}

testRegistrationFlow();
