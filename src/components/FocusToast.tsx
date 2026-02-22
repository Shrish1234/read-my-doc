import { useEffect, useState } from 'react';

interface FocusToastProps {
  message: string;
  onDone: () => void;
}

export function FocusToast({ message, onDone }: FocusToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), 3700);
    const remove = setTimeout(onDone, 4000);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, [onDone]);

  return (
    <div
      className={`fixed right-4 top-4 z-[1000] max-w-[400px] rounded-lg border border-border border-l-[3px] border-l-primary bg-card px-4 py-3 text-sm text-foreground shadow-lg ${leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
    >
      {message}
    </div>
  );
}
