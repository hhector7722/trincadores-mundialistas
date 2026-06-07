import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function ActivityPage() {
  return (
    <div className="space-y-4 p-4 pb-[calc(var(--tm-tabbar-height)+1rem)]">
      <div>
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Actividad
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">Eventos de la porra.</p>
      </div>
      <Card>
        <p className="text-sm text-[var(--tm-muted)]">
          El feed de actividad llega en la fase 1e (resultados, subidas en ranking y eventos del
          grupo).
        </p>
      </Card>
    </div>
  );
}