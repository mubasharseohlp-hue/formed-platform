import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import Card from "@/components/portal/ui/Card";
import StatCard from "@/components/portal/ui/StatCard";
import Badge from "@/components/portal/ui/Badge";
import EmptyState from "@/components/portal/ui/EmptyState";
import PayoutRequestButton from "@/components/trainer/PayoutRequestButton";
import { DollarSign } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function TrainerWalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: trainer } = await supabase
    .from("trainers").select("id, payout_rate, full_name").eq("user_id", user.id).single();

  const { data: payouts } = await supabase
    .from("payouts")
    .select(`*, sessions(date_time, session_type), clients(full_name)`)
    .eq("trainer_id", trainer?.id ?? "")
    .order("created_at", { ascending: false });

  // Sessions eligible for payout (completed, notes submitted, no payout record)
  const { data: eligible } = await supabase
    .from("sessions")
    .select(`*, clients(full_name)`)
    .eq("trainer_id", trainer?.id ?? "")
    .eq("booking_status", "completed")
    .eq("notes_submitted", true)
    .eq("payout_status", "pending");

  const totalPaid      = payouts?.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0) ?? 0;
  const totalApproved  = payouts?.filter(p => p.status === "approved").reduce((s, p) => s + p.amount, 0) ?? 0;
  const totalRequested = payouts?.filter(p => p.status === "requested").reduce((s, p) => s + p.amount, 0) ?? 0;
  const pendingEarned  = (eligible?.length ?? 0) * (trainer?.payout_rate ?? 0);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <SectionHeader
        title="Wallet"
        subtitle="Your earnings and payout history"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Paid Out"   value={formatCurrency(totalPaid)}      sub="all time"       accent />
        <StatCard label="Approved"         value={formatCurrency(totalApproved)}  sub="awaiting transfer" />
        <StatCard label="Requested"        value={formatCurrency(totalRequested)} sub="pending review" />
        <StatCard label="Pending Earnings" value={formatCurrency(pendingEarned)}  sub="not yet requested" />
      </div>

      {/* Payout rate */}
      {trainer?.payout_rate && (
        <div className="bg-ink px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-warm/40 font-body mb-0.5">Your Payout Rate</p>
            <p className="text-cream font-display text-2xl font-light">{formatCurrency(trainer.payout_rate)} / session</p>
          </div>
          <p className="text-muted text-xs font-body max-w-xs text-right leading-relaxed">
            Payouts are processed manually by the FORMED team after approval.
          </p>
        </div>
      )}

      {/* Sessions eligible for payout request */}
      {eligible && eligible.length > 0 && (
        <div>
          <SectionHeader
            title={`Ready to Request (${eligible.length})`}
            subtitle="These completed sessions are eligible for payout"
          />
          <div className="space-y-2 mb-4">
            {eligible.map((s) => (
              <Card key={s.id} padding="sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-body font-medium text-ink">{s.clients?.full_name}</p>
                    <p className="text-xs text-muted font-body">{formatDate(s.date_time)}</p>
                  </div>
                  <p className="text-sm font-body text-ink font-medium">
                    {trainer?.payout_rate ? formatCurrency(trainer.payout_rate) : "—"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
          <PayoutRequestButton
            trainerId={trainer!.id}
            sessions={eligible}
            payoutRate={trainer?.payout_rate ?? 0}
          />
        </div>
      )}

      {/* Payout history */}
      <div>
        <SectionHeader title="Payout History" />
        {payouts && payouts.length > 0 ? (
          <div className="space-y-2">
            {payouts.map((p) => (
              <Card key={p.id} padding="sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-body font-medium text-ink">
                      {p.clients?.full_name} · {formatCurrency(p.amount)}
                    </p>
                    <p className="text-xs text-muted font-body">
                      {formatDate(p.created_at)}
                      {p.status === "rejected" && p.dispute_reason && (
                        <span className="text-red-500 ml-2">· {p.dispute_reason}</span>
                      )}
                    </p>
                  </div>
                  <Badge status={p.status} />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<DollarSign size={28} />}
              title="No payout history yet"
              description="Complete sessions and submit notes to become eligible for payouts."
            />
          </Card>
        )}
      </div>
    </div>
  );
}