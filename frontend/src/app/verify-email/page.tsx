"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { api, apiErrorMessage } from "@/lib/api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!uid || !token) {
      setState("error");
      setMessage("This verification link is malformed.");
      return;
    }
    api
      .post("/auth/email/verify/", { uid, token })
      .then(({ data }) => {
        setState("success");
        setMessage(data.detail ?? "Email verified.");
      })
      .catch((error) => {
        setState("error");
        setMessage(apiErrorMessage(error, "This link is invalid or has expired."));
      });
  }, [uid, token]);

  return (
    <AuthShell
      eyebrow="Email Verification"
      title={
        state === "verifying" ? "Verifying…" : state === "success" ? (
          <>You&apos;re <span className="text-accent">In</span></>
        ) : (
          "Link Expired"
        )
      }
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        {state === "verifying" ? "Hold tight while we confirm your email." : message}
      </p>
      {state !== "verifying" && (
        <Button className="mt-8" size="lg" asChild>
          <Link href={state === "success" ? "/shop" : "/account"}>
            {state === "success" ? "Shop the Drop" : "Go to Account"}
          </Link>
        </Button>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}
