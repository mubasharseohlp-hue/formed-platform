import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import Card from "@/components/portal/ui/Card";
import Badge from "@/components/portal/ui/Badge";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Define a type for the session data
type SessionWithRelations = {
  id: string;
  date_time: string;
  booking_status: string;
  session_type: string;
  notes_submitted: boolean;
  payout_status: string;
  client_id: string;
  trainer_id: string;
  client: { full_name: string }[] | null;
  trainer: { full_name: string }[] | null;
};

export default async function AdminSessionsPage({
  searchParams
}: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  const status = statusParam ?? "requested";
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const FILTERS = [
    "requested", "trainer_accepted", "admin_confirmed",
    "payment_pending", "paid", "completed", "cancelled", "no_show"
  ];

  // Query with proper relations
  let query = supabase
    .from("sessions")
    .select(`
      id, 
      date_time, 
      booking_status, 
      session_type,
      notes_submitted, 
      payout_status,
      client_id,
      trainer_id,
      client:clients!client_id (
        full_name
      ),
      trainer:trainers!trainer_id (
        full_name
      )
    `)
    .order("date_time", { ascending: false })
    .limit(50);

  if (status !== "all") query = query.eq("booking_status", status);

  const { data: sessions } = await query as { data: SessionWithRelations[] | null };

  // Debug logging
  if (sessions && sessions.length > 0) {
    console.log("=== SESSIONS DATA ===");
    console.log("First session:", JSON.stringify(sessions[0], null, 2));
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <SectionHeader title="Session Management" />
      <div className="flex gap-1 flex-wrap border-b border-stone pb-0 overflow-x-auto">
        {["all", ...FILTERS].map(s => (
          <Link
            key={s}
            href={`/admin/sessions?status=${s}`}
            className={`px-3 py-2 text-[10px] tracking-widest uppercase font-body transition-colors border-b-2 -mb-px whitespace-nowrap ${
              status === s ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {sessions?.map((s) => {
          // Safe access with type checking
          const clientName = s.client?.[0]?.full_name || "Unknown Client";
          const trainerName = s.trainer?.[0]?.full_name || "Unknown Trainer";
          
          return (
            <Link key={s.id} href={`/admin/sessions/${s.id}`}>
              <Card className="hover:border-warm transition-colors cursor-pointer">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="bg-cream w-10 h-10 flex flex-col items-center justify-center border border-stone flex-shrink-0">
                      <span className="text-[9px] font-body text-muted uppercase">
                        {new Date(s.date_time).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="font-display text-lg font-light text-ink leading-none">
                        {new Date(s.date_time).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="font-body font-medium text-ink text-sm">
                        {clientName} → {trainerName}
                      </p>
                      <p className="text-muted text-xs font-body">
                        {formatTime(s.date_time)} · {s.session_type?.replace(/_/g, " ")}
                      </p>
                      <p className="text-[9px] text-muted font-mono">
                        IDs: {s.client_id?.slice(0, 8)}... → {s.trainer_id?.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!s.notes_submitted && s.booking_status === "completed" && (
                      <span className="text-[10px] tracking-widest uppercase font-body text-red-500 bg-red-50 px-2 py-1">
                        Notes missing
                      </span>
                    )}
                    <Badge status={s.booking_status} />
                    <ChevronRight size={14} className="text-muted" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}

        {(!sessions || sessions.length === 0) && (
          <Card>
            <p className="text-center text-muted text-sm font-body py-8">
              No {status !== "all" ? status.replace(/_/g, " ") : ""} sessions.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}