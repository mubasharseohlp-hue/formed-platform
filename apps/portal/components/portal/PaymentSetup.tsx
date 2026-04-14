"use client";

import { useState, useEffect } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createClient } from "@/lib/supabase/client";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const CARD_STYLE = {
  style: {
    base: {
      color:           "#0C0C0B",
      fontFamily:      "DM Sans, system-ui, sans-serif",
      fontSmoothing:   "antialiased",
      fontSize:        "14px",
      "::placeholder": { color: "#8C8880" },
    },
    invalid: { color: "#A32D2D", iconColor: "#A32D2D" },
  },
};

function SetupForm({ clientId, onSuccess }: { clientId: string; onSuccess: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const supabase = createClient();

  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [clientSecret,  setClientSecret]  = useState("");

  useEffect(() => {
   const fetchSecret = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  console.log('=== DEBUG INFO ===');
  console.log('Session exists:', !!session);
  console.log('Token exists:', !!token);
  console.log('User email:', session?.user?.email);
  console.log('Token value:', token ? token.substring(0, 50) + '...' : 'null');
  
  if (!token) {
    console.error('No token found! User may not be logged in.');
    setError('Please log in again');
    return;
  }

  try {
    const response = await fetch('http://localhost:4000/api/payments/setup-intent', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    console.log('Response status:', response.status);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response data:', data);
      if (data.client_secret) {
        setClientSecret(data.client_secret);
      } else if (data.error) {
        setError(data.error);
      }
    } else {
      const text = await response.text();
      console.log('Non-JSON response:', text.substring(0, 200));
      setError('Server error. Please try again.');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    setError('Failed to connect to payment service');
  }
};

    fetchSecret();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    setError("");

    const card = elements.getElement(CardElement);
    if (!card) return;

    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
      clientSecret,
      { payment_method: { card } }
    );

    if (stripeError) {
      setError(stripeError.message ?? "Card setup failed");
      setLoading(false);
      return;
    }

    if (setupIntent?.status === "succeeded") {
      // Mark payment method on file in DB
      await supabase
        .from("client_onboarding")
        .update({
          payment_method_on_file:  true,
          payment_method_added_at: new Date().toISOString(),
        })
        .eq("client_id", clientId);

      onSuccess();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="border border-stone p-4 bg-white">
        <CardElement options={CARD_STYLE} />
      </div>

      {error && (
        <p className="text-red-500 text-xs font-body">{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading || !clientSecret}
        className="w-full bg-ink text-cream text-[10px] tracking-widest uppercase font-body py-3.5 hover:bg-accent transition-colors disabled:opacity-50"
      >
        {loading ? "Saving card..." : "Save Payment Method"}
      </button>

      <p className="text-[10px] text-muted font-body text-center">
        Your card is saved securely via Stripe. You will only be charged
        after a session is confirmed.
      </p>
    </form>
  );
}

interface PaymentSetupProps {
  clientId: string;
  onSuccess: () => void;
}

export default function PaymentSetup({ clientId, onSuccess }: PaymentSetupProps) {
  return (
    <Elements stripe={stripePromise}>
      <SetupForm clientId={clientId} onSuccess={onSuccess} />
    </Elements>
  );
}