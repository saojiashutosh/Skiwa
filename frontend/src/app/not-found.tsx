import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="heading text-display text-foreground/15">404</p>
      <h1 className="heading -mt-6 text-4xl text-foreground md:text-6xl">
        Lost in the <span className="text-accent">Shadows</span>
      </h1>
      <p className="mt-4 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved to another dimension.
      </p>
      <div className="mt-10 flex gap-4">
        <Button asChild>
          <Link href="/">Back Home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/shop">Shop the Drop</Link>
        </Button>
      </div>
    </div>
  );
}
