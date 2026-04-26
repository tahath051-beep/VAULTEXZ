import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { getIBClients } from '@/api/ib.api';
import { useIBAuthStore } from '@/stores/ibAuth.store';
import { fmt, fmtDate } from '@/lib/utils';
import { Copy, Link, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function IBClients() {
  const { ibUser } = useIBAuthStore();
  const { data: clients = [], isLoading } = useQuery({ queryKey: ['ib-clients'], queryFn: getIBClients });

  const copyLink = () => {
    navigator.clipboard.writeText(ibUser?.referral_link ?? '').then(() =>
      toast({ title: 'Referral link copied to clipboard' })
    );
  };

  if (isLoading) return <PageLoader />;

  const activeCount = clients.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Clients</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {clients.length} total · {activeCount} active
        </p>
      </div>

      {/* Referral link */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Link className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="font-semibold text-sm text-foreground">Your Referral Link</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0 p-2.5 bg-muted rounded-lg border border-border">
              <p className="font-mono text-sm text-foreground truncate">{ibUser?.referral_link}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
              <Copy className="h-4 w-4 mr-2" />Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="font-semibold text-foreground">{ibUser?.referral_clicks ?? 0}</span> total clicks on your referral link
          </p>
        </CardContent>
      </Card>

      {/* Clients table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <p className="font-semibold text-sm text-foreground">Referred Clients</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="w-28">Total Volume</TableHead>
                  <TableHead className="w-24">Trades</TableHead>
                  <TableHead className="w-36">Commission Gen.</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      No clients yet
                    </TableCell>
                  </TableRow>
                ) : clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{c.client_code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(c.registered_at)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.total_volume.toFixed(2)} lots</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">{c.total_trades}</TableCell>
                    <TableCell className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                      ${fmt(c.commission_generated)}
                    </TableCell>
                    <TableCell>
                      {c.is_active ? (
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-medium">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs font-medium">Inactive</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
