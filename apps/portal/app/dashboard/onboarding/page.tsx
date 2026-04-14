"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import PaymentSetup from "@/components/portal/PaymentSetup";

// Add this type definition
type OnboardingStatus = {
  membership_agreement_signed?: boolean;
  liability_waiver_signed?: boolean;
  auto_bill_authorized?: boolean;
  health_intake_completed?: boolean;
  payment_method_on_file?: boolean;
  [key: string]: boolean | undefined; // Index signature for dynamic keys
};

const steps = [
  {
    key:         "membership_agreement_signed",
    title:       "Membership Agreement",
    description: "Review and accept the FORMED membership agreement.",
    actionLabel: "Accept Agreement",
  },
  {
    key:         "liability_waiver_signed",
    title:       "Liability Waiver",
    description: "Acknowledge the inherent risks of physical training.",
    actionLabel: "Accept Waiver",
  },
  {
    key:         "auto_bill_authorized",
    title:       "Billing Authorization",
    description: "Authorize automatic billing for your membership.",
    actionLabel: "Authorize Billing",
  },
  {
    key:         "health_intake_completed",
    title:       "Health Intake Form",
    description: "Tell us about your health history and fitness goals.",
    actionLabel: "Mark Complete",
  },
  {
    key:         "payment_method_on_file",
    title:       "Payment Method",
    description: "Add a payment method to your account.",
    actionLabel: "Add Card",
  },
];

export default function OnboardingPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [onboarding,  setOnboarding]  = useState<OnboardingStatus>({});
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState<string | null>(null);
  const [clientId,    setClientId]    = useState<string | null>(null);
  const [showStripe,  setShowStripe]  = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("id, client_onboarding(*)")
        .eq("user_id", user.id)
        .single();

      if (client) {
        setClientId(client.id);
        const ob = Array.isArray(client.client_onboarding)
          ? client.client_onboarding[0]
          : client.client_onboarding;
        setOnboarding(ob ?? {});
      }
      setLoading(false);
    };
    load();
  }, []);

  const complete = (key: string) => !!onboarding[key];
  const completedCount = steps.filter(s => complete(s.key)).length;
  const allDone = completedCount === steps.length;

  const handleAccept = async (key: string) => {
    if (!clientId) return;

    // Payment method handled separately via Stripe
    if (key === "payment_method_on_file") {
      setShowStripe(true);
      return;
    }

    setSaving(key);

    const update: Record<string, unknown> = {
      [key]:            true,
      [`${key}_at`]:    new Date().toISOString(),
    };

    const updatedOnboarding: OnboardingStatus = { ...onboarding, [key]: true };
    const allComplete = steps.every(s => updatedOnboarding[s.key]);
    if (allComplete) update.completed_at = new Date().toISOString();

    await supabase
      .from("client_onboarding")
      .update(update)
      .eq("client_id", clientId);

    if (allComplete) {
      await supabase
        .from("clients")
        .update({ status: "ready_for_match" })
        .eq("id", clientId);
    }

    setOnboarding(prev => ({ ...prev, [key]: true }));
    setSaving(null);
  };

  const handleCardSuccess = async () => {
    setShowStripe(false);

    const updatedOnboarding: OnboardingStatus = { ...onboarding, payment_method_on_file: true };
    setOnboarding(updatedOnboarding);

    const allComplete = steps.every(s => updatedOnboarding[s.key]);
    if (allComplete && clientId) {
      await supabase
        .from("client_onboarding")
        .update({ completed_at: new Date().toISOString() })
        .eq("client_id", clientId);

      await supabase
        .from("clients")
        .update({ status: "ready_for_match" })
        .eq("id", clientId);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-widest uppercase text-muted font-body mb-1">Setup</p>
        <h1 className="font-display text-3xl font-light text-ink mb-2">
          Complete Your Onboarding
        </h1>
        <p className="text-muted text-sm font-body leading-relaxed">
          Complete all 5 steps to get matched with your trainer.
        </p>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex-1 h-1 bg-stone">
            <div
              className="h-1 bg-ink transition-all duration-700"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-body text-muted flex-shrink-0">
            {completedCount} / {steps.length}
          </span>
        </div>
      </div>

      {/* All done */}
      {allDone && (
        <div className="bg-ink text-cream p-8 mb-8 text-center">
          <div className="w-12 h-12 bg-cream/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={20} className="text-cream" />
          </div>
          <p className="font-display text-2xl font-light mb-2">Onboarding complete!</p>
          <p className="text-cream/60 text-sm font-body mb-6">
            Your profile is ready for matching. Our team will be in touch within 24–48 hours.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-cream text-ink text-[10px] tracking-widest uppercase font-body px-8 py-3 hover:bg-stone transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const done     = complete(step.key);
          const isSaving = saving === step.key;
          const isPayment = step.key === "payment_method_on_file";

          return (
            <div key={step.key}
              className={cn(
                "border p-6 transition-all duration-200 bg-white",
                done ? "border-stone" : "border-stone hover:border-warm"
              )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  done ? "bg-ink" : "border border-stone bg-cream"
                )}>
                  {done ? (
                    <Check size={13} className="text-cream" />
                  ) : (
                    <span className="text-muted text-xs font-body">{i + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className={cn(
                        "font-body text-sm font-medium",
                        done ? "text-muted line-through" : "text-ink"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-muted text-xs font-body mt-0.5">
                        {step.description}
                      </p>
                    </div>

                    {!done && !showStripe && (
                      <button
                        onClick={() => handleAccept(step.key)}
                        disabled={!!saving}
                        className="flex-shrink-0 bg-ink text-cream text-[10px] tracking-widest uppercase font-body px-5 py-2.5 hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : step.actionLabel}
                      </button>
                    )}
                  </div>

                  {/* Stripe card form inline */}
                  {isPayment && showStripe && !done && clientId && (
                    <div className="mt-4">
                      <PaymentSetup
                        clientId={clientId}
                        onSuccess={handleCardSuccess}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}