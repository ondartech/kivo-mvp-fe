export async function GET(): Promise<Response> {
  return Response.json(
    {
      status: "ready",
      service: "ondar-web",
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
