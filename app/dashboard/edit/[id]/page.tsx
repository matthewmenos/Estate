"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import PhotoManager from "@/components/PhotoManager";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    area: "",
    city: "",
    property_type: "house",
    listing_type: "rent",
    price: "",
    currency: "GHS",
    bedrooms: "",
    bathrooms: "",
    size_sqm: "",
    status: "available",
  });
  const [loading, setLoading] = useState(true);
  const [initialStatus, setInitialStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabaseBrowser
        .from("properties")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setError("Listing not found, or you don't have access to it.");
        setLoading(false);
        return;
      }

      setForm({
        title: data.title ?? "",
        description: data.description ?? "",
        address: data.address ?? "",
        area: data.area ?? "",
        city: data.city ?? "",
        property_type: data.property_type ?? "house",
        listing_type: data.listing_type ?? "rent",
        price: String(data.price ?? ""),
        currency: data.currency ?? "GHS",
        bedrooms: data.bedrooms != null ? String(data.bedrooms) : "",
        bathrooms: data.bathrooms != null ? String(data.bathrooms) : "",
        size_sqm: data.size_sqm != null ? String(data.size_sqm) : "",
        status: data.status ?? "available",
      });
      setInitialStatus(data.status ?? "available");
      setLoading(false);
    }
    load();
  }, [params.id, router]);

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // RLS ("Owners manage their own properties") ensures this only succeeds
    // if the logged-in user actually owns this row.
    const updatePayload: Record<string, any> = {
      title: form.title,
      description: form.description || null,
      address: form.address,
      area: form.area || null,
      city: form.city,
      property_type: form.property_type,
      listing_type: form.listing_type,
      price: Number(form.price),
      currency: form.currency,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
      status: form.status,
      updated_at: new Date().toISOString(),
    };
    // If this save relists a previously-unavailable property, clear
    // alert_sent so the search-alerts cron treats it as newly available
    // again — without this, someone who relists after a few months would
    // never re-trigger matching renters' saved alerts.
    if (form.status === "available" && initialStatus !== "available") {
      updatePayload.alert_sent = false;
    }

    const { error } = await supabaseBrowser
      .from("properties")
      .update(updatePayload)
      .eq("id", params.id);

    // Re-geocode in the background — best-effort, never blocks the save.
    fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: form.address, city: form.city }),
    })
      .then((r) => r.json())
      .then(({ coords }) => {
        if (coords) {
          supabaseBrowser
            .from("properties")
            .update({ latitude: coords.lat, longitude: coords.lng })
            .eq("id", params.id);
        }
      })
      .catch(() => {});

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/properties/${params.id}`);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this listing permanently? This can't be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    const { error } = await supabaseBrowser
      .from("properties")
      .delete()
      .eq("id", params.id);

    setDeleting(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  if (loading) {
    return <main className="mx-auto max-w-xl px-4 py-8 text-sm text-slate">Loading…</main>;
  }

  if (error && !form.title) {
    return <main className="mx-auto max-w-xl px-4 py-8 text-sm text-red-600">{error}</main>;
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink mb-6">Edit listing</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            required
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.property_type}
              onChange={(e) => updateField("property_type", e.target.value)}
              className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
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
              className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
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
              className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="sold">Sold</option>
              <option value="unlisted">Unlisted</option>
            </select>
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
              className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bathrooms</label>
            <input
              type="number"
              min="0"
              value={form.bathrooms}
              onChange={(e) => updateField("bathrooms", e.target.value)}
              className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-rust text-paper-raised py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border border-red-300 text-red-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <PhotoManager propertyId={params.id} />
      </div>
    </main>
  );
}
