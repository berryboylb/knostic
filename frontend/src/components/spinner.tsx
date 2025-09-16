// components/Spinner.tsx
import { Loader } from "lucide-react";
import React from "react";

export const Spinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);
