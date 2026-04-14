import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import Card from "@/components/portal/ui/Card";
import Badge from "@/components/portal/ui/Badge";
import EmptyState from "@/components/portal/ui/EmptyState";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function TrainerClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: trainer } = await supabase
    .from("trainers").select("id").eq("user_id", user.id).single();

  const { data: clients } = await supabase
    .from("clients")
    .select(`
      id, full_name, status, plan_type, city,
      created_at,
      sessions(id, date_time, booking_status)
    `)
    .eq("assigned_trainer_id", trainer?.id ?? "")
    .order("created_at", { ascending: false });

  const active    = clients?.filter(c => c.status === "active") ?? [];
  const nonActive = clients?.filter(c => c.status !== "active") ?? [];

  const getNextSession = (sessions: any[]) => {
    const now = new Date();
    return sessions
      ?.filter(s => new Date(s.date_time) > now &&
        ["admin_confirmed","trainer_accepted","paid"].includes(s.booking_status))
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())[0];
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <SectionHeader
        title="My Clients"
        subtitle={`${clients?.length ?? 0} assigned client${clients?.length !== 1 ? "s" : ""}`}
      />

      {/* Active clients */}
      {active.length > 0 && (
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted mb-3 font-body">
            Active ({active.length})
          </p>
          <div className="space-y-2">
            {active.map((client) => {
              const next = getNextSession(client.sessions ?? []);
              return (
                <Link key={client.id} href={`/trainer/clients/${client.id}`}>
                  <Card className="hover:border-warm transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-stone flex items-center justify-center flex-shrink-0">
                          <span className="font-display text-ink text-lg font-light">
                            {client.full_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-body font-medium text-ink text-sm">
                            {client.full_name}
                          </p>
                          <p className="text-muted text-xs font-body">
                            {client.city} · {client.plan_type?.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {next ? (
                          <div className="text-right">
                            <p className="text-[10px] tracking-widest uppercase text-muted font-body">Next Session</p>
                            <p className="text-xs text-ink font-body">{formatDate(next.date_time)}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted font-body">No upcoming session</p>
                        )}
                        <Badge status={client.status} />
                        <ChevronRight size={14} className="text-muted" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Other clients */}
      {nonActive.length > 0 && (
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted mb-3 font-body">
            Other ({nonActive.length})
          </p>
          <div className="space-y-2">
            {nonActive.map((client) => (
              <Link key={client.id} href={`/trainer/clients/${client.id}`}>
                <Card className="hover:border-warm transition-colors cursor-pointer opacity-70">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-stone flex items-center justify-center flex-shrink-0">
                        <span className="font-display text-ink text-lg font-light">
                          {client.full_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-body font-medium text-ink text-sm">{client.full_name}</p>
                        <p className="text-muted text-xs font-body">{client.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={client.status} />
                      <ChevronRight size={14} className="text-muted" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(!clients || clients.length === 0) && (
        <Card>
          <EmptyState
            icon={<Users size={28} />}
            title="No clients assigned yet"
            description="Complete your onboarding to start receiving client assignments."
          />
        </Card>
      )}
    </div>
  );
}