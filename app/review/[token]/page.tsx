import { supabaseServer } from "@/lib/supabase";
import ReviewForm from "@/components/ReviewForm";

async function getTenantByToken(token: string) {
  const supabase = supabaseServer();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, properties(title)")
    .eq("review_token", token)
    .single();
  if (!tenant) return { tenant: null, alreadyReviewed: false };

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  return { tenant, alreadyReviewed: !!existing };
}

export default async function ReviewPage({ params }: { params: { token: string } }) {
  const { tenant, alreadyReviewed } = await getTenantByToken(params.token);

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      {!tenant ? (
        <p className="text-sm text-rust">This review link isn't valid.</p>
      ) : alreadyReviewed ? (
        <p className="text-sm text-slate">A review has already been submitted for this tenancy — thanks!</p>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-ink mb-1">Leave a review</h1>
          <p className="text-slate text-sm mb-6">
            Your experience renting "{(tenant as any).properties.title}"
          </p>
          <ReviewForm token={params.token} />
        </>
      )}
    </main>
  );
}
