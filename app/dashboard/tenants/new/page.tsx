"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

type Property = { id: string; title: string };

export default function NewTenantPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState({
    property_id: "",
    name: "",
    phone: "",
    lease_start: "",
    lease_end: "",
    rent_amount: "",
    rent_due_day: "1",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const { data } = await supabaseBrowser
        .from("properties")
        .select("id, title")
        .eq("owner_id", userData.user.id)
        .order("created_at", { ascending: false });
      setProperties(data ?? []);
      if (data && data.length > 0) {
        setForm((f) => ({ ...f, property_id: data[0].id }));
      }
    }
    load();
  }, [router]);

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { data: tenant, error: insertError } = await supabaseBrowser
      .from("tenants")
      .insert({
        property_id: form.property_id,
        name: form.name,
        phone: form.phone,
        lease_start: form.lease_start || null,
        lease_end: form.lease_end || null,
        rent_amount: Number(form.rent_amount),
        rent_due_day: Number(form.rent_due_day),
      })
      .select()
      .single();

    setSubmitting(false);
    if (insertError || !tenant) {
      setError(insertError?.message ?? "Something went wrong.");
      return;
    }

    // Also mark the property occupied, since a tenant now lives there.
    await supabaseBrowser
      .from("properties")
      .update({ status: "occupied" })
      .eq("id", form.property_id);

    router.push(`/dashboard/tenants/${tenant.id}`);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-xl font-bold text-ink mb-6">Add a tenant</h1>

      {properties.length === 0 ? (
        <p className="text-sm text-slate">
          You don't have any listings yet. Create a property listing first, then add a tenant to it.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Property</label>
            <select
              value={form.property_id}
              onChange={(e) => updateField("property_id", e.target.value)}
              className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Tenant name</label>
            <input
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Phone number</label>
            <input
              required
              type="tel"
              placeholder="024 123 4567"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate mt-1">
              Used for mobile money rent requests — make sure it's their MoMo number.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Lease start</label>
              <input
                type="date"
                value={form.lease_start}
                onChange={(e) => updateField("lease_start", e.target.value)}
                className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Lease end</label>
              <input
                type="date"
                value={form.lease_end}
                onChange={(e) => updateField("lease_end", e.target.value)}
                className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Monthly rent (GHS)</label>
              <input
                required
                type="number"
                min="0"
                value={form.rent_amount}
                onChange={(e) => updateField("rent_amount", e.target.value)}
                className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Rent due day</label>
              <input
                required
                type="number"
                min="1"
                max="28"
                value={form.rent_due_day}
                onChange={(e) => updateField("rent_due_day", e.target.value)}
                className="w-full rounded-sm border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && <p className="text-sm text-rust">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-rust text-paper-raised py-2 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Add tenant"}
          </button>
        </form>
      )}
    </main>
  );
}
