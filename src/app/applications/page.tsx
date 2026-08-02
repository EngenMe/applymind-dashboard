import type { Metadata } from "next";
import { ApplicationsView } from "./applications-view";

export const metadata: Metadata = {
  title: "Applications · ApplyMind",
};

export default function ApplicationsPage() {
  return <ApplicationsView />;
}
