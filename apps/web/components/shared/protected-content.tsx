"use client";

import { useCallback, useEffect, useState } from "react";

import { SimpleToast } from "@/components/shared/simple-toast";
import { isCopyAllowedTarget } from "@/lib/content-protection";

type Props = {
  children: React.ReactNode;
  /** Localized toast when copy/cut is blocked. */
  message: string;
};

/**
 * Soft copy/cut deterrence for CMS educational reading surfaces.
 * Selection stays enabled for a11y; inputs and [data-allow-copy] remain usable.
 */
export function ProtectedContent({ children, message }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    const onClipboard = (event: ClipboardEvent) => {
      if (isCopyAllowedTarget(event.target)) return;
      event.preventDefault();
      setToast(message);
    };

    document.addEventListener("copy", onClipboard, true);
    document.addEventListener("cut", onClipboard, true);
    return () => {
      document.removeEventListener("copy", onClipboard, true);
      document.removeEventListener("cut", onClipboard, true);
    };
  }, [message]);

  return (
    <>
      {children}
      <SimpleToast message={toast} onDismiss={dismiss} />
    </>
  );
}
