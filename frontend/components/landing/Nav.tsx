import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { TraceLogo } from "@/components/brand/TraceLogo";

export function Nav() {
  return (
    <nav className="nav">
      <a className="logo flex items-center gap-2.5 group" href="#top" title="TRACE — Home">
        <TraceLogo size="sm" />
      </a>
      <div className="links">
        <a href="#score">Score vs evidence</a>
        <a href="#how">How a case runs</a>
        <a href="#outcomes">Outcomes</a>
        <a href="#patterns">Patterns</a>
      </div>
      <div className="nav-r">
        <StatusIndicator label="AGENT ONLINE" tone="green" />
        <a className="btn" href="/investigations" style={{ padding: "8px 16px", fontSize: "12px" }}>
          See a live case →
        </a>
      </div>
    </nav>
  );
}
