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

export const metadata: Metadata = { title: "Create an account — ApplyMind" };

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            An email and a password. Nothing is shared with anyone, and the
            extension connects afterwards from settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <CredentialsForm mode="sign-up" />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
