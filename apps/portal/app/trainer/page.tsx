import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Card from "@/components/portal/ui/Card";
import StatCard from "@/components/portal/ui/StatCard";
import Badge from "@/components/portal/ui/Badge";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import EmptyState from "@/components/portal/ui/EmptyState";
import Link from "next/link";
import { ClipboardList, ChevronRight, AlertCircle } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

export default async function TrainerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, full_name, status, tier, current_client_count, max_active_clients, compliance_flag")
    .eq("user_id", user.id)
    .single();

  if (!trainer) redirect("/auth/login");

  const now    = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

  // Today's sessions
  const { data: todaySessions } = await supabase
    .from("sessions")
    .select(`*, clients(full_name, city)`)
    .eq("trainer_id", trainer.id)
    .gte("date_time", todayStart.toISOString())
    .lte("date_time", todayEnd.toISOString())
    .order("date_time", { ascending: true });

  // Upcoming sessions (next 7 days)
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const { data: upcomingSessions } = await supabase
    .from("sessions")
    .select(`*, clients(full_name)`)
    .eq("trainer_id", trainer.id)
    .gt("date_time", todayEnd.toISOString())
    .lte("date_time", weekEnd.toISOString())
    .in("booking_status", ["admin_confirmed","trainer_accepted","paid"])
    .order("date_time", { ascending: true })
    .limit(5);

  // Pending booking requests
  const { data: pendingRequests } = await supabase
    .from("sessions")
    .select(`*, clients(full_name, city)`)
    .eq("trainer_id", trainer.id)
    .eq("booking_status", "requested")
    .order("created_at", { ascending: true });

  // Sessions missing notes (completed but no notes)
  const { data: missingSessions } = await supabase
    .from("sessions")
    .select(`*, clients(full_name)`)
    .eq("trainer_id", trainer.id)
    .eq("booking_status", "completed")
    .eq("notes_submitted", false)
    .order("date_time", { ascending: false })
    .limit(5);

  // Monthly completed count
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: monthCompleted } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("trainer_id", trainer.id)
    .eq("booking_status", "completed")
    .gte("date_time", startOfMonth);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">

      {/* Compliance alert */}
      {trainer.compliance_flag && (
        <div className="bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-body font-medium text-red-800">Compliance action required</p>
            <p className="text-xs text-red-600 font-body mt-0.5">
              Check your profile — a certification or document may have expired.
            </p>
          </div>
        </div>
      )}

      {/* Pending requests alert */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="bg-ink p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-warm/60 mb-1 font-body">
              Action Required
            </p>
            <p className="text-cream text-sm font-body">
              {pendingRequests.length} booking request{pendingRequests.length > 1 ? "s" : ""} awaiting your response.
            </p>
          </div>
          <Link href="/trainer/schedule"
            className="inline-flex items-center gap-2 bg-cream text-ink text-[10px] tracking-widest uppercase font-body px-5 py-2.5 hover:bg-stone transition-colors flex-shrink-0">
            Review Requests <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Clients"      value={trainer.current_client_count ?? 0}
          sub={`of ${trainer.max_active_clients ?? 10} max`} accent />
        <StatCard label="Sessions This Month" value={monthCompleted ?? 0} sub="completed" />
        <StatCard label="Today's Sessions"    value={todaySessions?.length ?? 0} sub="scheduled" />
        <StatCard label="Notes Overdue"       value={missingSessions?.length ?? 0}
          sub={missingSessions?.length ? "action needed" : "all clear"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today + upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today */}
          <div>
            <SectionHeader title="Today" />
            {todaySessions && todaySessions.length > 0 ? (
              <div className="space-y-2">
                {todaySessions.map((s) => (
                  <Card key={s.id} padding="sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-cream w-10 h-10 flex flex-col items-center justify-center border border-stone flex-shrink-0">
                          <span className="font-display text-lg font-light text-ink leading-none">
                            {new Date(s.date_time).getHours() % 12 || 12}
                          </span>
                          <span className="text-[9px] text-muted font-body">
                            {new Date(s.date_time).getHours() >= 12 ? "PM" : "AM"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-body font-medium text-ink">
                            {s.clients?.full_name}
                          </p>
                          <p className="text-xs text-muted font-body">
                            {formatTime(s.date_time)} · {s.clients?.city}
                          </p>
                        </div>
                      </div>
                      <Badge status={s.booking_status} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card padding="sm">
                <p className="text-center text-muted text-sm font-body py-4">No sessions today.</p>
              </Card>
            )}
          </div>

          {/* Upcoming this week */}
          <div>
            <SectionHeader
              title="This Week"
              action={
                <Link href="/trainer/schedule"
                  className="text-[10px] tracking-widest uppercase text-muted hover:text-ink font-body flex items-center gap-1">
                  Full schedule <ChevronRight size={10} />
                </Link>
              }
            />
            {upcomingSessions && upcomingSessions.length > 0 ? (
              <div className="space-y-2">
                {upcomingSessions.map((s) => (
                  <Card key={s.id} padding="sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center w-10">
                          <p className="text-[10px] text-muted font-body uppercase">
                            {new Date(s.date_time).toLocaleDateString("en-US", { month: "short" })}
                          </p>
                          <p className="font-display text-xl font-light text-ink leading-none">
                            {new Date(s.date_time).getDate()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-body font-medium text-ink">
                            {s.clients?.full_name}
                          </p>
                          <p className="text-xs text-muted font-body">{formatTime(s.date_time)}</p>
                        </div>
                      </div>
                      <Badge status={s.booking_status} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card padding="sm">
                <p className="text-center text-muted text-sm font-body py-4">No sessions this week.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Missing notes */}
          <div>
            <SectionHeader
              title="Notes Overdue"
              action={
                <Link href="/trainer/notes"
                  className="text-[10px] tracking-widest uppercase text-muted hover:text-ink font-body flex items-center gap-1">
                  View all <ChevronRight size={10} />
                </Link>
              }
            />
            {missingSessions && missingSessions.length > 0 ? (
              <div className="space-y-2">
                {missingSessions.map((s) => (
                  <Card key={s.id} padding="sm"
                    className="border-l-2 border-l-red-300">
                    <p className="text-sm font-body font-medium text-ink">
                      {s.clients?.full_name}
                    </p>
                    <p className="text-xs text-muted font-body">{formatDate(s.date_time)}</p>
                    <Link href={`/trainer/notes/${s.id}`}
                      className="text-[10px] tracking-widest uppercase font-body text-ink mt-2 block hover:text-muted transition-colors">
                      Submit notes &rarr;
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <Card padding="sm">
                <EmptyState
                  icon={<ClipboardList size={22} />}
                  title="All notes submitted"
                  description="Great work — no overdue notes."
                />
              </Card>
            )}
          </div>

          {/* Pending booking requests */}
          <div>
            <SectionHeader title="Booking Requests" />
            {pendingRequests && pendingRequests.length > 0 ? (
              <div className="space-y-2">
                {pendingRequests.map((s) => (
                  <Card key={s.id} padding="sm">
                    <p className="text-sm font-body font-medium text-ink mb-1">
                      {s.clients?.full_name}
                    </p>
                    <p className="text-xs text-muted font-body mb-3">
                      {formatDate(s.date_time)} at {formatTime(s.date_time)}
                    </p>
                    <AcceptDeclineButtons sessionId={s.id} />
                  </Card>
                ))}
              </div>
            ) : (
              <Card padding="sm">
                <p className="text-center text-muted text-sm font-body py-4">No pending requests.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline client component for accept/decline
function AcceptDeclineButtons({ sessionId }: { sessionId: string }) {
  return (
    <div className="flex gap-2">
      <Link href={`/trainer/schedule?action=accept&id=${sessionId}`}
        className="flex-1 text-center text-[10px] tracking-widest uppercase font-body bg-ink text-cream py-2 hover:bg-accent transition-colors">
        Accept
      </Link>
      <Link href={`/trainer/schedule?action=decline&id=${sessionId}`}
        className="flex-1 text-center text-[10px] tracking-widest uppercase font-body bg-stone text-muted py-2 hover:bg-warm transition-colors">
        Decline
      </Link>
    </div>
  );
}