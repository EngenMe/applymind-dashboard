import { Suspense } from "react";
import type { Metadata } from "next";
import { CredentialsForm } from "@/components/auth/credentials-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in — ApplyMind" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Your applications, CVs and cover letters, on whichever browser you
            are sitting at.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* useSearchParams needs a Suspense boundary to keep this page from
              opting the whole route into client-side rendering. */}
          <Suspense fallback={null}>
            <CredentialsForm mode="sign-in" />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
