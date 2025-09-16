// components/Spinner.tsx
import { Loader } from "lucide-react";

export const Spinner = () => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className="flex items-center justify-center min-h-[200px]"
  >
    <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);
