import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import InquiryForm from "@/components/InquiryForm";
import VerifiedSeal from "@/components/VerifiedSeal";
import WhatsAppButton from "@/components/WhatsAppButton";
import ViewCounter from "@/components/ViewCounter";
import PhotoGallery from "@/components/PhotoGallery";
import PropertyMap from "@/components/PropertyMap";
import SaveListingButton from "@/components/SaveListingButton";

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

async function getReviews(propertyId: string) {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  return data ?? [];
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
  const reviews = await getReviews(property.id);
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <ViewCounter propertyId={property.id} />
      <div className="relative">
        <PhotoGallery photos={photos} alt={property.title} />
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
          <p className="text-slate mb-1">
            {property.address}
            {property.area ? `, ${property.area}` : ""}, {property.city}
          </p>
          {avgRating != null && (
            <p className="text-sm text-gold mb-4">
              {"★".repeat(Math.round(avgRating))}
              {"☆".repeat(5 - Math.round(avgRating))}{" "}
              <span className="text-slate">
                {avgRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})
              </span>
            </p>
          )}

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
            <p className="text-ink/80 whitespace-pre-line leading-relaxed mb-8">
              {property.description}
            </p>
          )}

          {property.latitude != null && property.longitude != null && (
            <div className="mb-8">
              <h2 className="font-display font-semibold text-ink mb-3">Location</h2>
              <PropertyMap lat={property.latitude} lng={property.longitude} />
            </div>
          )}

          {reviews.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-ink mb-3">
                From past tenants
              </h2>
              <div className="space-y-4">
                {reviews.map((r, i) => (
                  <div key={i} className="border-b border-ink/10 pb-4">
                    <p className="text-gold text-sm">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </p>
                    {r.comment && <p className="text-sm text-ink/80 mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sm:col-span-1">
          <div className="bg-paper-raised border border-ink/10 rounded-xl p-5 sticky top-4 space-y-3">
            <h2 className="font-display font-semibold text-ink mb-1">Interested?</h2>
            <SaveListingButton propertyId={property.id} price={Number(property.price)} />
            {ownerPhone && (
              <WhatsAppButton ownerPhone={ownerPhone} propertyTitle={property.title} />
            )}
            <InquiryForm propertyId={property.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
