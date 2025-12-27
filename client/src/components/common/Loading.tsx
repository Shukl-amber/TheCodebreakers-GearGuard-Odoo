export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-neutral-700 border-t-neutral-300 rounded-full animate-spin`}
    />
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-neutral-400">{message}</p>
      </div>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-neutral-100">{message}</p>
      </div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
        <div className="h-4 bg-neutral-800 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export default LoadingSpinner;
