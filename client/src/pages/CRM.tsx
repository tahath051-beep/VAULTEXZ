import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi } from '@/api/crm.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, User, MessageSquare, Ticket } from 'lucide-react';

function LeadsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', country: '', source: '' });
  const { data } = useQuery({ queryKey: ['leads'], queryFn: () => crmApi.getLeads() });
  const create = useMutation({
    mutationFn: () => crmApi.createLead(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); setOpen(false); toast({ title: 'Lead created' }); },
  });

  const leads = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 me-1" /> New Lead</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {['Name','Email','Phone','Country','Source','Status'].map(h => (
                <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 font-medium">{l.full_name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{l.email}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{l.phone}</td>
                <td className="px-4 py-2.5">{l.country}</td>
                <td className="px-4 py-2.5">{l.source}</td>
                <td className="px-4 py-2.5"><StatusBadge status={l.status} /></td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No leads yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Lead</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            {(['full_name','email','phone','country','source'] as const).map(f => (
              <Input key={f} placeholder={f.replace('_',' ')} value={form[f]}
                onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            ))}
            <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? 'Creatingâ€¦' : 'Create Lead'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TicketsTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', category: '', priority: 'MEDIUM', description: '' });
  const { data } = useQuery({ queryKey: ['tickets'], queryFn: () => crmApi.getTickets() });
  const create = useMutation({
    mutationFn: () => crmApi.createTicket(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tickets'] }); setOpen(false); toast({ title: 'Ticket created' }); },
  });

  const tickets = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 me-1" /> New Ticket</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              {['Ticket #','Subject','Category','Priority','Status','Assigned To'].map(h => (
                <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs">{t.ticket_number}</td>
                <td className="px-4 py-2.5 font-medium">{t.subject}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{t.category}</td>
                <td className="px-4 py-2.5"><StatusBadge status={t.priority} /></td>
                <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-2.5 text-muted-foreground">{t.assigned_to_name ?? 'â€”'}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No tickets</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
            <Input placeholder="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <Button className="w-full" onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? 'Creatingâ€¦' : 'Create Ticket'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="CRM" subtitle="Leads, activities, and support tickets" />
      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads"><User className="h-3.5 w-3.5 me-1.5" />Leads</TabsTrigger>
          <TabsTrigger value="tickets"><Ticket className="h-3.5 w-3.5 me-1.5" />Tickets</TabsTrigger>
          <TabsTrigger value="activities"><MessageSquare className="h-3.5 w-3.5 me-1.5" />Activities</TabsTrigger>
        </TabsList>
        <TabsContent value="leads" className="mt-4"><LeadsTab /></TabsContent>
        <TabsContent value="tickets" className="mt-4"><TicketsTab /></TabsContent>
        <TabsContent value="activities" className="mt-4">
          <p className="text-sm text-muted-foreground py-8 text-center">Activity log coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

