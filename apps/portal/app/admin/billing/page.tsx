import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import StatCard from "@/components/portal/ui/StatCard";
import Card from "@/components/portal/ui/Card";
import Badge from "@/components/portal/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import RefundButton from "@/components/admin/RefundButton";

export default async function AdminBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: payments } = await supabase
    .from("payments")
    .select(`*, clients(full_name)`)
    .order("created_at", { ascending: false })
    .limit(50);

  const now          = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: activeClients } = await supabase
    .from("clients").select("monthly_rate").eq("status", "active");

  const mrr          = activeClients?.reduce((s, c) => s + (c.monthly_rate ?? 0), 0) ?? 0;
  const totalFailed  = payments?.filter(p => p.status === "failed").length ?? 0;
  const totalRefunded = payments?.filter(p => p.status === "refunded").reduce((s, p) => s + (p.refunded_amount ?? 0), 0) ?? 0;
  const revenueMonth = payments?.filter(p => p.status === "paid" && p.created_at >= startOfMonth)
    .reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <SectionHeader title="Billing & Payments" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="MRR"              value={formatCurrency(mrr)}             sub="monthly recurring" accent />
        <StatCard label="Revenue This Month" value={formatCurrency(revenueMonth)}  sub="collected" />
        <StatCard label="Failed Payments"  value={totalFailed}                     sub="need action" />
        <StatCard label="Refunded"         value={formatCurrency(totalRefunded)}   sub="all time" />
      </div>

      <div>
        <SectionHeader title="Payment History" />
        <div className="space-y-2">
          {payments?.map((p) => (
            <Card key={p.id} padding="sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-body font-medium text-ink text-sm">
                    {p.clients?.full_name} — {formatCurrency(p.amount)}
                  </p>
                  <p className="text-muted text-xs font-body">{formatDate(p.created_at)}</p>
                  {p.failure_reason && (
                    <p className="text-red-500 text-xs font-body">{p.failure_reason}</p>
                  )}
                </div>
                <Badge status={p.status} />
                {p.status === "paid" && (
  <RefundButton paymentId={p.id} amount={p.amount} />
)}
              </div>
            </Card>
          ))}
          {(!payments || payments.length === 0) && (
            <Card>
              <p className="text-center text-muted text-sm font-body py-8">No payments yet.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}