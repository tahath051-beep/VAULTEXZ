export function DemoBanner() {
  return (
    <div className="w-full bg-yellow-400 text-yellow-900 text-center text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2 z-50 flex-wrap">
      <span>⚠</span>
      <span>DEMO MODE — Mock Data Only</span>
      <span className="opacity-60">|</span>
      <span>Client: client@demo.com</span>
      <span className="opacity-60">|</span>
      <span>IB: ib@demo.com</span>
      <span className="opacity-60">|</span>
      <span>Admin: admin@demo.com / Demo@123456</span>
      <span>⚠</span>
    </div>
  );
}
