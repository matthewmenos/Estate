"use client";

import { useMemo, useState } from "react";
import PropertyCard from "./PropertyCard";

type Listing = {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  currency: string;
  listing_type: string;
  property_type: string;
  bedrooms: number | null;
  coverUrl?: string;
  verified?: boolean;
};

export default function ListingsFilter({ listings }: { listings: Listing[] }) {
  const [listingType, setListingType] = useState<"all" | "rent" | "sale">("all");
  const [minBeds, setMinBeds] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (listingType !== "all" && l.listing_type !== listingType) return false;
      if (minBeds !== "any" && (l.bedrooms ?? 0) < Number(minBeds)) return false;
      if (maxPrice && l.price > Number(maxPrice)) return false;
      return true;
    });
  }, [listings, listingType, minBeds, maxPrice]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-8 items-end">
        <div>
          <label className="block text-xs font-medium text-slate mb-1">Type</label>
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value as any)}
            className="rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="rent">For rent</option>
            <option value="sale">For sale</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate mb-1">Min. bedrooms</label>
          <select
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            className="rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm"
          >
            <option value="any">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate mb-1">Max price (GHS)</label>
          <input
            type="number"
            min="0"
            placeholder="No limit"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-xl border border-ink/20 bg-paper-raised px-3 py-2 text-sm w-36"
          />
        </div>
        {filtered.length !== listings.length && (
          <p className="text-xs text-slate self-center ml-auto">
            {filtered.length} of {listings.length} listings
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-ink/20 rounded-xl p-12 text-center">
          <p className="text-slate">No listings match those filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
