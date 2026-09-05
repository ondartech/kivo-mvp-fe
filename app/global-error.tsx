"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const requestId = error?.digest;

  const copyRequestId = () => {
    if (requestId) {
      navigator.clipboard.writeText(requestId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <html lang="en">
      <head>
        <title>Application Error — Kivo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: "#FDFCFB",
          color: "#0B1220",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E4E7",
            borderRadius: "12px",
            padding: "32px 24px",
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(24, 24, 27, 0.08)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: "18px",
              fontWeight: 600,
              margin: "0 0 8px 0",
              letterSpacing: "-0.01em",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "#71717A",
              margin: "0 0 24px 0",
              lineHeight: 1.5,
            }}
          >
            An unexpected error occurred while loading the application. Please try
            refreshing the page.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                backgroundColor: "#0B1220",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: "#F4F4F5",
                color: "#0B1220",
                border: "1px solid #E4E4E7",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Reload application
            </button>
          </div>

          {requestId ? (
            <div
              style={{
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid #E4E4E7",
                fontSize: "12px",
                color: "#71717A",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: "monospace" }}>
                Ref: {requestId.slice(0, 12)}…
              </span>
              <button
                type="button"
                onClick={copyRequestId}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0B1220",
                  fontSize: "12px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                {copied ? "Copied!" : "Copy Request ID"}
              </button>
            </div>
          ) : null}
        </div>
      </body>
    </html>
  );
}
