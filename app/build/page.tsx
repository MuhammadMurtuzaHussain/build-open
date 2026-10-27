import type { Metadata } from "next";
import { BuildHome } from "@/components/build/BuildHome";

export const metadata: Metadata = {
  title: "Build with Heckr · Build Open",
  description: "Your AI mentor for the day at Build Open. Describe your idea, get a step-by-step plan, and get unstuck. Heckr teaches you to drive your own coding agent.",
};

export default function BuildPage() {
  return <BuildHome />;
}
