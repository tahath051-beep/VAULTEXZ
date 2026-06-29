import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '@/api/hr.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar, DollarSign, Plus } from 'lucide-react';

function EmployeesTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_code: '', full_name: '', email: '', job_title: '', hire_date: '', base_salary: '' });
  const { data } = useQuery({ queryKey: ['employees'], queryFn: () => hrApi.getEmployees() });
  const create = useMutation({
    mutationFn: () => hrApi.createEmployee(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setOpen(false); toast({ title: 'Employee created' }); },
  });

  const employees = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 me-1" /> Add Employee</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {['Code','Name','Email','Job Title','Department','Hire Date','Status'].map(h => (
                <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs">{e.employee_code}</td>
                <td className="px-4 py-2.5 font-medium">{e.full_name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.email}</td>
                <td className="px-4 py-2.5">{e.job_title}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.department_name ?? 'â€”'}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.hire_date?.slice(0,10)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No employees yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {(['employee_code','full_name','email','job_title','hire_date','base_salary'] as const).map(f => (
              <Input key={f} placeholder={f.replace(/_/g,' ')} type={f === 'hire_date' ? 'date' : f === 'base_salary' ? 'number' : 'text'}
                value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            ))}
            <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? 'Savingâ€¦' : 'Create Employee'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PayrollTab() {
  const { data } = useQuery({ queryKey: ['payroll-runs'], queryFn: () => hrApi.getPayrollRuns() });
  const runs = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            {['Period','Currency','Gross','Deductions','Net','Status'].map(h => (
              <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id} className="border-t border-border hover:bg-muted/20">
              <td className="px-4 py-2.5 font-medium">{r.period_year}-{String(r.period_month).padStart(2,'0')}</td>
              <td className="px-4 py-2.5">{r.currency}</td>
              <td className="px-4 py-2.5">{parseFloat(r.total_gross || '0').toLocaleString()}</td>
              <td className="px-4 py-2.5">{parseFloat(r.total_deductions || '0').toLocaleString()}</td>
              <td className="px-4 py-2.5 font-semibold">{parseFloat(r.total_net || '0').toLocaleString()}</td>
              <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
          {runs.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No payroll runs</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LeaveTab() {
  const { data } = useQuery({ queryKey: ['leave-requests'], queryFn: () => hrApi.getLeaveRequests() });
  const leaves = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            {['Employee','Leave Type','Start','End','Days','Status'].map(h => (
              <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leaves.map((l) => (
            <tr key={l.id} className="border-t border-border hover:bg-muted/20">
              <td className="px-4 py-2.5 font-medium">{l.employee_name}</td>
              <td className="px-4 py-2.5">{l.leave_type_name}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{l.start_date?.slice(0,10)}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{l.end_date?.slice(0,10)}</td>
              <td className="px-4 py-2.5">{l.days}</td>
              <td className="px-4 py-2.5"><StatusBadge status={l.status} /></td>
            </tr>
          ))}
          {leaves.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No leave requests</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function HRPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Human Resources" subtitle="Employees, payroll, and leave management" />
      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees"><Users className="h-3.5 w-3.5 me-1.5" />Employees</TabsTrigger>
          <TabsTrigger value="payroll"><DollarSign className="h-3.5 w-3.5 me-1.5" />Payroll</TabsTrigger>
          <TabsTrigger value="leave"><Calendar className="h-3.5 w-3.5 me-1.5" />Leave</TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="mt-4"><EmployeesTab /></TabsContent>
        <TabsContent value="payroll" className="mt-4"><PayrollTab /></TabsContent>
        <TabsContent value="leave" className="mt-4"><LeaveTab /></TabsContent>
      </Tabs>
    </div>
  );
}

