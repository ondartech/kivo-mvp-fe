"use client";

import * as React from "react";
import Script from "next/script";
import type { LoginChallengeStart } from "@/features/auth/api";

type Widget = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      cData: string;
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: Widget;
  }
}

export function LoginChallenge({
  challenge,
  onResponse,
  onError,
}: {
  challenge: LoginChallengeStart;
  onResponse: (token: string) => void;
  onError: () => void;
}) {
  const node = React.useRef<HTMLDivElement>(null);
  const widgetId = React.useRef<string | null>(null);
  const [scriptReady, setScriptReady] = React.useState(false);

  React.useEffect(() => {
    if (!scriptReady || !window.turnstile || !node.current) return;
    const id = window.turnstile.render(node.current, {
      sitekey: challenge.site_key,
      action: "ondar_login",
      cData: challenge.attempt_id,
      callback: onResponse,
      "error-callback": onError,
      "expired-callback": onError,
    });
    widgetId.current = id;
    return () => {
      if (widgetId.current === id) {
        window.turnstile?.remove(id);
        widgetId.current = null;
      }
    };
  }, [scriptReady, challenge.attempt_id, challenge.site_key, onResponse, onError]);

  return (
    <section aria-label="Additional sign-in verification" className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={onError}
      />
      <p className="text-sm text-muted-foreground">
        Please complete this verification to attempt sign-in. Your password is still required.
      </p>
      <div ref={node} role="group" aria-label="Security verification" />
      <p className="text-xs text-muted-foreground">
        If verification is not accessible on your device, use another available sign-in
        method or contact support.
      </p>
    </section>
  );
}
