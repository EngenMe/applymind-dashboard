import { LedgerLoader } from "@/components/loading/ledger-loader";

export default function Loading() {
  return <LedgerLoader rows={8} withFilters label="Loading applications" />;
}
