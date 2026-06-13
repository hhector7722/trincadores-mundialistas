import { TabScrollLoading } from "@/components/layout/TabScrollLoading";
import { RankingTableSkeleton } from "@/components/ranking/RankingTableSkeleton";

export default function RankingLoading() {
  return (
    <TabScrollLoading label="Cargando ranking">
      <div className="tm-ranking-page">
        <RankingTableSkeleton />
      </div>
    </TabScrollLoading>
  );
}
