import { useEffect, useState } from "react";
import { isPhotoRef, photoObjectUrl, photoRefId } from "@/lib/photo-db";
import { cn } from "@/lib/utils";

export function StoredImg({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [url, setUrl] = useState(() => (isPhotoRef(src) ? "" : src));

  useEffect(() => {
    if (!isPhotoRef(src)) {
      setUrl(src);
      return;
    }
    let live = true;
    setUrl("");
    void photoObjectUrl(photoRefId(src)).then((next) => {
      if (live) setUrl(next);
    });
    return () => {
      live = false;
    };
  }, [src]);

  if (!url) return <span className={cn("block bg-bg-subtle", className)} />;
  return <img src={url} alt={alt} className={className} />;
}
