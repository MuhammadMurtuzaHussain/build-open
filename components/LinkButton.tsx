type Props = {
  href: string;
  label: string;
  note?: string;
  variant?: "primary" | "secondary";
  size?: "lg" | "md";
};

const isExternal = (href: string) => href.startsWith("http");

export function LinkButton({ href, label, note, variant = "secondary", size = "md" }: Props) {
  const base =
    "group flex w-full items-center justify-between gap-3 rounded-xl border px-4 text-left transition-colors " +
    "focus-visible:outline-offset-2 active:scale-[0.99]";
  const sizes = size === "lg" ? "min-h-16 py-4 text-lg" : "min-h-14 py-3 text-base";
  const variants =
    variant === "primary"
      ? "border-pink bg-pink text-ink hover:bg-pink-soft"
      : "border-line bg-ink-2/80 text-paper hover:border-pink hover:bg-ink-3";

  return (
    <a
      href={href}
      {...(isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`${base} ${sizes} ${variants}`}
    >
      <span className="flex flex-col">
        <span className="font-bold leading-tight">{label}</span>
        {note && (
          <span className={`text-sm ${variant === "primary" ? "text-ink/80" : "text-muted"}`}>{note}</span>
        )}
      </span>
      <span aria-hidden="true" className="font-mono text-xl transition-transform group-hover:translate-x-0.5">
        ↗
      </span>
      {isExternal(href) && <span className="sr-only">(opens in a new tab)</span>}
    </a>
  );
}
