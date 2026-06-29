-- ================================================
-- MIGRATION: 009_human_resources
-- Employees, contracts, payroll, leave, performance
-- ================================================

CREATE TABLE employees (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id),
  -- link to login account if employee has system access
  employee_code     VARCHAR(50) NOT NULL,
  full_name         VARCHAR(255) NOT NULL,
  email             VARCHAR(255),
  phone             VARCHAR(50),
  national_id       VARCHAR(100),
  nationality       CHAR(2),
  date_of_birth     DATE,
  gender            CHAR(1),
  -- M / F
  marital_status    VARCHAR(20),
  branch_id         UUID REFERENCES branches(id),
  department_id     UUID REFERENCES departments(id),
  job_title         VARCHAR(255),
  employment_type   VARCHAR(30) DEFAULT 'FULL_TIME',
  -- FULL_TIME / PART_TIME / CONTRACT / INTERN
  hire_date         DATE NOT NULL,
  termination_date  DATE,
  status            VARCHAR(30) DEFAULT 'ACTIVE',
  -- ACTIVE / ON_LEAVE / TERMINATED / SUSPENDED
  manager_id        UUID REFERENCES employees(id),
  base_salary       DECIMAL(18,6),
  salary_currency   CHAR(3) DEFAULT 'USD',
  created_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, employee_code)
);

CREATE TABLE employee_contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  employee_id     UUID REFERENCES employees(id) ON DELETE CASCADE,
  contract_type   VARCHAR(50) NOT NULL,
  -- PERMANENT / FIXED_TERM / PROBATION
  start_date      DATE NOT NULL,
  end_date        DATE,
  base_salary     DECIMAL(18,6) NOT NULL,
  currency        CHAR(3) DEFAULT 'USD',
  document_id     UUID REFERENCES documents(id),
  status          VARCHAR(20) DEFAULT 'ACTIVE',
  -- ACTIVE / EXPIRED / TERMINATED
  signed_at       DATE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leave_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  days_per_year INTEGER DEFAULT 0,
  is_paid     BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leave_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  employee_id     UUID REFERENCES employees(id),
  leave_type_id   UUID REFERENCES leave_types(id),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  days            DECIMAL(5,1) NOT NULL,
  reason          TEXT,
  status          VARCHAR(30) DEFAULT 'PENDING',
  -- PENDING / APPROVED / REJECTED / CANCELLED
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMP,
  rejection_note  TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payroll_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  period_year     SMALLINT NOT NULL,
  period_month    SMALLINT NOT NULL,
  currency        CHAR(3) DEFAULT 'USD',
  total_gross     DECIMAL(18,6) DEFAULT 0,
  total_deductions DECIMAL(18,6) DEFAULT 0,
  total_net       DECIMAL(18,6) DEFAULT 0,
  status          VARCHAR(30) DEFAULT 'DRAFT',
  -- DRAFT / APPROVED / PAID / CANCELLED
  journal_id      UUID REFERENCES journal_entries(id),
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMP,
  paid_at         TIMESTAMP,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, period_year, period_month)
);

CREATE TABLE payroll_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  payroll_run_id  UUID REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id     UUID REFERENCES employees(id),
  base_salary     DECIMAL(18,6) NOT NULL,
  allowances      DECIMAL(18,6) DEFAULT 0,
  bonuses         DECIMAL(18,6) DEFAULT 0,
  deductions      DECIMAL(18,6) DEFAULT 0,
  tax             DECIMAL(18,6) DEFAULT 0,
  net_pay         DECIMAL(18,6) NOT NULL,
  currency        CHAR(3) DEFAULT 'USD',
  payment_method  VARCHAR(50),
  -- BANK_TRANSFER / CASH
  bank_account    VARCHAR(255),
  notes           TEXT
);

CREATE TABLE performance_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  employee_id     UUID REFERENCES employees(id),
  reviewer_id     UUID REFERENCES employees(id),
  review_period   VARCHAR(50),
  -- e.g. Q1-2025 / H1-2025 / ANNUAL-2025
  overall_score   DECIMAL(4,2),
  -- 1.00 to 5.00
  comments        TEXT,
  goals_next      TEXT,
  status          VARCHAR(20) DEFAULT 'DRAFT',
  -- DRAFT / SUBMITTED / ACKNOWLEDGED
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employees_tenant     ON employees(tenant_id, status);
CREATE INDEX idx_employees_dept       ON employees(department_id);
CREATE INDEX idx_leave_requests_emp   ON leave_requests(employee_id, status);
CREATE INDEX idx_payroll_items_run    ON payroll_items(payroll_run_id);
