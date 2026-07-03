import Link from "next/link";

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold text-lg tracking-tight">
      <span className="grid size-7 place-items-center rounded-lg bg-brand text-white text-sm font-black">
        다
      </span>
      <span>
        다트워치<span className="text-brand">.</span>
      </span>
    </Link>
  );
}
