import { ErrorView } from "@/components/kivo/error-view";

export default function RootNotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <ErrorView
        category="not_found"
        title="Page not found"
        description="The page you are looking for does not exist or may have been moved."
        action={{
          label: "Go to dashboard",
          href: "/app/dashboard",
          variant: "primary",
        }}
        secondaryAction={{
          label: "Back to login",
          href: "/login",
          variant: "secondary",
        }}
      />
    </div>
  );
}
