const ADMIN_ROLES = ['financial_manager', 'admin', 'CFO'];
const ALL_STAFF = [...ADMIN_ROLES, 'operations_staff'];
const EXEC_ROLES = [...ADMIN_ROLES, 'deposit_withdrawal_staff'];

export const canCreateRequest = (role: string) => ALL_STAFF.includes(role);
export const canConfirmRequest = (role: string) => ADMIN_ROLES.includes(role);
export const canExecuteRequest = (role: string) => EXEC_ROLES.includes(role);
export const canCreateVoucher  = (role: string) => ADMIN_ROLES.includes(role);
export const isDepositWithdrawStaff = (role: string) => role === 'deposit_withdrawal_staff';
export const isAccountant = (role: string) => role === 'accountant' || ADMIN_ROLES.includes(role);

// ── Operations Module (4-stage workflow) ────────────────────────────────────
const REQUESTS_ROLES     = [...ADMIN_ROLES, 'requests_officer'];
const VERIFICATION_ROLES = [...ADMIN_ROLES, 'verification_officer'];
const EXECUTION_ROLES    = [...ADMIN_ROLES, 'mt5_officer'];
const COMPLETED_ROLES    = [...ADMIN_ROLES, 'requests_officer', 'verification_officer', 'mt5_officer', 'accountant'];

export const canAccessRequests     = (role: string) => REQUESTS_ROLES.includes(role);
export const canAccessVerification = (role: string) => VERIFICATION_ROLES.includes(role);
export const canAccessExecution    = (role: string) => EXECUTION_ROLES.includes(role);
export const canAccessCompleted    = (role: string) => COMPLETED_ROLES.includes(role);
export const canManageOpSettings   = (role: string) => ADMIN_ROLES.includes(role);
export const canSeeTrash           = (role: string) => ADMIN_ROLES.includes(role);
