import type { ReactNode } from "react";

interface AuthShellProps {
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
}

export function AuthShell({ eyebrow, title, children }: AuthShellProps) {
  return (
    <div className="container flex min-h-svh items-center justify-center py-32">
      <div className="w-full max-w-md">
        <p className="label-caps mb-3">{eyebrow}</p>
        <h1 className="heading text-5xl text-foreground md:text-6xl">{title}</h1>
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
