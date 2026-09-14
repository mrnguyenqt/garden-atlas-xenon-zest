import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { speciesLeafSrc, speciesTreeSrc, TAG_LABEL } from "@/lib/catalog";
import { findSpecies, isCustomSpecies, useCustomSpecies } from "@/lib/custom-species";
import { Photo, webpSrc } from "@/components/photo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RenameSpeciesForm } from "@/components/rename-species-form";
import { nf2 } from "@/lib/utils";

export const Route = createFileRoute("/loai/$slug")({
  component: SpeciesDetail,
});

function SpeciesDetail() {
  const { slug } = Route.useParams();
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    sessionStorage.setItem("loai-from-detail", slug);
  }, [slug]);
  useCustomSpecies((s) => s.items);
  useCustomSpecies((s) => s.renames);
  const remove = useCustomSpecies((s) => s.remove);
  const rename = useCustomSpecies((s) => s.rename);
  const navigate = useNavigate();
  const s = findSpecies(slug);
  if (!s) {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <p className="text-muted">Không tìm thấy loài này.</p>
        <Button asChild className="mt-6">
          <Link to="/loai">Về danh lục</Link>
        </Button>
      </div>
    );
  }

  const custom = isCustomSpecies(s.slug);
  const customItem = useCustomSpecies.getState().items.find((i) => i.slug === slug);
  const treePhoto = custom ? customItem?.treeImage || s.image : "";
  const leafPhoto = custom ? customItem?.leafImage || "" : "";
  const treeSrc = speciesTreeSrc(s.slug);
  const leafSrc = speciesLeafSrc(s.slug);

  return (
    <article>
      <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
        <Button asChild className="mb-6">
          <Link to="/loai" hash={slug} resetScroll={false}>
            <ArrowLeft />
            Danh lục
          </Link>
        </Button>
        <p className="text-sm italic text-primary">{s.latin}</p>
        <div className="mt-1 flex items-start gap-2">
          <h1 className="font-display text-4xl italic md:text-5xl">{s.name}</h1>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Sửa tên ${s.name}`}
            onClick={() => setEditing(true)}
          >
            <Pencil />
          </Button>
        </div>

        {s.image && !custom ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <figure>
              <Photo
                src={webpSrc(treeSrc)}
                alt={`Cây ${s.name} (${s.latin}) ngoài hiện trường`}
                width={1024}
                height={768}
                loading="eager"
                fetchPriority="high"
                className="aspect-photo w-full rounded-lg object-cover"
              />
              <figcaption className="mt-2 text-sm text-muted">Cây</figcaption>
            </figure>
            <figure>
              <Photo
                src={webpSrc(leafSrc)}
                alt={`Lá ${s.name} (${s.latin})`}
                width={1024}
                height={768}
                className="aspect-photo w-full rounded-lg object-cover"
              />
              <figcaption className="mt-2 text-sm text-muted">Lá</figcaption>
            </figure>
          </div>
        ) : null}

        {custom && (treePhoto || leafPhoto) ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {treePhoto ? (
              <figure>
                <Photo
                  src={treePhoto}
                  alt={`Cây ${s.name}`}
                  width={960}
                  height={720}
                  loading="eager"
                  fetchPriority="high"
                  className="aspect-photo w-full rounded-lg object-cover"
                />
                <figcaption className="mt-2 text-sm text-muted">Cây</figcaption>
              </figure>
            ) : null}
            {leafPhoto ? (
              <figure>
                <Photo
                  src={leafPhoto}
                  alt={`Lá ${s.name}`}
                  width={960}
                  height={720}
                  className="aspect-photo w-full rounded-lg object-cover"
                />
                <figcaption className="mt-2 text-sm text-muted">Lá</figcaption>
              </figure>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2">
          {s.tags.map((t) => (
            <Badge key={t}>{TAG_LABEL[t]}</Badge>
          ))}
          <Badge tone={s.status.includes("Nguy") ? "danger" : "default"}>{s.status}</Badge>
        </div>

        {s.family || !custom ? (
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {s.family ? <Fact label="Họ" value={s.family} /> : null}
            {custom ? null : (
              <>
                <Fact label="Mật độ gỗ ρ" value={`${nf2.format(s.woodDensity)} g/cm³`} />
                <Fact label="Hệ số hình dạng f" value={nf2.format(s.formFactor)} />
              </>
            )}
          </dl>
        ) : null}

        {s.notes ? (
          <div className="mt-10">
            <Block title="Ghi chú">{s.notes}</Block>
          </div>
        ) : null}

        {custom ? null : (
          <>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <Block title="Phân bố">{s.habitat}</Block>
              <Block title="Công dụng">{s.uses}</Block>
              <Block title="Chu kỳ">{s.rotation}</Block>
              <Block title="Ghi chú hiện trường">{s.notes}</Block>
            </div>
            <section className="mt-8 rounded-xl bg-bg-elevated p-5 shadow-(--shadow-border) md:p-6">
              <h2 className="font-display text-2xl italic">Lâm sinh</h2>
              <p className="mt-3 max-w-prose text-muted">{s.silviculture}</p>
            </section>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/o-mau">Thêm cây này vào điều tra rừng</Link>
          </Button>
          {custom ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Xóa loài ${s.name}`}
              onClick={() => {
                remove(s.slug);
                void navigate({ to: "/loai" });
              }}
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogContent title="Sửa tên loài">
            <RenameSpeciesForm
              key={s.name}
              name={s.name}
              onSubmit={(name) => {
                rename(s.slug, name);
                setEditing(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg-elevated p-4 shadow-(--shadow-border)">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: string }) {
  return (
    <section>
      <h2 className="text-sm font-medium tracking-wide text-muted uppercase">{title}</h2>
      <p className="mt-2 max-w-prose text-fg/90">{children}</p>
    </section>
  );
}
