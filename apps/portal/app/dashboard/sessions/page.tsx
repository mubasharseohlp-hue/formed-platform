import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import Card from "@/components/portal/ui/Card";
import Badge from "@/components/portal/ui/Badge";
import EmptyState from "@/components/portal/ui/EmptyState";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: client } = await supabase
    .from("clients").select("id").eq("user_id", user.id).single();

  const now = new Date().toISOString();

  const { data: upcoming } = await supabase
    .from("sessions")
    .select(`*, trainers (full_name)`)
    .eq("client_id", client?.id ?? "")
    .gte("date_time", now)
    .order("date_time", { ascending: true });

  const { data: past } = await supabase
    .from("sessions")
    .select(`*, trainers (full_name), session_notes (*)`)
    .eq("client_id", client?.id ?? "")
    .lt("date_time", now)
    .order("date_time", { ascending: false })
    .limit(20);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-10">
      {/* Upcoming */}
      <div>
        <SectionHeader
          title="Upcoming Sessions"
          action={
            <Link href="/dashboard/book"
              className="inline-flex items-center gap-2 bg-ink text-cream text-[10px] tracking-widest uppercase font-body px-5 py-2.5 hover:bg-accent transition-colors">
              Book Session
            </Link>
          }
        />

        {upcoming && upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((s) => (
              <Card key={s.id}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    {/* Date block */}
                    <div className="bg-cream w-14 h-14 flex flex-col items-center justify-center flex-shrink-0 border border-stone">
                      <span className="text-[10px] font-body text-muted uppercase tracking-wider">
                        {new Date(s.date_time).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="font-display text-2xl font-light text-ink leading-none">
                        {new Date(s.date_time).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="font-body font-medium text-ink">
                        {formatTime(s.date_time)}
                      </p>
                      <p className="text-muted text-sm font-body mt-0.5">
                        with {s.trainers?.full_name ?? "Your Trainer"}
                      </p>
                      <p className="text-muted text-xs font-body capitalize">
                        {s.session_type?.replace(/_/g, " ")} · {s.duration_minutes ?? 60} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={s.booking_status} />
                    {s.booking_status === "payment_pending" && (
                      <Link href="/dashboard/billing"
                        className="text-[10px] tracking-widest uppercase font-body bg-ink text-cream px-4 py-2 hover:bg-accent transition-colors">
                        Pay Now
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<Calendar size={28} />}
              title="No upcoming sessions"
              description="Book your next session with your assigned trainer."
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

      {/* Past sessions */}
      <div>
        <SectionHeader title="Session History" />
        {past && past.length > 0 ? (
          <div className="space-y-2">
            {past.map((s) => (
              <Card key={s.id} padding="sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        {formatTime(s.date_time)}
                      </p>
                      <p className="text-xs text-muted font-body capitalize">
                        {s.session_type?.replace(/_/g, " ")} · {s.trainers?.full_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={s.booking_status} />
                    {s.session_notes?.[0] && (
                      <span className="text-[10px] tracking-widest uppercase text-muted font-body bg-stone px-2 py-1">
                        Notes available
                      </span>
                    )}
                  </div>
                </div>

                {/* Session notes preview */}
                {s.session_notes?.[0] && (
                  <div className="mt-4 pt-4 border-t border-stone">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {s.session_notes[0].wins_improvements && (
                        <div>
                          <p className="text-[10px] tracking-widest uppercase text-muted mb-1 font-body">Wins</p>
                          <p className="text-xs text-ink font-body leading-relaxed">
                            {s.session_notes[0].wins_improvements}
                          </p>
                        </div>
                      )}
                      {s.session_notes[0].next_session_focus && (
                        <div>
                          <p className="text-[10px] tracking-widest uppercase text-muted mb-1 font-body">Next Focus</p>
                          <p className="text-xs text-ink font-body leading-relaxed">
                            {s.session_notes[0].next_session_focus}
                          </p>
                        </div>
                      )}
                      {s.session_notes[0].homework_habits && (
                        <div>
                          <p className="text-[10px] tracking-widest uppercase text-muted mb-1 font-body">Homework</p>
                          <p className="text-xs text-ink font-body leading-relaxed">
                            {s.session_notes[0].homework_habits}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<Clock size={28} />}
              title="No sessions yet"
              description="Your completed sessions will appear here."
            />
          </Card>
        )}
      </div>
    </div>
  );
}