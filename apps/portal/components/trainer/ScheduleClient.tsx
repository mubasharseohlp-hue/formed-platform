"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/portal/ui/Card";
import Badge from "@/components/portal/ui/Badge";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import EmptyState from "@/components/portal/ui/EmptyState";
import { Calendar, Check, X } from "lucide-react";
import { formatDate, formatTime, cn } from "@/lib/utils";

interface ScheduleClientProps {
  sessions: any[];
  accessToken: string;
}

export default function ScheduleClient({ sessions: initial }: ScheduleClientProps) {
  const supabase = createClient();
  const [sessions, setSessions] = useState(initial);
  const [loading, setLoading]   = useState<string | null>(null);
  const [filter, setFilter]     = useState<"all" | "requested" | "upcoming" | "completed">("all");

  const updateStatus = async (id: string, status: string) => {
    setLoading(id);
    await supabase
      .from("sessions")
      .update({ booking_status: status })
      .eq("id", id);

    setSessions(prev =>
      prev.map(s => s.id === id ? { ...s, booking_status: status } : s)
    );
    setLoading(null);
  };

  const filters = [
    { key: "all",       label: "All" },
    { key: "requested", label: "Pending" },
    { key: "upcoming",  label: "Upcoming" },
    { key: "completed", label: "Completed" },
  ] as const;

  const filtered = sessions.filter(s => {
    if (filter === "all")       return true;
    if (filter === "requested") return s.booking_status === "requested";
    if (filter === "upcoming")  return ["admin_confirmed","trainer_accepted","paid"].includes(s.booking_status) && new Date(s.date_time) > new Date();
    if (filter === "completed") return s.booking_status === "completed";
    return true;
  });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <SectionHeader title="My Schedule" subtitle="Manage booking requests and upcoming sessions" />

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-stone">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2.5 text-[10px] tracking-widest uppercase font-body transition-colors border-b-2 -mb-px",
              filter === f.key
                ? "border-ink text-ink"
                : "border-transparent text-muted hover:text-ink"
            )}
          >
            {f.label}
            {f.key === "requested" && sessions.filter(s => s.booking_status === "requested").length > 0 && (
              <span className="ml-1.5 bg-ink text-cream text-[9px] px-1.5 py-0.5 rounded-full">
                {sessions.filter(s => s.booking_status === "requested").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sessions */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-cream w-12 h-12 flex flex-col items-center justify-center border border-stone flex-shrink-0">
                    <span className="text-[10px] font-body text-muted uppercase">
                      {new Date(s.date_time).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="font-display text-xl font-light text-ink leading-none">
                      {new Date(s.date_time).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-body font-medium text-ink text-sm">{s.clients?.full_name}</p>
                    <p className="text-muted text-xs font-body">
                      {formatTime(s.date_time)} · {s.clients?.city} · {s.session_type?.replace(/_/g, " ")}
                    </p>
                    {s.location_notes && (
                      <p className="text-muted text-xs font-body mt-0.5 italic">{s.location_notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge status={s.booking_status} />

                  {/* Accept/Decline for pending */}
                  {s.booking_status === "requested" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(s.id, "trainer_accepted")}
                        disabled={loading === s.id}
                        className="flex items-center gap-1.5 bg-ink text-cream text-[10px] tracking-widest uppercase font-body px-3 py-2 hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        <Check size={11} /> Accept
                      </button>
                      <button
                        onClick={() => updateStatus(s.id, "cancelled")}
                        disabled={loading === s.id}
                        className="flex items-center gap-1.5 bg-stone text-muted text-[10px] tracking-widest uppercase font-body px-3 py-2 hover:bg-warm transition-colors disabled:opacity-50"
                      >
                        <X size={11} /> Decline
                      </button>
                    </div>
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
            title="No sessions found"
            description="Sessions matching this filter will appear here."
          />
        </Card>
      )}
    </div>
  );
}