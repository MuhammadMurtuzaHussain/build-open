import type { Metadata } from "next";
import { ProjectView } from "@/components/build/ProjectView";

export const metadata: Metadata = {
  title: "Your build · Build Open",
  robots: { index: false },
};

export default function ProjectPage() {
  return <ProjectView />;
}
