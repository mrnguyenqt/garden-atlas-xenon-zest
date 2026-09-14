import { createFileRoute, Link } from "@tanstack/react-router";
import { FOREST_TYPES } from "@/lib/catalog";
import { Photo, thumbSrc } from "@/components/photo";

export const Route = createFileRoute("/kien-thuc/")({ component: Knowledge });

function Knowledge() {
  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <p className="text-xs tracking-[0.2em] text-muted uppercase">Thảm thực vật</p>
      <h1 className="font-display mt-2 text-4xl italic">Kiểu rừng Việt Nam</h1>
      <p className="mt-3 max-w-prose text-muted">
        Theo truyền thống Thái Văn Trừng và thực tiễn điều tra quy hoạch: từ rừng mưa thường xanh đến khộp, thông núi, ngập mặn và rừng trồng.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {FOREST_TYPES.map((f) => (
          <Link
            key={f.slug}
            to="/kien-thuc/$slug"
            params={{ slug: f.slug }}
            className="overflow-hidden rounded-lg bg-bg-elevated shadow-(--shadow-border) transition-transform duration-(--motion-quick) hover:-translate-y-0.5"
          >
            <Photo
              src={thumbSrc(f.image)}
              alt={f.name}
              width={640}
              height={480}
              className="aspect-photo w-full object-cover"
            />
            <div className="p-5">
              <h2 className="font-display text-2xl italic">{f.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{f.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
