import { User, WifiOff } from "lucide-react";
import { useLocalProfile } from "../hooks/useLocalProfile";
import {
  useGetMultipleUserProfiles,
  useGetOnlineUsers,
} from "../hooks/useQueries";

export default function OnlineUsers() {
  const { data: principals = [], isLoading } = useGetOnlineUsers();
  const { data: profiles = {} } = useGetMultipleUserProfiles(principals);
  const { profile } = useLocalProfile();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "var(--foreground)",
          }}
        >
          Online Users
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--muted-foreground)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              display: "inline-block",
            }}
          />
          {principals.length} online
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "64px",
                borderRadius: "14px",
                backgroundColor: "var(--muted)",
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      ) : principals.length === 0 ? (
        <div
          data-ocid="users.empty_state"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 16px",
            gap: "12px",
            textAlign: "center",
          }}
        >
          <WifiOff
            style={{
              width: "48px",
              height: "48px",
              color: "var(--muted-foreground)",
              opacity: 0.5,
            }}
          />
          <p
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            No users online
          </p>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
            Share the app link to see others here
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {principals.map((p, idx) => {
            const prof = profiles[p.toString()] as {
              displayName?: string;
            } | null;
            const name = prof?.displayName || `User ${idx + 1}`;
            const isYou = profile?.displayName === name;
            return (
              <div
                key={p.toString()}
                data-ocid={`users.item.${idx + 1}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(37,99,235,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User
                    style={{
                      width: "20px",
                      height: "20px",
                      color: "var(--primary)",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "15px",
                      color: "var(--foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                    {isYou && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "12px",
                          fontWeight: 400,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        (You)
                      </span>
                    )}
                  </p>
                </div>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    flexShrink: 0,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
