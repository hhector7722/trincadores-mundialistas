import { TabScrollLoading } from "@/components/layout/TabScrollLoading";

export default function ProfileLoading() {
  return (
    <TabScrollLoading label="Cargando perfil">
      <div className="space-y-4 p-4 pb-4 opacity-40">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="size-24 rounded-full border border-[var(--tm-border)]/40" />
          <div className="h-4 w-32 rounded bg-[var(--tm-border)]/25" />
        </div>
        <div className="h-24 rounded-2xl border border-[var(--tm-border)]/40" />
        <div className="h-24 rounded-2xl border border-[var(--tm-border)]/40" />
      </div>
    </TabScrollLoading>
  );
}
