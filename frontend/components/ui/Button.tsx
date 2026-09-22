import Link from "next/link";
import { cn } from "@/lib/utils";

interface BaseProps {
  variant?: "primary" | "ghost" | "line";
  className?: string;
  children: React.ReactNode;
}
type ButtonProps = BaseProps &
  ({ href: string; onClick?: never } | { href?: undefined; onClick?: () => void; type?: "button" | "submit" });

const styles = {
  primary:
    "inline-flex items-center bg-orange text-white border border-orange px-5 py-3 rounded-lg font-semibold text-[13px] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(236,100,8,0.25)]",
  ghost:
    "inline-flex items-center bg-white/[.02] border border-white/10 text-[#b4bdc6] font-medium px-5 py-3 rounded-lg text-[13px] transition-colors hover:bg-white/[.06]",
  line: "inline-flex items-center border border-orange/60 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors hover:bg-orange",
};

export function Button({ variant = "primary", className, children, ...rest }: ButtonProps) {
  const cls = cn(styles[variant], className);
  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={cls}>
        {children}
      </Link>
    );
  }
  // `rest` is the button-flavored branch of the union here (href is undefined); cast is local and narrow.
  const btnProps = rest as { type?: "button" | "submit"; onClick?: () => void };
  return (
    <button type={btnProps.type ?? "button"} onClick={btnProps.onClick} className={cls}>
      {children}
    </button>
  );
}
