import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-xl font-semibold text-[var(--tm-fg)]">Registro</h1>
      <p className="mt-1 text-sm text-[var(--tm-muted)]">Necesitas un codigo de invitacion.</p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-4 text-center text-sm text-[var(--tm-muted)]">
        <Link href="/login" className="font-medium text-[var(--tm-primary)]">
          Ya tengo cuenta
        </Link>
      </p>
    </>
  );
}
