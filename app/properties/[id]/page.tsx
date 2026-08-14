import Image from "next/image";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import InquiryForm from "@/components/InquiryForm";

async function getProperty(id: string) {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_media(url, sort_order)")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);
  if (!property) notFound();

  const photos = (property.property_media ?? []).sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 mb-6 rounded-lg overflow-hidden">
          <div className="relative h-72 col-span-2 sm:col-span-1">
            <Image src={photos[0].url} alt={property.title} fill className="object-cover" />
          </div>
          <div className="hidden sm:grid grid-rows-2 gap-2 h-72">
            {photos.slice(1, 3).map((p: any, i: number) => (
              <div key={i} className="relative h-full">
                <Image src={p.url} alt={property.title} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-72 bg-gray-200 rounded-lg mb-6" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="sm:col-span-2">
          <h1 className="text-2xl font-bold">{property.title}</h1>
          <p className="text-gray-500 mb-4">{property.address}, {property.city}</p>

          <p className="text-xl font-bold text-brand mb-4">
            {property.currency} {Number(property.price).toLocaleString()}
            {property.listing_type === "rent" && (
              <span className="text-sm font-normal text-gray-500"> /month</span>
            )}
          </p>

          <div className="flex gap-4 text-sm text-gray-600 mb-6">
            {property.bedrooms != null && <span>{property.bedrooms} bed</span>}
            {property.bathrooms != null && <span>{property.bathrooms} bath</span>}
            {property.size_sqm != null && <span>{property.size_sqm} sqm</span>}
          </div>

          {property.description && (
            <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
          )}
        </div>

        <div className="sm:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
            <h2 className="font-semibold mb-3">Interested?</h2>
            <InquiryForm propertyId={property.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
