/** Filas vacías bajo las cards para que la TabBar no tape quiz/dato. */
export function HomeTabBarBuffer() {
  return (
    <div className="tm-home-tabbar-buffer flex shrink-0 flex-col gap-3" aria-hidden>
      <div className="tm-home-tabbar-buffer__row h-[var(--tm-home-top-stat-height)] shrink-0" />
      <div className="tm-home-tabbar-buffer__row h-[var(--tm-home-top-stat-height)] shrink-0" />
      <div className="tm-home-tabbar-buffer__row h-[var(--tm-tabbar-shell)] shrink-0" />
    </div>
  );
}
