import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Card from "@/components/portal/ui/Card";
import StatCard from "@/components/portal/ui/StatCard";
import Badge from "@/components/portal/ui/Badge";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import EmptyState from "@/components/portal/ui/EmptyState";
import Link from "next/link";
import { Calendar, ChevronRight, Clock } from "lucide-react";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch client with all relations
  const { data: client } = await supabase
    .from("clients")
    .select(`
      *,
      trainers:assigned_trainer_id (
        id, full_name, short_bio, headshot_url,
        specialties, certifications
      ),
      client_onboarding (
        membership_agreement_signed,
        liability_waiver_signed,
        auto_bill_authorized,
        health_intake_completed,
        payment_method_on_file
      )
    `)
    .eq("user_id", user.id)
    .single();

  // Fetch upcoming sessions
  const { data: upcomingSessions } = await supabase
    .from("sessions")
    .select(`*, trainers (full_name)`)
    .eq("client_id", client?.id ?? "")
    .in("booking_status", ["admin_confirmed", "trainer_accepted", "payment_pending", "paid"])
    .gte("date_time", new Date().toISOString())
    .order("date_time", { ascending: true })
    .limit(3);

  // Fetch recent payments
  const { data: recentPayments } = await supabase
    .from("payments")
    .select("*")
    .eq("client_id", client?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(3);

  // Session count this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { count: sessionCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("client_id", client?.id ?? "")
    .eq("booking_status", "completed")
    .gte("date_time", startOfMonth);

  // Onboarding completion
  const ob = client?.client_onboarding;
  const onboardingSteps = ob ? [
    ob.membership_agreement_signed,
    ob.liability_waiver_signed,
    ob.auto_bill_authorized,
    ob.health_intake_completed,
    ob.payment_method_on_file,
  ] : [];
  const completedSteps = onboardingSteps.filter(Boolean).length;
  const onboardingComplete = completedSteps === 5;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">

      {/* Onboarding banner — show if incomplete */}
      {!onboardingComplete && client && (
        <div className="bg-ink p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-warm/60 mb-1 font-body">
              Complete Your Setup
            </p>
            <p className="text-cream font-body text-sm">
              {completedSteps} of 5 steps completed — complete onboarding to get matched with your trainer.
            </p>
            {/* Progress bar */}
            <div className="mt-3 h-1 bg-cream/10 w-48">
              <div
                className="h-1 bg-warm transition-all duration-500"
                style={{ width: `${(completedSteps / 5) * 100}%` }}
              />
            </div>
          </div>
          <Link href="/dashboard/onboarding"
            className="inline-flex items-center gap-2 bg-cream text-ink text-[10px] tracking-widest uppercase font-body px-6 py-3 hover:bg-stone transition-colors flex-shrink-0">
            Continue Setup <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Sessions This Month"
          value={sessionCount ?? 0}
          sub={`of ${client?.plan_type === "3x_week" ? 12 : client?.plan_type === "2x_week" ? 8 : 4} included`}
          accent
        />
        <StatCard
          label="Membership"
          value={client?.plan_type?.replace("_week", "x") ?? "—"}
          sub="per week"
        />
        <StatCard
          label="Status"
          value={client?.status ? client.status.replace(/_/g, " ") : "—"}
          sub="membership"
        />
        <StatCard
          label="Next Session"
          value={upcomingSessions?.[0] ? formatDate(upcomingSessions[0].date_time).split(",")[0] : "None"}
          sub={upcomingSessions?.[0] ? formatTime(upcomingSessions[0].date_time) : "Book a session"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming sessions */}
        <div className="lg:col-span-2">
          <SectionHeader
            title="Upcoming Sessions"
            action={
              <Link href="/dashboard/sessions"
                className="text-[10px] tracking-widest uppercase text-muted hover:text-ink transition-colors font-body flex items-center gap-1">
                View all <ChevronRight size={10} />
              </Link>
            }
          />
          {upcomingSessions && upcomingSessions.length > 0 ? (
            <div className="space-y-2">
              {upcomingSessions.map((session) => (
                <Card key={session.id} padding="sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-cream w-10 h-10 flex flex-col items-center justify-center flex-shrink-0 border border-stone">
                        <span className="text-[10px] font-body text-muted uppercase">
                          {new Date(session.date_time).toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="font-display text-lg font-light text-ink leading-none">
                          {new Date(session.date_time).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-body text-sm font-medium text-ink">
                          {formatTime(session.date_time)}
                        </p>
                        <p className="text-muted text-xs font-body">
                          with {session.trainers?.full_name ?? "Your Trainer"} ·{" "}
                          {session.session_type?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <Badge status={session.booking_status} />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={<Calendar size={28} />}
                title="No upcoming sessions"
                description="Book your next session to get started."
                action={
                  <Link href="/dashboard/book"
                    className="inline-flex items-center gap-2 bg-ink text-cream text-[10px] tracking-widest uppercase font-body px-6 py-3 hover:bg-accent transition-colors">
                    Book a Session
                  </Link>
                }
              />
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Trainer card */}
          <div>
            <SectionHeader title="Your Trainer" />
            {client?.trainers ? (
              <Card>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-stone flex-shrink-0 overflow-hidden">
                    {client.trainers.headshot_url ? (
                      <img
                        src={client.trainers.headshot_url}
                        alt={client.trainers.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-display text-muted text-lg">
                          {client.trainers.full_name?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-ink">
                      {client.trainers.full_name}
                    </p>
                    {client.trainers.short_bio && (
                      <p className="text-muted text-xs font-body mt-1 leading-relaxed line-clamp-2">
                        {client.trainers.short_bio}
                      </p>
                    )}
                    {client.trainers.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {client.trainers.specialties.slice(0, 2).map((s: string) => (
                          <span key={s}
                            className="text-[10px] bg-stone text-muted px-2 py-0.5 font-body">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <EmptyState
                  title="Not yet matched"
                  description="Complete onboarding to get matched with your trainer."
                />
              </Card>
            )}
          </div>

          {/* Recent payments */}
          <div>
            <SectionHeader
              title="Recent Payments"
              action={
                <Link href="/dashboard/billing"
                  className="text-[10px] tracking-widest uppercase text-muted hover:text-ink font-body flex items-center gap-1">
                  View all <ChevronRight size={10} />
                </Link>
              }
            />
            {recentPayments && recentPayments.length > 0 ? (
              <div className="space-y-2">
                {recentPayments.map((p) => (
                  <Card key={p.id} padding="sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-body font-medium text-ink">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-xs text-muted font-body">
                          {formatDate(p.created_at)}
                        </p>
                      </div>
                      <Badge status={p.status} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card padding="sm">
                <p className="text-muted text-xs font-body text-center py-4">
                  No payments yet.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}