import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '@/api/workflows.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GitBranch, CheckCircle, Clock } from 'lucide-react';

function MyTasksTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data } = useQuery({ queryKey: ['my-tasks'], queryFn: () => workflowsApi.getMyTasks() });
  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      workflowsApi.actOnTask(id, { action }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-tasks'] }); toast({ title: 'Action recorded' }); },
  });

  const tasks = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <div key={t.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">{t.template_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.process_type?.replace(/_/g,' ')} Â· Stage {t.stage_order}
            </p>
            {t.due_at && (
              <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />Due {new Date(t.due_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => act.mutate({ id: t.id, action: 'REJECTED' })}>
              Reject
            </Button>
            <Button size="sm"
              onClick={() => act.mutate({ id: t.id, action: 'APPROVED' })}>
              <CheckCircle className="h-3.5 w-3.5 me-1" />Approve
            </Button>
          </div>
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No pending tasks â€” you're all caught up</p>
        </div>
      )}
    </div>
  );
}

function InstancesTab() {
  const { data } = useQuery({ queryKey: ['workflow-instances'], queryFn: () => workflowsApi.getInstances() });
  const instances = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            {['Workflow','Process','Current Stage','Status','Initiated By','Created','Due'].map(h => (
              <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {instances.map((i) => (
            <tr key={i.id} className="border-t border-border hover:bg-muted/20">
              <td className="px-4 py-2.5 font-medium">{i.template_name}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{i.process_type?.replace(/_/g,' ')}</td>
              <td className="px-4 py-2.5">Stage {i.current_stage}</td>
              <td className="px-4 py-2.5"><StatusBadge status={i.status} /></td>
              <td className="px-4 py-2.5 text-muted-foreground">{i.initiated_by_name ?? 'â€”'}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{i.due_at ? new Date(i.due_at).toLocaleDateString() : 'â€”'}</td>
            </tr>
          ))}
          {instances.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No workflow instances</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TemplatesTab() {
  const { data } = useQuery({ queryKey: ['workflow-templates'], queryFn: () => workflowsApi.getTemplates() });
  const templates = (data?.data?.data ?? []) as Record<string, string>[];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            {['Name','Process Type','Stages','SLA (hours)','Active'].map(h => (
              <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-t border-border hover:bg-muted/20">
              <td className="px-4 py-2.5 font-medium">{t.name}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{t.process_type?.replace(/_/g,' ')}</td>
              <td className="px-4 py-2.5">{t.stage_count}</td>
              <td className="px-4 py-2.5">{t.sla_hours}h</td>
              <td className="px-4 py-2.5">{t.is_active ? <span className="text-green-400">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
            </tr>
          ))}
          {templates.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No workflow templates configured</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function WorkflowsPage() {
  const { data: tasks } = useQuery({ queryKey: ['my-tasks'], queryFn: () => workflowsApi.getMyTasks() });
  const pendingCount = (tasks?.data?.data ?? []).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Workflows" subtitle="Tasks, approvals, and process instances" />
      <Tabs defaultValue="my-tasks">
        <TabsList>
          <TabsTrigger value="my-tasks">
            <CheckCircle className="h-3.5 w-3.5 me-1.5" />My Tasks
            {pendingCount > 0 && (
              <span className="ms-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{pendingCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="instances"><GitBranch className="h-3.5 w-3.5 me-1.5" />All Instances</TabsTrigger>
          <TabsTrigger value="templates"><Clock className="h-3.5 w-3.5 me-1.5" />Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="my-tasks" className="mt-4"><MyTasksTab /></TabsContent>
        <TabsContent value="instances" className="mt-4"><InstancesTab /></TabsContent>
        <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

