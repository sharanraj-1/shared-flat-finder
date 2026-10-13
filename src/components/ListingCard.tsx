import Image from "next/image";
import { BedDouble, Bath, ArrowUpDown, Car, Sparkles } from "lucide-react";
import type { ListingRecord } from "@/lib/types";

export function ListingCard({
  listing,
  badge,
  children,
}: {
  listing: ListingRecord;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl">
      <div className="relative h-56 w-full shrink-0 bg-muted-bg">
        <Image src={listing.image} alt={listing.title} fill className="object-cover" unoptimized />
        <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          Demo data
        </div>
        {badge && <div className="absolute right-3 top-3">{badge}</div>}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-white">
          <p className="text-lg font-extrabold leading-tight">{listing.title}</p>
          <p className="text-sm opacity-90">{listing.location}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-2xl font-extrabold">
          ₹{listing.rent.toLocaleString("en-IN")}
          <span className="text-sm font-semibold text-muted">/month</span>
        </p>

        <div className="flex flex-wrap gap-3 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <BedDouble size={16} /> {listing.bedrooms} BHK
          </span>
          <span className="flex items-center gap-1.5">
            <Bath size={16} /> {listing.bathrooms} Bath
          </span>
          <span className="flex items-center gap-1.5">
            <ArrowUpDown size={16} /> Floor {listing.floor}
          </span>
          {listing.parking && (
            <span className="flex items-center gap-1.5">
              <Car size={16} /> Parking
            </span>
          )}
          {listing.furnished !== "unfurnished" && (
            <span className="flex items-center gap-1.5">
              <Sparkles size={16} /> {listing.furnished === "semi" ? "Semi-furnished" : "Furnished"}
            </span>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
