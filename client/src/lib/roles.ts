const ADMIN_ROLES = ['financial_manager', 'admin', 'CFO'];
const ALL_STAFF = [...ADMIN_ROLES, 'operations_staff'];
const EXEC_ROLES = [...ADMIN_ROLES, 'deposit_withdrawal_staff'];

export const canCreateRequest = (role: string) => ALL_STAFF.includes(role);
export const canConfirmRequest = (role: string) => ADMIN_ROLES.includes(role);
export const canExecuteRequest = (role: string) => EXEC_ROLES.includes(role);
export const canCreateVoucher  = (role: string) => ADMIN_ROLES.includes(role);
export const isDepositWithdrawStaff = (role: string) => role === 'deposit_withdrawal_staff';
export const isAccountant = (role: string) => role === 'accountant' || ADMIN_ROLES.includes(role);
