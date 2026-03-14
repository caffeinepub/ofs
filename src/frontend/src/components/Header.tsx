import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
      <div
        style={{
          display: "flex",
          height: "56px",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        {/* Logo + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "14px",
                letterSpacing: "0.5px",
              }}
            >
              OFS
            </span>
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "-0.3px",
              color: "var(--foreground)",
            }}
          >
            File Sharing
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="h-10 w-10"
            aria-label="Toggle theme"
            data-ocid="header.toggle"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/menu" })}
            className="h-10 w-10"
            style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}
            aria-label="Open menu"
            data-ocid="header.open_modal_button"
          >
            <Menu className="h-5 w-5" style={{ color: "var(--primary)" }} />
          </Button>
        </div>
      </div>
    </header>
  );
}
