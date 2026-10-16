import Link from 'next/link';
import { Logo } from '../../components/ui';
import { DISCLAIMER, MARKETING_NAV } from '../../lib/site';

export default function MarketingLayout({ children }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 py-2">
        <Link href="/" aria-label="Home"><Logo /></Link>
        <nav aria-label="Site" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto text-sm md:order-none md:w-auto">
          {MARKETING_NAV.map((n) => (
            <Link key={n.href} href={n.href} className="flex min-h-11 shrink-0 items-center rounded-xl px-3 text-ink/75 hover:bg-ink/5">{n.label}</Link>
          ))}
        </nav>
        <Link href="/app" className="btn btn-ink">Try the demo</Link>
      </header>
      <main>{children}</main>
      <footer className="mt-16 border-t border-ink/10 py-8 text-center text-xs text-mute">
        <p>{DISCLAIMER}</p>
        <nav aria-label="Footer" className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {MARKETING_NAV.map((n) => <Link key={n.href} href={n.href} className="underline-offset-4 hover:underline">{n.label}</Link>)}
          <Link href="/app" className="underline-offset-4 hover:underline">Demo</Link>
        </nav>
      </footer>
    </div>
  );
}
