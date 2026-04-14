import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Personal Training Tampa Bay",
  description:
    "Private in-home personal training across Tampa Bay. Serving Downtown Tampa, Hyde Park, South Tampa, Channelside, Westshore and surrounding areas.",
};

const areas = [
  "Downtown Tampa",
  "Hyde Park",
  "Channelside",
  "Westshore",
  "South Tampa",
  "Davis Islands",
  "Palma Ceia",
  "Seminole Heights",
  "Harbour Island",
  "Surrounding neighbourhoods",
];

const reasons = [
  {
    title: "No driving in traffic",
    description:
      "Your trainer comes to you. No commute, no parking, no wasted time.",
  },
  {
    title: "No crowded gyms",
    description:
      "Train in complete privacy — your home, your condo gym, or any private space.",
  },
  {
    title: "Flexible scheduling",
    description:
      "Early morning, midday, or evening — we build around your calendar.",
  },
  {
    title: "Consistent trainer",
    description:
      "Same trainer every session. Continuity is the foundation of real results.",
  },
];

const partnerships = [
  "Luxury apartment communities",
  "Corporate offices & executive teams",
  "Private clubs & residences",
  "Hotels & hospitality",
];

export default function TampaPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero — Tampa skyline */}
        <section className="relative h-[80vh] min-h-[560px] flex items-end overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=1920&auto=format&fit=crop&q=80"
              alt="Tampa Bay"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-ink/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
          </div>
          <div className="relative z-10 max-w-screen-xl mx-auto px-6 lg:px-10 pb-16 lg:pb-24 w-full">
            <p className="text-[10px] tracking-ultra uppercase text-cream/50 mb-3 font-body">
              Tampa Bay
            </p>
            <h1
              className="font-display font-light text-cream leading-tight max-w-3xl"
              style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
            >
              Personal training,{" "}
              <em className="italic font-light text-warm">
                delivered in Tampa Bay.
              </em>
            </h1>
            <p className="mt-6 text-cream/60 text-base max-w-xl font-body font-light leading-relaxed">
              Private, in-home personal training for Tampa Bay professionals
              who value their time.
            </p>
          </div>
        </section>

        {/* Areas we serve */}
        <section className="bg-cream py-24 lg:py-36">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32">
              <div>
                <p className="text-[10px] tracking-ultra uppercase text-muted mb-6 font-body">
                  Areas We Serve
                </p>
                <div className="space-y-0 border-t border-stone">
                  {areas.map((area) => (
                    <div
                      key={area}
                      className="flex items-center gap-4 py-4 border-b border-stone"
                    >
                      <span className="w-1 h-1 rounded-full bg-warm flex-shrink-0" />
                      <span className="text-ink text-sm font-body">{area}</span>
                    </div>
                  ))}
                </div>
                <p className="text-muted text-xs font-body mt-6 tracking-wide">
                  Not sure if we serve your area? Apply and we&apos;ll confirm availability.
                </p>
              </div>

              <div>
                <p className="text-[10px] tracking-ultra uppercase text-muted mb-6 font-body">
                  Why Tampa Professionals Choose FORMED
                </p>
                <div className="space-y-0">
                  {reasons.map((r, i) => (
                    <div
                      key={r.title}
                      className={`py-8 ${
                        i < reasons.length - 1 ? "border-b border-stone" : ""
                      }`}
                    >
                      <h3 className="font-display text-xl font-medium text-ink mb-2">
                        {r.title}
                      </h3>
                      <p className="text-muted text-sm leading-relaxed font-body">
                        {r.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-10">
                  <Button href="/apply" size="lg">
                    Check Availability
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Image divider */}
        <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=1920&auto=format&fit=crop&q=80"
            alt="In-home personal training"
            fill
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-ink/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className="font-display font-light text-cream text-center px-6"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            >
              We bring the trainer to{" "}
              <em className="italic text-warm">you.</em>
            </p>
          </div>
        </div>

        {/* Corporate & Partnerships */}
        <section className="bg-ink py-24 lg:py-36">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start">
              <div>
                <p className="text-[10px] tracking-ultra uppercase text-warm/40 mb-4 font-body">
                  Corporate Wellness
                </p>
                <h2 className="font-display text-4xl font-light text-cream mb-6 leading-tight">
                  Private on-site training for teams.
                </h2>
                <p className="text-cream/50 text-sm leading-relaxed mb-8 font-body">
                  Available for executive teams and leadership groups across
                  Tampa Bay. Contact us to discuss scheduling and availability.
                </p>
                
                 <a href="mailto:hello@formed.fit"
                  className="text-[10px] tracking-ultra uppercase text-warm hover:text-cream transition-colors font-body"
                >
                  hello@formed.fit &rarr;
                </a>
              </div>

              <div>
                <p className="text-[10px] tracking-ultra uppercase text-warm/40 mb-6 font-body">
                  We Partner With
                </p>
                <div className="space-y-0 border-t border-cream/10">
                  {partnerships.map((p) => (
                    <div
                      key={p}
                      className="flex items-center gap-4 py-4 border-b border-cream/10"
                    >
                      <span className="w-1 h-1 rounded-full bg-warm flex-shrink-0" />
                      <span className="text-cream/70 text-sm font-body">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Expansion footer strip */}
        <div className="bg-ink border-t border-cream/10 py-5 text-center">
          <p className="text-[10px] tracking-ultra uppercase text-muted font-body">
            Currently serving Tampa Bay &nbsp;·&nbsp; New cities launching soon
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}