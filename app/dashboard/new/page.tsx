"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

type PendingPhoto = { file: File; previewUrl: string };

export default function NewListingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    city: "Accra",
    property_type: "house",
    listing_type: "rent",
    price: "",
    currency: "GHS",
    bedrooms: "",
    bathrooms: "",
    size_sqm: "",
  });
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPhotos = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((p) => [...p, ...newPhotos].slice(0, 10)); // cap at 10 photos
  }

  function removePhoto(index: number) {
    setPhotos((p) => p.filter((_, i) => i !== index));
  }

  async function uploadPhoto(propertyId: string, photo: PendingPhoto, sortOrder: number) {
    // 1. Ask our API for a presigned R2 upload URL
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        fileName: photo.file.name,
        contentType: photo.file.type,
      }),
    });
    if (!res.ok) throw new Error("Failed to get upload URL");
    const { uploadUrl, publicUrl, key } = await res.json();

    // 2. Upload the file directly to R2 (never touches our server)
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": photo.file.type },
      body: photo.file,
    });
    if (!putRes.ok) throw new Error("Failed to upload photo to storage");

    // 3. Record the photo against the property
    const { error } = await supabaseBrowser.from("property_media").insert({
      property_id: propertyId,
      url: publicUrl,
      r2_key: key,
      media_type: "image",
      sort_order: sortOrder,
    });
    if (error) throw error;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const ownerId = userData.user?.id;
      if (!ownerId) {
        setError("You need to be logged in to create a listing.");
        setSubmitting(false);
        router.push("/login");
        return;
      }

      // 1. Create the property row
      const { data: property, error: insertError } = await supabaseBrowser
        .from("properties")
        .insert({
          owner_id: ownerId,
          title: form.title,
          description: form.description || null,
          address: form.address,
          city: form.city,
          property_type: form.property_type,
          listing_type: form.listing_type,
          price: Number(form.price),
          currency: form.currency,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
          size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Upload photos (sequentially — simplest to reason about for an MVP)
      for (let i = 0; i < photos.length; i++) {
        await uploadPhoto(property.id, photos[i], i);
      }

      router.push(`/properties/${property.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-xl font-bold text-brand-dark mb-6">List a property</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="3-bedroom house in East Legon"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            required
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Street / area"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.property_type}
              onChange={(e) => updateField("property_type", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Listing type</label>
            <select
              value={form.listing_type}
              onChange={(e) => updateField("listing_type", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="rent">For rent</option>
              <option value="sale">For sale</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price (GHS)</label>
            <input
              required
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Size (sqm)</label>
            <input
              type="number"
              min="0"
              value={form.size_sqm}
              onChange={(e) => updateField("size_sqm", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bedrooms</label>
            <input
              type="number"
              min="0"
              value={form.bedrooms}
              onChange={(e) => updateField("bedrooms", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bathrooms</label>
            <input
              type="number"
              min="0"
              value={form.bathrooms}
              onChange={(e) => updateField("bathrooms", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="text-sm"
          />
          {photos.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.previewUrl}
                    alt={`Photo ${i + 1}`}
                    className="h-16 w-full object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs leading-5"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Publishing…" : "Publish listing"}
        </button>
      </form>
    </main>
  );
}
