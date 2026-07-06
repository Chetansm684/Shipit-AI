"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Trash2, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { deleteProject, type ProjectSummary } from "@/actions/projects";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GoogleSpark } from "./reusables";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  workspace: ProjectSummary;
  index: number;
}

export function ProjectCard({ workspace, index }: ProjectCardProps) {
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await deleteProject(workspace.id);
      toast.success("Project deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const colors = [
    "group-hover:border-[var(--gl-blue)] group-hover:text-[var(--gl-blue)]",
    "group-hover:border-[var(--gl-red)] group-hover:text-[var(--gl-red)]",
    "group-hover:border-[var(--gl-yellow)] group-hover:text-[var(--gl-yellow)]",
    "group-hover:border-[var(--gl-green)] group-hover:text-[var(--gl-green)]",
  ];
  const bgColors = [
    "group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20",
    "group-hover:bg-red-50 dark:group-hover:bg-red-900/20",
    "group-hover:bg-yellow-50 dark:group-hover:bg-yellow-900/20",
    "group-hover:bg-green-50 dark:group-hover:bg-green-900/20",
  ];

  const hoverColorClass = colors[index % 4];
  const hoverBgClass = bgColors[index % 4];

  return (
    <Link href={`/workspace?id=${workspace.id}`} className="group block">
      <div className="relative flex h-[220px] flex-col rounded-[24px] border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 transition-all duration-300 google-shadow-hover hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-bg)] transition-colors duration-300",
              hoverColorClass, hoverBgClass
            )}
          >
            <GoogleSpark className="h-5 w-5" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex focus:outline-none"
              onClick={(e) => e.preventDefault()}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--gl-text-tertiary)] hover:bg-[var(--gl-bg)] hover:text-[var(--gl-text-primary)] transition-colors cursor-pointer">
                <MoreVertical className="h-4 w-4" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 rounded-2xl bg-[var(--gl-surface)] border border-[var(--gl-border)] p-1 google-shadow"
            >
              <DropdownMenuItem
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-[var(--gl-text-secondary)] hover:bg-[var(--gl-bg)] hover:text-[var(--gl-text-primary)] focus:bg-[var(--gl-bg)] focus:text-[var(--gl-text-primary)]"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/workspace?id=${workspace.id}`);
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium text-[var(--gl-red)] hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-auto">
          <h3 className="mb-2 line-clamp-2 text-[18px] font-bold text-[var(--gl-text-primary)]">
            {workspace.title || "Untitled App"}
          </h3>
          <p className="text-[13px] font-medium text-[var(--gl-text-tertiary)]">
            {formatDistanceToNow(new Date(workspace.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}
