import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function HeroSkeleton() {
  return (
    <section className="relative min-h-[60vh] overflow-hidden bg-muted">
      <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center md:px-8 md:py-32">
        <div className="space-y-4">
          <Skeleton className="mx-auto h-12 w-80" />
          <Skeleton className="mx-auto h-6 w-64" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="mx-auto h-10 w-40" />
        </div>
      </div>
    </section>
  );
}

export function SessionCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
        <Skeleton className="h-5 w-20" />
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <Skeleton className="h-7 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
      <CardFooter className="pt-4">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export function SessionGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  );
}
