import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import type { OverlapPair } from "@/lib/session-utils";

interface OverlapWarningBannerProps {
  overlaps: OverlapPair[];
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OverlapWarningBanner({ overlaps }: OverlapWarningBannerProps) {
  if (overlaps.length === 0) return null;

  return (
    <div
      className="mb-6 rounded-md border border-amber-500/50 bg-amber-50 p-4 dark:bg-amber-950/30"
      data-testid="banner-overlap-warning"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200">
            Let op: overlappende inschrijvingen
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Je bent ingeschreven voor sessies die op hetzelfde moment plaatsvinden:
          </p>
          <ul className="mt-2 space-y-1">
            {overlaps.map((overlap, index) => (
              <li
                key={`${overlap.session1.id}-${overlap.session2.id}`}
                className="text-sm text-amber-700 dark:text-amber-300"
                data-testid={`overlap-item-${index}`}
              >
                <Link
                  href={`/sessies/${overlap.session1.slug}`}
                  className="font-medium underline hover:no-underline"
                >
                  {overlap.session1.title}
                </Link>
                {" "}({formatTime(overlap.session1.startTime)} - {formatTime(overlap.session1.endTime)})
                {" "}en{" "}
                <Link
                  href={`/sessies/${overlap.session2.slug}`}
                  className="font-medium underline hover:no-underline"
                >
                  {overlap.session2.title}
                </Link>
                {" "}({formatTime(overlap.session2.startTime)} - {formatTime(overlap.session2.endTime)})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
