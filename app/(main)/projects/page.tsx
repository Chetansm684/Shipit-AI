import { checkUser } from "@/lib/checkUser";
import { getUserProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { Plus } from "lucide-react";
import Link from "next/link";
import { SectionHeading, SectionLabel } from "@/components/reusables";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const user = await checkUser();
  if (!user) {
    redirect("/");
  }

  const workspaces = await getUserProjects();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--gl-bg)] pb-24 pt-32 selection:bg-[var(--gl-blue)]/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        
        <div className="mb-16 flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <SectionLabel>Your apps</SectionLabel>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--gl-text-primary)]">
              Projects
            </h1>
          </div>
          
          <Link
            href="/workspace"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--gl-blue)] px-6 text-[15px] font-bold text-[var(--min-accent-fg)] transition-all hover:opacity-90 active:scale-95 google-shadow"
          >
            <Plus className="h-5 w-5" />
            New Project
          </Link>
        </div>

        {workspaces.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-[var(--gl-border)] bg-[var(--gl-surface)] text-center google-shadow">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
              <Plus className="h-8 w-8 text-[var(--gl-blue)]" />
            </div>
            <h2 className="mb-3 text-[22px] font-bold text-[var(--gl-text-primary)]">
              No projects yet
            </h2>
            <p className="mb-8 max-w-md text-[16px] font-medium text-[var(--gl-text-secondary)]">
              Create your first app by describing what you want to build. Our AI will handle the rest.
            </p>
            <Link
              href="/workspace"
              className="inline-flex h-12 items-center rounded-full bg-[var(--gl-blue)] px-8 text-[15px] font-bold text-[var(--min-accent-fg)] transition-all hover:opacity-90 active:scale-95 google-shadow"
            >
              Start building
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws, i) => (
              <ProjectCard key={ws.id} workspace={ws} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
