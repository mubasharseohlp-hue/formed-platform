import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import Card from "@/components/portal/ui/Card";
import Badge from "@/components/portal/ui/Badge";
import { formatDate } from "@/lib/utils";

export default async function TrainerProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: trainer } = await supabase
    .from("trainers")
    .select(`*, trainer_docs(*)`)
    .eq("user_id", user.id)
    .single();

  const profileFields = [
    { label: "Full Name",        value: trainer?.full_name },
    { label: "Email",            value: user.email },
    { label: "Phone",            value: trainer?.phone },
    { label: "City",             value: trainer?.city },
    { label: "Experience",       value: trainer?.experience_years ? `${trainer.experience_years} years` : null },
    { label: "Tier",             value: trainer?.tier?.replace(/_/g, " ") },
    { label: "Max Clients",      value: trainer?.max_active_clients },
    { label: "Coaching Style",   value: trainer?.coaching_style },
    { label: "Member Since",     value: trainer?.created_at ? formatDate(trainer.created_at) : null },
  ];

  const docs = trainer?.trainer_docs ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <SectionHeader title="My Profile" />

      {/* Status + tier */}
      <div className="flex items-center gap-3">
        <Badge status={trainer?.status ?? "submitted"} />
        {trainer?.tier && (
          <span className="text-[10px] tracking-widest uppercase font-body text-muted bg-stone px-2.5 py-1">
            {trainer.tier.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Profile info */}
      <Card>
        <p className="text-[10px] tracking-widest uppercase text-muted mb-5 font-body">
          Personal Information
        </p>
        <div className="space-y-0 border-t border-stone">
          {profileFields.map(f => f.value ? (
            <div key={f.label} className="grid grid-cols-2 gap-4 py-3.5 border-b border-stone">
              <p className="text-xs text-muted font-body">{f.label}</p>
              <p className="text-sm text-ink font-body capitalize">{String(f.value)}</p>
            </div>
          ) : null)}
        </div>
      </Card>

      {/* Specialties */}
      {trainer?.specialties?.length > 0 && (
        <Card>
          <p className="text-[10px] tracking-widest uppercase text-muted mb-4 font-body">Specialties</p>
          <div className="flex flex-wrap gap-2">
            {trainer.specialties.map((s: string) => (
              <span key={s} className="text-xs bg-stone text-muted px-3 py-1.5 font-body">{s}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Bio */}
      {trainer?.short_bio && (
        <Card>
          <p className="text-[10px] tracking-widest uppercase text-muted mb-3 font-body">Bio</p>
          <p className="text-sm text-ink font-body leading-relaxed">{trainer.short_bio}</p>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <p className="text-[10px] tracking-widest uppercase text-muted mb-4 font-body">
          Documents & Compliance
        </p>
        {docs.length > 0 ? (
          <div className="space-y-0 border-t border-stone">
            {docs.map((doc: any) => {
              const expiring = doc.expiry_date &&
                new Date(doc.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              return (
                <div key={doc.id} className="grid grid-cols-3 gap-4 py-3.5 border-b border-stone">
                  <p className="text-xs text-muted font-body capitalize">
                    {doc.doc_type?.replace(/_/g, " ")}
                  </p>
                  <p className={`text-xs font-body ${expiring ? "text-red-500" : "text-ink"}`}>
                    {doc.expiry_date ? `Expires ${formatDate(doc.expiry_date)}` : "No expiry"}
                  </p>
                  <Badge status={doc.approval_status} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted text-sm font-body">No documents uploaded yet.</p>
        )}
      </Card>
    </div>
  );
}