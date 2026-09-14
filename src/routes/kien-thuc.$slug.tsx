import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getForest, getSpecies } from "@/lib/catalog";
import { Photo, thumbSrc, webpSrc } from "@/components/photo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/kien-thuc/$slug")({
  component: ForestDetail,
});

function ForestDetail() {
  const { slug } = Route.useParams();
  const f = getForest(slug);
  if (!f) {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <p className="text-muted">Không tìm thấy kiểu rừng này.</p>
        <Button asChild className="mt-6">
          <Link to="/kien-thuc">Về kiểu rừng</Link>
        </Button>
      </div>
    );
  }
  const related = f.species.map((id) => getSpecies(id)).filter(Boolean);

  return (
    <article>
      <div className="relative h-80 overflow-hidden md:h-96">
        <Photo
          src={webpSrc(f.image)}
          alt={f.name}
          width={1280}
          height={960}
          loading="eager"
          fetchPriority="high"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-content px-5 pb-6 md:px-10">
          <Button asChild className="mb-4">
            <Link to="/kien-thuc">
              <ArrowLeft />
              Kiểu rừng
            </Link>
          </Button>
          <h1 className="font-display max-w-prose text-4xl italic md:text-5xl">{f.name}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10">
        <p className="text-sm text-muted">{f.region}</p>
        <p className="mt-4 max-w-prose text-lg leading-relaxed">{f.summary}</p>

        <section className="mt-10">
          <h2 className="font-display text-2xl italic">Cấu trúc</h2>
          <p className="mt-3 max-w-prose text-muted">{f.structure}</p>
        </section>
        <section className="mt-8">
          <h2 className="font-display text-2xl italic">Quản lý</h2>
          <p className="mt-3 max-w-prose text-muted">{f.management}</p>
        </section>

        {related.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl italic">Loài điển hình</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {related.map((s) =>
                s ? (
                  <li key={s.slug}>
                    <Link
                      to="/loai/$slug"
                      params={{ slug: s.slug }}
                      className="flex items-center gap-3 rounded-lg bg-bg-elevated p-3 shadow-(--shadow-border)"
                    >
                      <Photo
                        src={thumbSrc(s.image)}
                        alt=""
                        width={112}
                        height={84}
                        className="size-14 rounded-sm object-cover"
                      />
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs italic text-muted">{s.latin}</p>
                      </div>
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
