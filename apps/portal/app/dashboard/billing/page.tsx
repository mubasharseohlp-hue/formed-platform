import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import Card from "@/components/portal/ui/Card";
import StatCard from "@/components/portal/ui/StatCard";
import Badge from "@/components/portal/ui/Badge";
import EmptyState from "@/components/portal/ui/EmptyState";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import PayNowButton from "@/components/portal/PayNowButton";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, plan_type, monthly_rate, billing_status, stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("client_id", client?.id ?? "")
    .order("created_at", { ascending: false });

  const totalPaid    = payments?.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0) ?? 0;
  const pendingCount = payments?.filter(p => p.status === "unpaid").length ?? 0;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <SectionHeader
        title="Billing & Membership"
        subtitle="Manage your membership and payment history"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Membership Plan"
          value={client?.plan_type?.replace("_week", "x") ?? "—"}
          sub="per week"
          accent
        />
        <StatCard
          label="Monthly Rate"
          value={client?.monthly_rate ? formatCurrency(client.monthly_rate) : "—"}
          sub="per month"
        />
        <StatCard
          label="Total Paid"
          value={formatCurrency(totalPaid)}
          sub="all time"
        />
        <StatCard
          label="Pending Payments"
          value={pendingCount}
          sub={pendingCount === 1 ? "payment due" : "payments due"}
        />
      </div>

      {/* Pending payment alert */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-5 flex items-start gap-4">
          <div className="flex-1">
            <p className="font-body font-medium text-yellow-800 text-sm mb-1">
              Payment required
            </p>
            <p className="text-yellow-700 text-xs font-body leading-relaxed">
              You have {pendingCount} session{pendingCount > 1 ? "s" : ""} awaiting payment.
              Complete payment to confirm your bookings.
            </p>
          </div>
        </div>
      )}

      {/* Membership card */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-muted mb-3 font-body">
              Current Plan
            </p>
            <p className="font-display text-2xl font-light text-ink mb-1">
              {client?.plan_type?.replace("_", " ").replace("week", "/ week") ?? "No active plan"}
            </p>
            {client?.monthly_rate && (
              <p className="text-muted text-sm font-body">
                {formatCurrency(client.monthly_rate)} / month · Month-to-month
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/dashboard/support"
              className="text-[10px] tracking-widest uppercase font-body px-5 py-2.5 border border-stone hover:border-ink text-muted hover:text-ink transition-colors">
              Request Pause
            </Link>
            <Link href="/dashboard/support"
              className="text-[10px] tracking-widest uppercase font-body px-5 py-2.5 border border-stone hover:border-red-300 text-muted hover:text-red-600 transition-colors">
              Cancel Membership
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-stone flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <CreditCard size={16} className="text-muted" />
            <p className="text-sm font-body text-muted">
              {client?.stripe_customer_id ? "Payment method on file" : "No payment method added"}
            </p>
          </div>
          {!client?.stripe_customer_id && (
            <button className="text-[10px] tracking-widest uppercase font-body text-ink underline underline-offset-2 hover:text-muted transition-colors">
              Add Payment Method
            </button>
          )}
        </div>
      </Card>

      {/* Payment history */}
      <div>
        <SectionHeader title="Payment History" />
        {payments && payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((p) => (
              <Card key={p.id} padding="sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-body font-medium text-ink text-sm">
                      {formatCurrency(p.amount)}
                    </p>
                    <p className="text-muted text-xs font-body">
                      {formatDate(p.created_at)}
                      {p.failure_reason && (
                        <span className="text-red-500 ml-2">· {p.failure_reason}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={p.status} />
                    {p.status === "unpaid" && p.session_id && (
  <PayNowButton sessionId={p.session_id} />
)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<CreditCard size={28} />}
              title="No payments yet"
              description="Your payment history will appear here."
            />
          </Card>
        )}
      </div>
    </div>
  );
}