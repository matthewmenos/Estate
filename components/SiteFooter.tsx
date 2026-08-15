export default function SiteFooter() {
  return (
    <footer className="bg-ink text-paper mt-16">
      <div className="mx-auto max-w-5xl px-4 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold">Accra Rentals</p>
          <p className="text-sm text-paper/60 mt-1">
            Built for owners. Trusted by renters.
          </p>
        </div>
        <p className="text-xs text-paper/50">
          A platform for verified property owners in Accra, Ghana.
        </p>
      </div>
    </footer>
  );
}
