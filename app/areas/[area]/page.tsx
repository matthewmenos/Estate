import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { deslugifyArea } from "@/lib/areaSlug";
import PropertyCard from "@/components/PropertyCard";

async function getListings(areaSlug: string) {
  const supabase = supabaseServer();
  const areaName = deslugifyArea(areaSlug);
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, title, address, area, city, price, currency, listing_type, property_media(url, thumb_url, sort_order), profiles(verification_status)"
    )
    .eq("status", "available")
    .ilike("area", areaName)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load area listings:", error);
    return [];
  }
  return data;
}

export async function generateMetadata({ params }: { params: { area: string } }) {
  const areaName = deslugifyArea(params.area);
  const title = `Properties for rent & sale in ${areaName} — Accra Rentals`;
  return {
    title,
    description: `Browse verified property listings in ${areaName}, Accra. Rentals and sales, listed directly by owners.`,
  };
}

export default async function AreaPage({ params }: { params: { area: string } }) {
  const areaName = deslugifyArea(params.area);
  const listings = await getListings(params.area);

  if (listings.length === 0) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="font-mono text-xs tracking-widest uppercase text-rust mb-2">Accra</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-2 capitalize">
        Properties in {areaName}
      </h1>
      <p className="text-slate mb-8">
        {listings.length} listing{listings.length === 1 ? "" : "s"} available in {areaName} right now.
      </p>

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
                coverUrl: cover?.thumb_url || cover?.url,
                verified: property.profiles?.verification_status === "verified",
              }}
            />
          );
        })}
      </div>
    </main>
  );
}
