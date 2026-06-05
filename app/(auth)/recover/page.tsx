import Link from "next/link";
import { RecoverForm } from "@/components/auth/RecoverForm";

export default function RecoverPage() {
  return (
    <>
      <h1 className="text-xl font-semibold text-[var(--tm-fg)]">Recuperar acceso</h1>
      <p className="mt-1 text-sm text-[var(--tm-muted)]">
        Canal tecnico en 1a; no sustituye un buzon real.
      </p>
      <div className="mt-6">
        <RecoverForm />
      </div>
      <p className="mt-4 text-center text-sm text-[var(--tm-muted)]">
        <Link href="/login" className="font-medium text-[var(--tm-primary)]">
          Volver al login
        </Link>
      </p>
    </>
  );
}
