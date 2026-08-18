export const metadata = { title: "Privacy Policy — Accra Rentals" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-ink mb-1">Privacy Policy</h1>
      <p className="text-sm text-slate mb-8">Last updated: [add date before launch]</p>

      <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-sm text-ink mb-8">
        <strong>This is a starting template, not a finished legal document.</strong> Ghana's
        Data Protection Act, 2012 (Act 843) requires most organizations that
        collect personal data to register as a data controller with the Data
        Protection Commission — confirm whether that applies to you, and have
        this document reviewed by a lawyer before real users sign up.
      </div>

      <div className="space-y-6 text-ink/85 leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">What we collect</h2>
          <p>Based on what this platform actually stores:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Name, email, and phone number (owners); name and phone number (renters submitting an inquiry)</li>
            <li>Property listing details and photos you upload</li>
            <li>Verification status (whether we've confirmed your identity/ownership)</li>
            <li>If you use rent tracking: tenant names, phone numbers, and rent payment records</li>
            <li>Basic usage data: which listings are viewed (view counts)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Who else sees it</h2>
          <p>We use the following third-party services to run the platform:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Supabase</strong> — hosts our database and handles account authentication</li>
            <li><strong>Cloudflare R2</strong> — stores property photos</li>
            <li><strong>Arkesel</strong> — sends SMS verification codes and notifications</li>
            <li><strong>Hubtel</strong> — processes mobile money rent payments</li>
          </ul>
          <p className="mt-2">
            We don't sell your personal data to advertisers or other third parties.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Your phone number</h2>
          <p>
            Your verified phone number is shown to renters/buyers via the WhatsApp
            contact button on your listings, so they can reach you directly. It is
            not shown anywhere else on the platform.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Data retention</h2>
          <p>[Add your policy: how long data is kept after account deletion, etc.]</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Your rights</h2>
          <p>
            [Add: how a user can request their data, request deletion, or correct
            inaccurate information — required under Act 843.]
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Contact</h2>
          <p>[Add your business name, address, and a contact email for privacy requests.]</p>
        </section>
      </div>
    </main>
  );
}
