export const metadata = { title: "Terms of Service — Accra Rentals" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 prose-sm">
      <h1 className="text-2xl font-semibold text-ink mb-1">Terms of Service</h1>
      <p className="text-sm text-slate mb-8">Last updated: [add date before launch]</p>

      <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-sm text-ink mb-8">
        <strong>This is a starting template, not a finished legal document.</strong> Have
        it reviewed by a lawyer licensed in Ghana before relying on it — particularly
        around the Data Protection Act, 2012 (Act 843), which requires most data
        controllers to register with Ghana's Data Protection Commission, and around
        your specific obligations as a platform that facilitates (but does not itself
        broker) property transactions and payments.
      </div>

      <div className="space-y-6 text-ink/85 leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">1. What this platform is</h2>
          <p>
            Accra Rentals lets property owners list rentals and sales, and lets renters
            or buyers find and contact them directly. We are not a real estate agency,
            broker, or party to any transaction between an owner and a renter/buyer —
            we provide the listing and communication tools only.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">2. Owner verification</h2>
          <p>
            Owners may be shown as "verified" once we've confirmed identity/ownership
            through a manual review process. Verification is a good-faith signal, not
            a guarantee — renters and buyers should still take reasonable steps to
            confirm a listing and owner before entering any agreement or making any
            payment.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">3. Accuracy of listings</h2>
          <p>
            Owners are responsible for the accuracy of their own listings — price,
            availability, photos, and description. We do not independently verify
            listing details beyond owner identity.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">4. Payments</h2>
          <p>
            Rent payment tracking and mobile money collection are provided as tools
            for owners and tenants — [add your actual terms here: fees, dispute
            handling, what happens if a payment fails, refund policy if applicable].
            Mobile money payments are processed by Hubtel; we do not hold or custody
            funds ourselves.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">5. Account termination</h2>
          <p>
            [Add your policy: grounds for suspending or removing an account or
            listing — fraud, repeated complaints, fake listings, etc.]
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">6. Limitation of liability</h2>
          <p>
            [This section carries real legal weight and should be drafted with a
            lawyer — a generic placeholder here would do you a disservice.]
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">7. Contact</h2>
          <p>[Add your business name, address, and contact email/phone.]</p>
        </section>
      </div>
    </main>
  );
}
