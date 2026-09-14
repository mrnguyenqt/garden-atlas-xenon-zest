import { cn } from "@/lib/utils";

export function thumbSrc(image: string) {
  if (image.startsWith("data:") || image.startsWith("blob:")) return image;
  const file = image.split("/").pop()?.replace(/\.jpe?g$/i, ".webp") ?? "";
  return `/images/thumbs/${file}`;
}

export function webpSrc(image: string) {
  if (image.startsWith("data:") || image.startsWith("blob:")) return image;
  return image.replace(/\.jpe?g$/i, ".webp");
}

export function Photo({
  src,
  alt,
  className,
  width,
  height,
  sizes,
  loading = "lazy",
  fetchPriority = "auto",
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      className={cn(
        "bg-bg-subtle outline outline-1 -outline-offset-1 outline-fg/10",
        className,
      )}
    />
  );
}
