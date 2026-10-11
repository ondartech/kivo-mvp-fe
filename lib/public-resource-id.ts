/** Canonical Ondar Class-A public IDs; do not equate these with internal UUIDs. */
const TOKEN = "[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{20}";
const ORGANIZATION = new RegExp("^org_" + TOKEN + "$");
const BRANCH = new RegExp("^brn_" + TOKEN + "$");
const LEGACY_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPublicOrganizationId(value: string | null | undefined): value is string {
  return Boolean(value && ORGANIZATION.test(value));
}
export function isPublicBranchId(value: string | null | undefined): value is string {
  return Boolean(value && BRANCH.test(value));
}
export function isOrganizationRequestId(value: string | null | undefined): value is string {
  return Boolean(value && (ORGANIZATION.test(value) || LEGACY_UUID.test(value)));
}
