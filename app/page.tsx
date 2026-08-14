import Image from "next/image";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";

export const revalidate = 60; // re-fetch listings at most once a minute

async function getListings() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, address, city, price, currency, listing_type, bedrooms, property_media(url, sort_order)")
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
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Accra Rentals</h1>
          <p className="text-gray-600">Find or list a property in Accra.</p>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-brand-dark border border-brand-dark rounded-md px-3 py-1.5"
        >
          Owner login
        </Link>
      </header>

      {listings.length === 0 ? (
        <p className="text-gray-500">No listings yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {listings.map((property: any) => {
            const cover = property.property_media?.sort(
              (a: any, b: any) => a.sort_order - b.sort_order
            )[0];
            return (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-40 bg-gray-200">
                  {cover?.url && (
                    <Image
                      src={cover.url}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold truncate">{property.title}</h2>
                  <p className="text-sm text-gray-500">{property.address}, {property.city}</p>
                  <p className="mt-2 font-bold text-brand">
                    {property.currency} {Number(property.price).toLocaleString()}
                    {property.listing_type === "rent" && <span className="text-sm font-normal text-gray-500"> /month</span>}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
