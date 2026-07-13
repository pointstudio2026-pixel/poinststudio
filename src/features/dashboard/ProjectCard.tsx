import Link from "next/link";
import type { DashboardProjectDto } from "@/services/dashboard-service";

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  progress: "진행 중",
  completed: "완료",
};

export function ProjectCard({ project }: { project: DashboardProjectDto }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex flex-col gap-1 rounded-md border border-neutral-200 px-4 py-3 text-left transition hover:border-neutral-400"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{project.name}</span>
        {project.isFavorite && <span aria-label="즐겨찾기">★</span>}
      </div>
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span className="rounded-full bg-neutral-100 px-2 py-0.5">
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
        <span>{new Date(project.updatedAt).toLocaleDateString("ko-KR")}</span>
      </div>
    </Link>
  );
}
