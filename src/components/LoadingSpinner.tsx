import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className = '' }: LoadingSpinnerProps) {
  return (
    <Loader2 
      size={size} 
      className={`animate-spin text-primary-600 ${className}`} 
    />
  );
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size={40} />
    </div>
  );
}
