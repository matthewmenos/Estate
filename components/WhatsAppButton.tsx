function toWhatsAppNumber(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export default function WhatsAppButton({
  ownerPhone,
  propertyTitle,
}: {
  ownerPhone: string;
  propertyTitle: string;
}) {
  const message = encodeURIComponent(
    `Hi, I'm interested in "${propertyTitle}" on Accra Rentals. Is it still available?`
  );
  const href = `https://wa.me/${toWhatsAppNumber(ownerPhone)}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full rounded-sm border border-ink text-ink py-2 text-sm font-medium hover:bg-ink hover:text-paper-raised transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.16c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.81-.11-.42-.13-.95-.3-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.98 0-1.42.75-2.11 1.01-2.4.27-.29.58-.36.78-.36h.56c.18 0 .42-.03.65.5.24.55.81 1.9.88 2.04.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.16-.29.36-.42.48-.14.13-.28.27-.12.54.16.27.7 1.16 1.51 1.88 1.04.93 1.92 1.22 2.19 1.36.27.14.42.12.58-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.55.73 1.82.87.27.13.45.19.51.3.07.11.07.63-.17 1.31z"/>
      </svg>
      Message on WhatsApp
    </a>
  );
}
