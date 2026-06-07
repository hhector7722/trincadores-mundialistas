export default function AppSectionLoading() {
  return (
    <div
      className="relative z-10 animate-pulse space-y-3 p-4 pb-4"
      aria-busy="true"
      aria-label="Cargando seccion"
    >
      <div className="h-7 w-28 rounded-lg bg-[var(--tm-surface)]" />
      <div className="h-32 rounded-[var(--tm-radius)] bg-[var(--tm-surface)]" />
      <div className="h-48 rounded-[var(--tm-radius)] bg-[var(--tm-surface)]" />
    </div>
  );
}
