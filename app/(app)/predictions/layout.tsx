import { ViewportLayoutRoot } from "@/components/layout/ViewportLayoutRoot";

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewportLayoutRoot className="tm-porra-layout flex flex-col">{children}</ViewportLayoutRoot>
  );
}
