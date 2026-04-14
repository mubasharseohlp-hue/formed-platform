import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SectionHeader from "@/components/portal/ui/SectionHeader";
import Card from "@/components/portal/ui/Card";
import { formatDate } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: client } = await supabase
    .from("clients")
    .select(`*, client_intake(*)`)
    .eq("user_id", user.id)
    .single();

  const intake = client?.client_intake;

  const fields = [
    { label: "Full Name",   value: client?.full_name },
    { label: "Email",       value: user.email },
    { label: "Phone",       value: client?.phone },
    { label: "City",        value: client?.city },
    { label: "ZIP Code",    value: client?.zip_code },
    { label: "Member Since", value: client?.created_at ? formatDate(client.created_at) : null },
  ];

  const intakeFields = intake ? [
    { label: "Primary Goals",     value: intake.primary_goals?.join(", ") },
    { label: "Training History",  value: intake.training_history },
    { label: "Injuries",          value: intake.injuries ?? "None reported" },
    { label: "Coaching Intensity", value: intake.coaching_intensity },
    { label: "Communication Pref.", value: intake.communication_preference },
  ] : [];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <SectionHeader
        title="My Profile"
        subtitle="Your personal information and fitness preferences"
      />

      {/* Personal info */}
      <Card>
        <p className="text-[10px] tracking-widest uppercase text-muted mb-5 font-body">
          Personal Information
        </p>
        <div className="space-y-0 border-t border-stone">
          {fields.map(f => f.value ? (
            <div key={f.label} className="grid grid-cols-2 gap-4 py-3.5 border-b border-stone">
              <p className="text-xs text-muted font-body">{f.label}</p>
              <p className="text-sm text-ink font-body">{f.value}</p>
            </div>
          ) : null)}
        </div>
      </Card>

      {/* Intake form data */}
      {intake && (
        <Card>
          <p className="text-[10px] tracking-widest uppercase text-muted mb-5 font-body">
            Health & Fitness Profile
          </p>
          <div className="space-y-0 border-t border-stone">
            {intakeFields.map(f => f.value ? (
              <div key={f.label} className="grid grid-cols-2 gap-4 py-3.5 border-b border-stone">
                <p className="text-xs text-muted font-body">{f.label}</p>
                <p className="text-sm text-ink font-body">{f.value}</p>
              </div>
            ) : null)}
          </div>
          <p className="text-xs text-muted font-body mt-4">
            To update your health information, contact support.
          </p>
        </Card>
      )}
    </div>
  );
}