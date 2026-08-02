import type { Metadata } from "next";
import { CoverLettersView } from "./cover-letters-view";

export const metadata: Metadata = {
  title: "Cover letters · ApplyMind",
};

export default function CoverLettersPage() {
  return <CoverLettersView />;
}
