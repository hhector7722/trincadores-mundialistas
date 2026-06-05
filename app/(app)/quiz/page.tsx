import Link from "next/link";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function QuizPage() {
  return (
    <div className="space-y-4 p-4 pb-8">
      <div>
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Quiz
        </h1>
        <p className="mt-1 text-sm text-[var(--tm-muted)]">Modulo secundario — fase 2.</p>
      </div>
      <Card>
        <p className="text-sm text-[var(--tm-muted)]">
          El esquema y las RPC ya existen. La interfaz de juego llegara mas adelante.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-[var(--tm-primary)]">
          Volver al inicio
        </Link>
      </Card>
    </div>
  );
}
