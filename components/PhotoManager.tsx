"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type Photo = {
  id: string;
  url: string;
  thumb_url: string | null;
  sort_order: number;
};

export default function PhotoManager({ propertyId }: { propertyId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabaseBrowser
      .from("property_media")
      .select("id, url, thumb_url, sort_order")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true });
    setPhotos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      let nextOrder = photos.length;
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        body.append("propertyId", propertyId);
        const res = await fetch("/api/upload", { method: "POST", body });
        if (!res.ok) throw new Error("Upload failed");
        const { original, thumb, medium } = await res.json();

        await supabaseBrowser.from("property_media").insert({
          property_id: propertyId,
          url: original,
          thumb_url: thumb,
          medium_url: medium,
          media_type: "image",
          sort_order: nextOrder++,
        });
      }
      await load();
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemove(id: string) {
    await supabaseBrowser.from("property_media").delete().eq("id", id);
    setPhotos((p) => p.filter((photo) => photo.id !== id));
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;

    const reordered = [...photos];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setPhotos(reordered);

    // Persist new sort_order for the two swapped rows.
    await Promise.all([
      supabaseBrowser.from("property_media").update({ sort_order: index }).eq("id", reordered[index].id),
      supabaseBrowser.from("property_media").update({ sort_order: target }).eq("id", reordered[target].id),
    ]);
  }

  if (loading) return <p className="text-sm text-slate">Loading photos…</p>;

  return (
    <div className="border border-ink/10 bg-paper-raised rounded-sm p-4">
      <h2 className="font-display font-semibold text-ink mb-3">Photos</h2>

      {photos.length === 0 ? (
        <p className="text-sm text-slate mb-3">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {photos.map((p, i) => (
            <div key={p.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumb_url || p.url}
                alt={`Photo ${i + 1}`}
                className="h-20 w-full object-cover rounded-sm"
              />
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors rounded-sm flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="bg-paper-raised text-ink w-6 h-6 rounded-full text-xs disabled:opacity-30"
                  title="Move earlier"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(p.id)}
                  className="bg-rust text-paper-raised w-6 h-6 rounded-full text-xs"
                  title="Remove"
                >
                  ×
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === photos.length - 1}
                  className="bg-paper-raised text-ink w-6 h-6 rounded-full text-xs disabled:opacity-30"
                  title="Move later"
                >
                  →
                </button>
              </div>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-gold text-ink text-[10px] px-1.5 py-0.5 rounded-sm font-medium">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <label className="inline-block text-sm text-rust font-medium cursor-pointer hover:underline">
        {uploading ? "Uploading…" : "+ Add photos"}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleAdd}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="text-sm text-rust mt-2">{error}</p>}
    </div>
  );
}
