import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import Card from "@/components/portal/ui/Card";
import EmptyState from "@/components/portal/ui/EmptyState";
import { MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function TrainerMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: messages } = await supabase
    .from("messages")
    .select(`*, sender:sender_id(email)`)
    .eq("receiver_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <SectionHeader
        title="Messages"
        subtitle="Communications from FORMED operations and clients"
      />

      {messages && messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id} className={!msg.is_read ? "border-l-2 border-l-ink" : ""}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-xs text-muted font-body">{msg.sender?.email}</p>
                <p className="text-xs text-muted font-body flex-shrink-0">{formatDate(msg.created_at)}</p>
              </div>
              <p className="text-sm text-ink font-body leading-relaxed">{msg.content}</p>
              {!msg.is_read && (
                <span className="text-[10px] tracking-widest uppercase font-body text-ink mt-2 block">New</span>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<MessageSquare size={28} />}
            title="No messages yet"
            description="Messages from the FORMED operations team will appear here."
          />
        </Card>
      )}
    </div>
  );
}