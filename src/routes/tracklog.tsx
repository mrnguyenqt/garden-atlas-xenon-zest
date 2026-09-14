import { createFileRoute } from "@tanstack/react-router";
import { TracklogCalc } from "@/components/tracklog-calc";

export const Route = createFileRoute("/tracklog")({ component: TracklogPage });

function TracklogPage() {
  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <h1 className="font-display text-center text-4xl italic">Tracklog</h1>
      <p className="mt-2 text-center text-xs tracking-[0.2em] text-muted uppercase">Ghi đường đi</p>
      <div className="mx-auto mt-8 max-w-prose rounded-xl bg-bg-elevated p-5 shadow-(--shadow-border) md:p-6">
        <TracklogCalc />
      </div>
    </div>
  );
}
