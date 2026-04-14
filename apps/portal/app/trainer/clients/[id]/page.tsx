import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Card from "@/components/portal/ui/Card";
import Badge from "@/components/portal/ui/Badge";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

// Fix: Update the params type to Promise and await it
export default async function ClientDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fix: Await the params to get the id
  const { id } = await params;

  const { data: client } = await supabase
    .from("clients")
    .select(`
      *,
      client_intake(*),
      sessions(
        id, date_time, booking_status, session_type,
        session_notes(*)
      )
    `)
    .eq("id", id)  // Fix: Use the id variable instead of params.id
    .single();

  if (!client) redirect("/trainer/clients");

  const sessions = client.sessions ?? [];
  const pastSessions = sessions
    .filter((s: any) => new Date(s.date_time) < new Date())
    .sort((a: any, b: any) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
  const upcomingSessions = sessions
    .filter((s: any) => new Date(s.date_time) >= new Date())
    .sort((a: any, b: any) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

  const intake = client.client_intake;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Back */}
      <Link href="/trainer/clients"
        className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase text-muted hover:text-ink font-body transition-colors">
        <ArrowLeft size={12} /> Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-stone flex items-center justify-center">
            <span className="font-display text-2xl font-light text-ink">
              {client.full_name?.[0]}
            </span>
          </div>
          <div>
            <h1 className="font-display text-3xl font-light text-ink">{client.full_name}</h1>
            <p className="text-muted text-sm font-body">{client.city} · {client.plan_type?.replace("_", " ")}</p>
          </div>
        </div>
        <Badge status={client.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — info */}
        <div className="space-y-5">
          {/* Contact */}
          <Card>
            <p className="text-[10px] tracking-widest uppercase text-muted mb-4 font-body">Contact</p>
            <div className="space-y-3">
              {[
                { label: "Email", value: client.email },
                { label: "Phone", value: client.phone },
                { label: "City",  value: client.city },
                { label: "Plan",  value: client.plan_type?.replace("_", " ") },
              ].map(f => f.value ? (
                <div key={f.label}>
                  <p className="text-[10px] text-muted font-body">{f.label}</p>
                  <p className="text-sm text-ink font-body">{f.value}</p>
                </div>
              ) : null)}
            </div>
          </Card>

          {/* Goals */}
          {intake && (
            <Card>
              <p className="text-[10px] tracking-widest uppercase text-muted mb-4 font-body">Goals & Health</p>
              <div className="space-y-4">
                {intake.primary_goals?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted font-body mb-1">Primary Goals</p>
                    <div className="flex flex-wrap gap-1">
                      {intake.primary_goals.map((g: string) => (
                        <span key={g} className="text-[10px] bg-stone text-muted px-2 py-0.5 font-body">{g}</span>
                      ))}
                    </div>
                  </div>
                )}
                {intake.injuries && (
                  <div>
                    <p className="text-[10px] text-muted font-body mb-1">Injuries / Limitations</p>
                    <p className="text-sm text-ink font-body leading-relaxed">{intake.injuries}</p>
                  </div>
                )}
                {intake.training_history && (
                  <div>
                    <p className="text-[10px] text-muted font-body mb-1">Training History</p>
                    <p className="text-sm text-ink font-body leading-relaxed">{intake.training_history}</p>
                  </div>
                )}
                {intake.coaching_intensity && (
                  <div>
                    <p className="text-[10px] text-muted font-body mb-1">Coaching Intensity</p>
                    <p className="text-sm text-ink font-body">{intake.coaching_intensity}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right — sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming */}
          <div>
            <SectionHeader title="Upcoming Sessions" />
            {upcomingSessions.length > 0 ? (
              <div className="space-y-2">
                {upcomingSessions.map((s: any) => (
                  <Card key={s.id} padding="sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-body font-medium text-ink">
                          {formatDate(s.date_time)}
                        </p>
                        <p className="text-xs text-muted font-body capitalize">
                          {formatTime(s.date_time)} · {s.session_type?.replace(/_/g, " ")}
                        </p>
                      </div>
                      <Badge status={s.booking_status} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card padding="sm">
                <p className="text-center text-muted text-sm font-body py-3">No upcoming sessions.</p>
              </Card>
            )}
          </div>

          {/* Past sessions with notes */}
          <div>
            <SectionHeader title="Session History" />
            {pastSessions.length > 0 ? (
              <div className="space-y-3">
                {pastSessions.slice(0, 10).map((s: any) => (
                  <Card key={s.id} padding="sm">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <p className="text-sm font-body font-medium text-ink">{formatDate(s.date_time)}</p>
                        <p className="text-xs text-muted font-body">{formatTime(s.date_time)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={s.booking_status} />
                        {!s.session_notes?.length && s.booking_status === "completed" && (
                          <Link href={`/trainer/notes/${s.id}`}
                            className="text-[10px] tracking-widest uppercase font-body bg-red-50 text-red-600 border border-red-200 px-3 py-1">
                            Add Notes
                          </Link>
                        )}
                      </div>
                    </div>

                    {s.session_notes?.[0] && (
                      <div className="border-t border-stone pt-3 grid grid-cols-2 gap-3">
                        {s.session_notes[0].wins_improvements && (
                          <div>
                            <p className="text-[10px] tracking-widest uppercase text-muted font-body mb-1">Wins</p>
                            <p className="text-xs text-ink font-body leading-relaxed">
                              {s.session_notes[0].wins_improvements}
                            </p>
                          </div>
                        )}
                        {s.session_notes[0].next_session_focus && (
                          <div>
                            <p className="text-[10px] tracking-widest uppercase text-muted font-body mb-1">Next Focus</p>
                            <p className="text-xs text-ink font-body leading-relaxed">
                              {s.session_notes[0].next_session_focus}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card padding="sm">
                <p className="text-center text-muted text-sm font-body py-3">No sessions completed yet.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}