import { Badge } from "@/components/ui/badge";

type Props = {
  status: string; // VERIFIED | MISMATCH | UNVERIFIED
  matchType: string | null; // MATCH | CLOSE_MATCH | MISMATCH | null
};

export function VerificationBadge({ status, matchType }: Props) {
  if (status === "VERIFIED" && matchType === "MATCH") {
    return (
      <Badge variant="success" aria-label="Verified — exact match">
        Verified
      </Badge>
    );
  }
  if (status === "VERIFIED" && matchType === "CLOSE_MATCH") {
    return (
      <Badge variant="warning" aria-label="Verified — close match, review name">
        Close match
      </Badge>
    );
  }
  if (status === "MISMATCH" || matchType === "MISMATCH") {
    return (
      <Badge variant="critical" aria-label="Verification mismatch">
        Mismatch
      </Badge>
    );
  }
  return (
    <Badge variant="neutral" aria-label="Unverified">
      Unverified
    </Badge>
  );
}

export function verificationTone(status: string, matchType: string | null): string {
  if (status === "VERIFIED" && matchType === "MATCH") return "success";
  if (status === "VERIFIED" && matchType === "CLOSE_MATCH") return "warning";
  if (status === "MISMATCH") return "critical";
  return "neutral";
}
