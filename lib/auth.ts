// BFF cookie is httpOnly — this is display helper only, not auth proof (AGENTS.md:17)
export async function getSession() {
  return null as unknown;
}

export async function requireOrgMembership(_orgId: string) {
  // RSC guard — in MVP stub, always allow demo org
  return { organizationId: _orgId, role: "OWNER" as const };
}
