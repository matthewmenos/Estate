import Image from "next/image";
import Link from "next/link";
import VerifiedSeal from "./VerifiedSeal";

type CardProperty = {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  currency: string;
  listing_type: string;
  coverUrl?: string;
  verified?: boolean;
};

export default function PropertyCard({ property }: { property: CardProperty }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block bg-paper-raised border border-ink/10 rounded-sm overflow-hidden hover:border-rust/40 transition-colors"
    >
      <div className="relative h-44 bg-ink/5">
        {property.coverUrl && (
          <Image
            src={property.coverUrl}
            alt={property.title}
            fill
            className="object-cover"
          />
        )}
        {property.verified && (
          <div className="absolute top-2 right-2 drop-shadow-sm">
            <VerifiedSeal size={48} />
          </div>
        )}
        <span className="absolute bottom-2 left-2 bg-ink text-paper-raised text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-sm">
          {property.listing_type === "rent" ? "For rent" : "For sale"}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-ink truncate group-hover:text-rust transition-colors">
          {property.title}
        </h3>
        <p className="text-sm text-slate mt-0.5">
          {property.address}, {property.city}
        </p>
        <p className="mt-3 font-mono font-semibold text-rust">
          {property.currency} {Number(property.price).toLocaleString()}
          {property.listing_type === "rent" && (
            <span className="text-xs font-normal text-slate"> /month</span>
          )}
        </p>
      </div>
    </Link>
  );
}
