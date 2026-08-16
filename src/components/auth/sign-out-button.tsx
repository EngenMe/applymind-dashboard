"use client";

import { useSignOut } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";

/**
 * Signing out.
 *
 * The label carries the email when there is one, because on a shared machine
 * "Sign out" alone does not say whose account is about to close. Pass the value
 * the layout already loaded rather than making this fetch it again.
 */
export function SignOutButton({ email }: { email?: string | null }) {
  const signOut = useSignOut();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={signOut.isPending}
      onClick={() => signOut.mutate()}
      aria-label={email ? `Sign out ${email}` : "Sign out"}
    >
      {signOut.isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
