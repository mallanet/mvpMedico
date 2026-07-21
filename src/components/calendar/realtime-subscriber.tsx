"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAppointmentsRealtime(
  resourceId: string,
  onUpdate: () => void,
) {
  useEffect(() => {
    if (!resourceId) return;
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`appointments-${resourceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `resource_id=eq.${resourceId}`,
        },
        () => onUpdate(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [resourceId, onUpdate]);
}
