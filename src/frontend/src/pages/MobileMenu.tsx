import { Home, Settings, X } from "lucide-react";

interface MobileMenuProps {
  onNavigateToProfile?: () => void;
  onClose?: () => void;
}

export default function MobileMenu({
  onNavigateToProfile,
  onClose,
}: MobileMenuProps) {
  const menuItems = [
    { id: "home", label: "Home", icon: Home, action: onClose },
    {
      id: "profile",
      label: "Profile Settings",
      icon: Settings,
      action: onNavigateToProfile,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        backgroundColor: "var(--background)",
        display: "flex",
        flexDirection: "column",
        maxWidth: "430px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 800, fontSize: "11px" }}>
              OFS
            </span>
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--foreground)",
            }}
          >
            Menu
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          data-ocid="menu.close_button"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--foreground)",
          }}
        >
          <X style={{ width: "20px", height: "20px" }} />
        </button>
      </div>

      {/* Menu Items */}
      <div
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              data-ocid={`menu.${item.id}.button`}
              onClick={item.action}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "18px 16px",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(37,99,235,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon
                  style={{
                    width: "22px",
                    height: "22px",
                    color: "var(--primary)",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
