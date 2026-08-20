export default function PropertyMap({ lat, lng }: { lat: number; lng: number }) {
  const delta = 0.01;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="rounded-xl overflow-hidden border border-ink/10 h-64">
      <iframe
        title="Property location"
        src={src}
        className="w-full h-full border-0"
        loading="lazy"
      />
    </div>
  );
}
