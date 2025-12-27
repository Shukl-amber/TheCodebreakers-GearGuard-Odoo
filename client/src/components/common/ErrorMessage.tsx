import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
  className = '',
}: ErrorMessageProps) {
  return (
    <div className={className}>
      <Alert variant="error" title={title}>
        <div className="space-y-3">
          <p>{message}</p>
          {onRetry && (
            <Button variant="error" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}

export function ErrorScreen({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorMessage title={title} message={message} onRetry={onRetry} />
      </div>
    </div>
  );
}

export default ErrorMessage;
