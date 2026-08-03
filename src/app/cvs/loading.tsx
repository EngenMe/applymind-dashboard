import { LedgerLoader } from "@/components/loading/ledger-loader";

export default function Loading() {
  return <LedgerLoader rows={5} label="Loading CVs" />;
}
