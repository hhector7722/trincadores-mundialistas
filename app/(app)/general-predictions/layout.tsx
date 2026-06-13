import { ViewportLayoutRoot } from "@/components/layout/ViewportLayoutRoot";

export default function GeneralPredictionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewportLayoutRoot className="tm-ranking-layout flex flex-col">
      {children}
    </ViewportLayoutRoot>
  );
}
