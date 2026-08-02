import type { Metadata } from "next";
import { CVsView } from "./cvs-view";

export const metadata: Metadata = {
  title: "CVs · ApplyMind",
};

export default function CVsPage() {
  return <CVsView />;
}
