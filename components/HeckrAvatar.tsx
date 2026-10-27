/** Heckr's face. Decorative: the name always appears next to it as text. */
export function HeckrAvatar({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    // Plain <img>: a 13 KB static file doesn't need the image optimiser.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/heckr.jpg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ring-2 ring-pink ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
