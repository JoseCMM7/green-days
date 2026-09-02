import Image from "next/image";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark-compact" : ""}`}>
      <Image
        src="/green-days-logo.png"
        alt="Green Days"
        width={647}
        height={647}
        priority
        className="brand-mark-image"
      />
      <span className="sr-only">Guarda la vida</span>
    </div>
  );
}
