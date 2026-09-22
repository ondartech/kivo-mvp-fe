export const env = {
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.getondar.com",
  NEXT_PUBLIC_ROOT_DOMAIN:
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "getondar.com",
  NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED:
    process.env.NEXT_PUBLIC_MICROSOFT_AUTH_ENABLED === "true",
};
