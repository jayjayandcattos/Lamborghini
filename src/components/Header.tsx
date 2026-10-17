import { Check, Download, Menu } from 'lucide-react';
import { Mark } from './Mark';

interface HeaderProps {
  onMenu: () => void;
  onExport: () => void;
  exported: boolean;
}

export function Header({ onMenu, onExport, exported }: HeaderProps) {
  return (
    <header className="relative z-30 flex h-[54px] shrink-0 items-center gap-3 border-b border-line bg-panel px-3 md:px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open examples panel"
        className="-ml-1 flex h-8 w-8 items-center justify-center border border-line bg-sheet text-ink-2 transition-colors hover:text-ink lg:hidden"
      >
        <Menu size={15} />
      </button>

      <div className="flex items-center gap-2.5">
        <Mark className="h-6 w-[21px] text-ink" />
        <span className="flex flex-col leading-none">
          <span className="display text-[13px] uppercase text-ink">Kotsebroom</span>
          <span className="label mt-[5px] text-[7px] tracking-[0.28em]">configurator</span>
        </span>
      </div>

      <span className="mx-1 hidden h-5 w-px bg-line md:block" />

      <nav
        aria-label="Breadcrumb"
        className="hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] md:flex"
      >
        <span className="text-ink-3">examples</span>
        <span className="text-line">/</span>
        <span className="text-ink-3">webgl</span>
        <span className="text-line">/</span>
        <span className="text-ink">configurator</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden h-6 items-center border border-line px-1.5 font-mono text-[9px] tracking-[0.08em] text-ink-3 sm:inline-flex">
          r184
        </span>
        <span className="hidden h-4 w-px bg-line sm:block" />
        <button
          type="button"
          onClick={onExport}
          className="group inline-flex h-8 items-center gap-1.5 bg-ink px-3 font-mono text-[9px] uppercase tracking-[0.16em] text-paper transition-colors duration-300 hover:bg-[var(--accent-ink)]"
        >
          {exported ? <Check size={12} /> : <Download size={12} />}
          <span className="hidden sm:inline">{exported ? 'Saved' : 'Export'}</span>
        </button>
      </div>
    </header>
  );
}
