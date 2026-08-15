"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase";

export default function ViewCounter({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    supabaseBrowser.rpc("increment_property_views", { prop_id: propertyId });
  }, [propertyId]);

  return null;
}
