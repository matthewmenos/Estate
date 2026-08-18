import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import ListingsFilter from "@/components/ListingsFilter";
import TiltHouses from "@/components/TiltHouses";

export const revalidate = 60;

async function getListings() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, title, address, city, price, currency, listing_type, property_type, bedrooms, property_media(url, thumb_url, medium_url, sort_order), profiles(verification_status)"
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
      <section className="relative overflow-hidden border-b border-ink/10 min-h-[560px] sm:min-h-[640px] flex items-center">
        <TiltHouses variant="full" />
        <div
          className="absolute inset-0 bg-gradient-to-b from-paper/0 via-paper/10 to-paper pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust mb-5">
            Accra, Ghana
          </p>
          <h1 className="font-display text-hero text-ink max-w-2xl text-balance">
            List your property. Get verified. Be found.
          </h1>
          <p className="mt-6 text-slate max-w-lg text-lg leading-relaxed text-balance">
            A place for property owners in Accra to list rentals and sales
            directly — no agent fees, no middlemen, and a verification seal
            that tells renters you're the real owner.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-rust text-paper-raised px-5 py-3 text-sm font-medium shadow-soft hover:bg-rust-dark hover:shadow-raised hover:-translate-y-0.5 transition-all"
            >
              List your property
            </Link>
            <a
              href="#listings"
              className="rounded-full border border-ink text-ink px-5 py-3 text-sm font-medium hover:bg-ink hover:text-paper-raised hover:-translate-y-0.5 transition-all"
            >
              Browse listings
            </a>
          </div>
        </div>
      </section>

      {/* How it works — a real sequence, so numbering is earned */}
      <section className="mx-auto max-w-5xl px-4 py-16 border-b border-ink/10">
        <h2 className="font-display text-section text-ink mb-8 text-balance">
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
        <h2 className="font-display text-section text-ink mb-8">
          Available now
        </h2>

        {listings.length === 0 ? (
          <div className="border border-dashed border-ink/20 rounded-xl p-12 text-center">
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
          <ListingsFilter
            listings={listings.map((property: any) => {
              const cover = property.property_media?.sort(
                (a: any, b: any) => a.sort_order - b.sort_order
              )[0];
              return {
                ...property,
                coverUrl: cover?.thumb_url || cover?.url,
                verified: property.profiles?.verification_status === "verified",
              };
            })}
          />
        )}
      </section>
    </main>
  );
}
