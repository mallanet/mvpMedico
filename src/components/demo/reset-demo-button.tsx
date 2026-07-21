"use client";

import { isDemoMode } from "@/lib/mock/mode";
import { clearDemoStorageClient } from "@/lib/mock/store-client";
import { clearDemoSessionClient } from "@/lib/mock/session-client";

export function ResetDemoButton() {
  if (!isDemoMode()) return null;

  return (
    <button
      type="button"
      className="font-medium text-teal-800 underline-offset-2 hover:underline"
      onClick={() => {
        clearDemoStorageClient();
        clearDemoSessionClient();
        window.location.href = "/";
      }}
    >
      Reiniciar demo
    </button>
  );
}
