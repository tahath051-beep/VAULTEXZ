// Static pre-encoded JWT — never use btoa() at module scope (fails during Vite SSR transform)
// Payload: {"sub":"user-001","email":"admin@demo.com","tenantId":"tenant-001","roleId":"role-cfo","roleName":"CFO","exp":9999999999}
export const MOCK_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9' +
  '.eyJzdWIiOiJ1c2VyLTAwMSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJ0ZW5hbnRJZCI6InRlbmFudC0wMDEiLCJyb2xlSWQiOiJyb2xlLWNmbyIsInJvbGVOYW1lIjoiQ0ZPIiwiZXhwIjo5OTk5OTk5OTk5fQ' +
  '.mock-signature';

export const MOCK_USER = {
  id: 'user-001',
  email: 'admin@demo.com',
  full_name: 'Demo Admin',
  role: 'CFO',
};

export const mockAuthData = {
  validEmail: 'admin@demo.com',
  validPassword: 'Demo@123456',
};
