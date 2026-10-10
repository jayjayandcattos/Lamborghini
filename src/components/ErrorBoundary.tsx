import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App crashed:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="w-full h-screen bg-lambo-dark text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="font-mono text-[10px] tracking-[0.35em] text-lambo-yellow uppercase">
          System Fault
        </span>
        <h1 className="font-display text-2xl sm:text-3xl">Configurator unavailable</h1>
        <p className="max-w-sm text-xs text-gray-400 font-mono">{error.message}</p>
        <button
          onClick={() => this.setState({ error: null })}
          className="mt-2 font-mono text-[10px] font-bold tracking-[0.2em] uppercase bg-lambo-yellow hover:bg-white text-black px-5 py-2.5 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }
}