import { NotFoundState } from "@/components/kivo/error-view";

export default function AppNotFound() {
  return (
    <div className="py-12 px-4 flex justify-center">
      <NotFoundState
        title="Page or resource not found"
        description="The requested page or record could not be found in this workspace."
        dashboardHref="/app/dashboard"
      />
    </div>
  );
}
