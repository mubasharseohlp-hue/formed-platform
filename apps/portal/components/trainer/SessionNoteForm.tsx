"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SessionNoteFormProps {
  sessionId: string;
  trainerId: string;
  sessionDate: string;
}

const RPE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);
const ENERGY_OPTIONS = ["Low", "Moderate", "High", "Excellent"];

export default function SessionNoteForm({ sessionId, trainerId, sessionDate }: SessionNoteFormProps) {
  const supabase = createClient();
  const router   = useRouter();

  const [form, setForm] = useState({
    exercises_completed:  "",
    intensity_rpe:        5,
    client_energy_level:  "Moderate",
    wins_improvements:    "",
    limitations_pain:     "",
    homework_habits:      "",
    next_session_focus:   "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.exercises_completed || !form.wins_improvements || !form.next_session_focus) {
      setError("Please fill in exercises, wins, and next session focus.");
      return;
    }

    setLoading(true);
    setError("");

    const sessionTime = new Date(sessionDate);
    const now = new Date();
    const hoursElapsed = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);

    const { error: insertError } = await supabase
      .from("session_notes")
      .insert({
        session_id:          sessionId,
        trainer_id:          trainerId,
        ...form,
        is_late:             hoursElapsed > 12,
        submitted_at:        now.toISOString(),
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    await supabase
      .from("sessions")
      .update({ notes_submitted: true, notes_submitted_at: now.toISOString() })
      .eq("id", sessionId);

    router.push("/trainer/notes");
    router.refresh();
  };

  const field = "w-full border-b border-stone bg-transparent py-2.5 text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:border-ink transition-colors font-body";
  const label = "block text-[10px] tracking-widest uppercase text-muted mb-2 font-body";

  return (
    <form onSubmit={handleSubmit} className="space-y-7 bg-white border border-stone p-6 lg:p-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 font-body">
          {error}
        </div>
      )}

      <div>
        <label className={label}>Exercises Completed *</label>
        <textarea rows={3} className={`${field} resize-none`}
          placeholder="List exercises, sets, reps..."
          value={form.exercises_completed}
          onChange={e => set("exercises_completed", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={label}>Intensity (RPE) *</label>
          <div className="flex gap-1.5 flex-wrap">
            {RPE_OPTIONS.map(n => (
              <button key={n} type="button"
                onClick={() => set("intensity_rpe", n)}
                className={`w-8 h-8 text-xs font-body transition-colors ${
                  form.intensity_rpe === n
                    ? "bg-ink text-cream"
                    : "bg-stone text-muted hover:bg-warm"
                }`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={label}>Client Energy *</label>
          <div className="space-y-1.5">
            {ENERGY_OPTIONS.map(e => (
              <label key={e} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="energy"
                  checked={form.client_energy_level === e}
                  onChange={() => set("client_energy_level", e)}
                  className="accent-ink w-3 h-3" />
                <span className="text-sm font-body text-ink">{e}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={label}>Wins / Improvements *</label>
        <textarea rows={2} className={`${field} resize-none`}
          placeholder="What went well? Any PBs or breakthroughs?"
          value={form.wins_improvements}
          onChange={e => set("wins_improvements", e.target.value)} />
      </div>

      <div>
        <label className={label}>Limitations / Pain</label>
        <textarea rows={2} className={`${field} resize-none`}
          placeholder="Any pain, discomfort, or movement limitations noted..."
          value={form.limitations_pain}
          onChange={e => set("limitations_pain", e.target.value)} />
      </div>

      <div>
        <label className={label}>Homework / Habits Assigned</label>
        <input className={field}
          placeholder="Stretches, habits, nutrition notes..."
          value={form.homework_habits}
          onChange={e => set("homework_habits", e.target.value)} />
      </div>

      <div>
        <label className={label}>Next Session Focus *</label>
        <input className={field}
          placeholder="What will you prioritise next session?"
          value={form.next_session_focus}
          onChange={e => set("next_session_focus", e.target.value)} />
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-ink text-cream text-[10px] tracking-widest uppercase font-body py-4 hover:bg-accent transition-colors disabled:opacity-50">
        {loading ? "Submitting..." : "Submit Session Notes"}
      </button>

      <p className="text-[10px] text-muted font-body text-center">
        Notes must be submitted within 12 hours of the session.
      </p>
    </form>
  );
}