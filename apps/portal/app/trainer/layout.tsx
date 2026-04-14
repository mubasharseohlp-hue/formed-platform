import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TrainerSidebar from "@/components/trainer/TrainerSidebar";
import TrainerTopBar from "@/components/trainer/TrainerTopBar";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Verify role
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "trainer") redirect("/dashboard");

  // Fetch trainer profile
  const { data: trainer } = await supabase
    .from("trainers")
    .select(`
      id, full_name, status, tier, headshot_url,
      current_client_count, max_active_clients,
      compliance_flag, onboarding_status
    `)
    .eq("user_id", user.id)
    .single();

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <TrainerSidebar trainer={trainer} userEmail={user.email ?? ""} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TrainerTopBar trainer={trainer} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}