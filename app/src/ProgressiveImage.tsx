import { useEffect, useRef, useState } from "react";

/** Reserved image space prevents layout shifts; shimmer follows actual loading. */
export default function ProgressiveImage({
  src,
  alt,
  eager = false,
}: {
  src: string;
  alt: string;
  eager?: boolean;
}) {
  const image = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  useEffect(() => {
    if (image.current?.complete) {
      setStatus(image.current.naturalWidth ? "loaded" : "error");
    } else {
      setStatus("loading");
    }
  }, [src]);
  return (
    <span
      className={`progressive-image is-${status}`}
      aria-busy={status === "loading"}
    >
      {status === "loading" && (
        <span className="image-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      )}
      <img
        ref={image}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
      {status === "error" && (
        <span className="image-error" role="status">
          تعذّر تحميل الصورة. يمكنك متابعة قراءة تفاصيل المشروع.
        </span>
      )}
    </span>
  );
}
