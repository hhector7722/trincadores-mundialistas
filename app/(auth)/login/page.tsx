import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <>
      <h1 className="text-xl font-semibold text-[var(--tm-fg)]">Entrar</h1>
      <p className="mt-1 text-sm text-[var(--tm-muted)]">Usuario y contrasena de la porra.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-4 text-center text-sm text-[var(--tm-muted)]">
        <Link href="/register" className="font-medium text-[var(--tm-primary)]">
          Registrarse con invitacion
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-[var(--tm-muted)]">
        <Link href="/recover" className="font-medium text-[var(--tm-primary)]">
          Recuperar contrasena
        </Link>
      </p>
    </>
  );
}
