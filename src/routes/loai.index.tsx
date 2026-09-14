import { useLayoutEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, Trees } from "lucide-react";
import { SPECIES, TAG_LABEL, speciesMatches, type Species, type SpeciesTag } from "@/lib/catalog";
import { isCustomSpecies, useCatalog, useCustomSpecies } from "@/lib/custom-species";
import { Photo, thumbSrc } from "@/components/photo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AddSpeciesForm } from "@/components/add-species-form";
import { RenameSpeciesForm } from "@/components/rename-species-form";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/loai/")({
  component: SpeciesIndex,
  head: () => ({
    links: SPECIES.slice(0, 3).map((s) => ({
      rel: "preload" as const,
      as: "image",
      href: thumbSrc(s.image),
      type: "image/webp",
    })),
  }),
});

const FILTERS: { id: "all" | SpeciesTag; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "quy", label: TAG_LABEL.quy },
  { id: "trong", label: TAG_LABEL.trong },
  { id: "bao-ton", label: TAG_LABEL["bao-ton"] },
  { id: "ngap-man", label: TAG_LABEL["ngap-man"] },
  { id: "nui", label: TAG_LABEL.nui },
];

function SpeciesIndex() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Species | null>(null);
  const catalog = useCatalog();
  const add = useCustomSpecies((s) => s.add);
  const remove = useCustomSpecies((s) => s.remove);
  const rename = useCustomSpecies((s) => s.rename);
  const navigate = useNavigate();
  const hash = useRouterState({ select: (s) => s.location.hash });

  const list = useMemo(() => {
    return catalog.filter((s) => {
      if (tag !== "all" && !s.tags.includes(tag)) return false;
      return speciesMatches(s, q);
    });
  }, [catalog, q, tag]);

  useLayoutEffect(() => {
    const fromHash = decodeURIComponent(hash.replace(/^#/, ""));
    const fromDetail = sessionStorage.getItem("loai-from-detail") ?? "";
    sessionStorage.removeItem("loai-from-detail");
    const id = fromHash || fromDetail;
    if (!id) return;
    document.getElementById(`loai-${id}`)?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [hash, list.length]);

  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <div className="flex flex-col items-center text-center">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted uppercase">Danh lục</p>
          <h1 className="font-display mt-2 whitespace-nowrap text-3xl italic md:text-4xl">Loài cây lâm nghiệp</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4">
              <Plus />
              Thêm loài
            </Button>
          </DialogTrigger>
          <DialogContent title="Thêm loài mới">
            <AddSpeciesForm
              key={open ? q.trim() || "new" : "idle"}
              initialName={list.length === 0 ? q.trim() : ""}
              onSubmit={(draft) => {
                const slug = add(draft);
                setOpen(false);
                if (slug) void navigate({ to: "/loai/$slug", params: { slug } });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Gõ để tìm tên Việt, Latin, họ…"
          aria-label="Tìm loài"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTag(f.id)}
              className={cn(
                "h-11 rounded-full px-4 text-sm font-medium transition-colors duration-(--motion-quick)",
                tag === f.id ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s, i) => (
          <article
            key={s.slug}
            id={`loai-${s.slug}`}
            className="relative overflow-hidden rounded-lg bg-bg-elevated shadow-(--shadow-border) transition-transform duration-(--motion-quick) hover:-translate-y-0.5"
          >
            <Link to="/loai/$slug" params={{ slug: s.slug }} className="block">
              {s.image ? (
                <Photo
                  src={thumbSrc(s.image)}
                  alt={s.name}
                  width={640}
                  height={480}
                  sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
                  loading={i < 3 ? "eager" : "lazy"}
                  fetchPriority={i < 3 ? "high" : "low"}
                  className="aspect-photo w-full object-cover"
                />
              ) : (
                <div className="aspect-photo flex items-center justify-center bg-bg-subtle">
                  <Trees className="size-8 text-muted" />
                </div>
              )}
              <div className="p-4">
                <p className="text-xs text-muted italic">{s.latin}</p>
                <h2 className="font-display text-2xl italic">{s.name}</h2>
                <p className="mt-1 text-sm text-muted">{s.status}</p>
              </div>
            </Link>
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                type="button"
                aria-label={`Sửa tên ${s.name}`}
                className="flex size-11 items-center justify-center rounded-sm bg-bg/80 text-muted hover:bg-bg-subtle hover:text-fg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditing(s);
                }}
              >
                <Pencil className="size-4" />
              </button>
              {isCustomSpecies(s.slug) ? (
                <button
                  type="button"
                  aria-label={`Xóa loài ${s.name}`}
                  className="flex size-11 items-center justify-center rounded-sm bg-bg/80 text-muted hover:bg-danger hover:text-fg"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    remove(s.slug);
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <p className="text-muted">Không có loài khớp từ khóa.</p>
          {q.trim() ? (
            <Button className="mt-6" onClick={() => setOpen(true)}>
              <Plus />
              Thêm loài «{q.trim()}»
            </Button>
          ) : null}
        </div>
      ) : null}

      <Dialog open={Boolean(editing)} onOpenChange={(next) => !next && setEditing(null)}>
        <DialogContent title="Sửa tên loài">
          {editing ? (
            <RenameSpeciesForm
              key={editing.slug}
              name={editing.name}
              onSubmit={(name) => {
                rename(editing.slug, name);
                setEditing(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
