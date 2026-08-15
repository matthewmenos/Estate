import Image from "next/image";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import InquiryForm from "@/components/InquiryForm";
import VerifiedSeal from "@/components/VerifiedSeal";
import WhatsAppButton from "@/components/WhatsAppButton";
import ViewCounter from "@/components/ViewCounter";

async function getProperty(id: string) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_media(url, thumb_url, medium_url, sort_order), profiles(verification_status, phone)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);
  if (!property) return { title: "Listing not found — Accra Rentals" };

  const photos = (property.property_media ?? []).sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );
  const description = `${property.property_type} for ${property.listing_type} in ${property.address}, ${property.city}. ${property.currency} ${Number(property.price).toLocaleString()}${property.listing_type === "rent" ? "/month" : ""}.`;

  return {
    title: `${property.title} — Accra Rentals`,
    description,
    openGraph: {
      title: property.title,
      description,
      images: photos[0]?.medium_url || photos[0]?.url ? [photos[0].medium_url || photos[0].url] : [],
    },
  };
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);
  if (!property) notFound();

  const photos = (property.property_media ?? []).sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );
  const verified = (property as any).profiles?.verification_status === "verified";
  const ownerPhone = (property as any).profiles?.phone as string | null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <ViewCounter propertyId={property.id} />
      <div className="relative">
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 mb-8 rounded-sm overflow-hidden">
            <div className="relative h-72 col-span-2 sm:col-span-1">
              <Image src={photos[0].medium_url || photos[0].url} alt={property.title} fill className="object-cover" />
            </div>
            <div className="hidden sm:grid grid-rows-2 gap-2 h-72">
              {photos.slice(1, 3).map((p: any, i: number) => (
                <div key={i} className="relative h-full">
                  <Image src={p.medium_url || p.url} alt={property.title} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-72 bg-ink/5 rounded-sm mb-8" />
        )}
        {verified && (
          <div className="absolute top-3 right-3 drop-shadow">
            <VerifiedSeal size={72} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div className="sm:col-span-2">
          <span className="font-mono text-xs tracking-widest uppercase text-rust">
            {property.listing_type === "rent" ? "For rent" : "For sale"}
          </span>
          <h1 className="font-display text-3xl font-semibold text-ink mt-1">
            {property.title}
          </h1>
          <p className="text-slate mb-5">{property.address}, {property.city}</p>

          <p className="font-mono text-2xl font-semibold text-rust mb-6">
            {property.currency} {Number(property.price).toLocaleString()}
            {property.listing_type === "rent" && (
              <span className="text-sm font-normal text-slate"> /month</span>
            )}
          </p>

          <div className="flex gap-5 text-sm text-slate mb-8 pb-8 border-b border-ink/10">
            {property.bedrooms != null && <span>{property.bedrooms} bed</span>}
            {property.bathrooms != null && <span>{property.bathrooms} bath</span>}
            {property.size_sqm != null && <span>{property.size_sqm} sqm</span>}
          </div>

          {property.description && (
            <p className="text-ink/80 whitespace-pre-line leading-relaxed">
              {property.description}
            </p>
          )}
        </div>

        <div className="sm:col-span-1">
          <div className="bg-paper-raised border border-ink/10 rounded-sm p-5 sticky top-4">
            <h2 className="font-display font-semibold text-ink mb-3">Interested?</h2>
            {ownerPhone && (
              <div className="mb-3">
                <WhatsAppButton ownerPhone={ownerPhone} propertyTitle={property.title} />
              </div>
            )}
            <InquiryForm propertyId={property.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
