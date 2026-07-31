import { Skeleton } from '../ui/index.js';

/** Loading placeholder matching VillageCard's layout. */
export default function VillageCardSkeleton() {
  return (
    <div className="flex flex-col rounded-card bg-white p-[21px] shadow-card">
      <Skeleton className="h-44 w-full rounded-card" />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-20 rounded-card" />
      </div>
      <Skeleton className="mt-4 h-6 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-4/5" />
      <div className="mt-4 flex justify-end">
        <Skeleton className="h-9 w-28 rounded-pill" />
      </div>
    </div>
  );
}
