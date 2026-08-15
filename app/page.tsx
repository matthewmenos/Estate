import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import PropertyCard from "@/components/PropertyCard";

export const revalidate = 60;

async function getListings() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, title, address, city, price, currency, listing_type, property_media(url, sort_order), profiles(verification_status)"
    )
    .eq("status", "available")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load listings:", error);
    return [];
  }
  return data;
}

export default async function HomePage() {
  const listings = await getListings();

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink/10">
        <svg
          className="absolute inset-x-0 bottom-0 w-full h-24 text-ink/[0.06]"
          viewBox="0 0 800 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 100 L0 60 L40 60 L40 30 L80 30 L80 60 L120 60 L120 20 L160 20 L160 60 L220 60 L220 40 L260 40 L260 60 L320 60 L320 10 L360 10 L360 60 L420 60 L420 45 L460 45 L460 60 L520 60 L520 25 L560 25 L560 60 L620 60 L620 15 L660 15 L660 60 L720 60 L720 50 L760 50 L760 60 L800 60 L800 100 Z"
            fill="currentColor"
          />
        </svg>
        <div className="relative mx-auto max-w-5xl px-4 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <p className="font-mono text-xs tracking-widest uppercase text-rust mb-4">
            Accra, Ghana
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink max-w-xl leading-tight">
            List your property. Get verified. Be found.
          </h1>
          <p className="mt-5 text-slate max-w-lg text-lg">
            A place for property owners in Accra to list rentals and sales
            directly — no agent fees, no middlemen, and a verification seal
            that tells renters you're the real owner.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-sm bg-rust text-paper-raised px-5 py-3 text-sm font-medium hover:bg-rust-dark transition-colors"
            >
              List your property
            </Link>
            <a
              href="#listings"
              className="rounded-sm border border-ink text-ink px-5 py-3 text-sm font-medium hover:bg-ink hover:text-paper-raised transition-colors"
            >
              Browse listings
            </a>
          </div>
        </div>
      </section>

      {/* How it works — a real sequence, so numbering is earned */}
      <section className="mx-auto max-w-5xl px-4 py-16 border-b border-ink/10">
        <h2 className="font-display text-2xl font-semibold text-ink mb-8">
          How it works for owners
        </h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              n: "01",
              title: "List your property",
              body: "Add your property's details and photos. Takes a few minutes, no agent required.",
            },
            {
              n: "02",
              title: "Get verified",
              body: "We confirm you're the real owner. Verified listings carry our seal, which renters trust.",
            },
            {
              n: "03",
              title: "Hear from renters",
              body: "Inquiries land directly in your dashboard, with the renter's name and phone number.",
            },
          ].map((step) => (
            <div key={step.n}>
              <p className="font-mono text-rust text-sm mb-2">{step.n}</p>
              <h3 className="font-display font-semibold text-ink mb-1.5">{step.title}</h3>
              <p className="text-sm text-slate">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Listings */}
      <section id="listings" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-2xl font-semibold text-ink mb-8">
          Available now
        </h2>

        {listings.length === 0 ? (
          <div className="border border-dashed border-ink/20 rounded-sm p-12 text-center">
            <p className="text-slate">
              No listings yet — be the first to list a property in Accra.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 text-rust font-medium hover:underline"
            >
              List your property →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {listings.map((property: any) => {
              const cover = property.property_media?.sort(
                (a: any, b: any) => a.sort_order - b.sort_order
              )[0];
              return (
                <PropertyCard
                  key={property.id}
                  property={{
                    ...property,
                    coverUrl: cover?.url,
                    verified: property.profiles?.verification_status === "verified",
                  }}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
