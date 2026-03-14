import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { useState } from "react";
import { useLocalProfile } from "../hooks/useLocalProfile";

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { profile, setProfile } = useLocalProfile();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const name = displayName.trim();
    if (!name) return;
    setProfile(name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

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
          gap: "12px",
          padding: "16px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--card)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          data-ocid="profile.cancel_button"
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
            flexShrink: 0,
          }}
          aria-label="Go back"
        >
          <ArrowLeft style={{ width: "20px", height: "20px" }} />
        </button>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--foreground)",
            flex: 1,
          }}
        >
          Profile Settings
        </h1>
      </div>

      {/* Form */}
      <div
        style={{
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            htmlFor="displayName"
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setSaved(false);
            }}
            placeholder="Enter your display name"
            data-ocid="profile.input"
            style={{
              width: "100%",
              minHeight: "52px",
              padding: "0 16px",
              borderRadius: "12px",
              border: "1.5px solid var(--border)",
              backgroundColor: "var(--card)",
              fontSize: "16px",
              color: "var(--foreground)",
              outline: "none",
            }}
            autoComplete="name"
          />
        </div>

        {saved && (
          <div
            data-ocid="profile.success_state"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 16px",
              borderRadius: "12px",
              backgroundColor: "rgba(22,163,74,0.1)",
              border: "1px solid rgba(22,163,74,0.25)",
            }}
          >
            <CheckCircle2
              style={{
                width: "18px",
                height: "18px",
                color: "#16a34a",
                flexShrink: 0,
              }}
            />
            <div>
              <p
                style={{ fontSize: "14px", fontWeight: 700, color: "#16a34a" }}
              >
                Saved!
              </p>
              <p style={{ fontSize: "12px", color: "#16a34a", opacity: 0.8 }}>
                Name updated to "{displayName.trim()}"
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!displayName.trim()}
          data-ocid="profile.save_button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: "16px",
            borderRadius: "14px",
            border: "none",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            fontSize: "16px",
            fontWeight: 700,
            cursor: displayName.trim() ? "pointer" : "not-allowed",
            opacity: displayName.trim() ? 1 : 0.5,
          }}
        >
          <Save style={{ width: "18px", height: "18px" }} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
