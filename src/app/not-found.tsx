import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-lg font-medium">That page is not part of the ledger.</h1>
      <p className="mt-2 text-sm text-ink-muted">
        The link may be stale, or the application was deleted.
      </p>
      <Button asChild className="mt-6">
        <Link href="/applications">Back to applications</Link>
      </Button>
    </div>
  );
}
