import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const DISMISS_KEY = "gojito.betaBanner.dismissed";

export function HubBetaBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!mounted || dismissed) return null;

  const banner = (
    <div className="gojito-beta-banner" role="status">
      <div className="gojito-beta-banner__inner">
        <p>
          <strong>Beta preview</strong> — Gojito Games is in limited testing. Saves, access tiers,
          and some modes may change. Report issues from the account menu.
        </p>
        <button
          type="button"
          className="gojito-beta-banner__dismiss"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );

  const target = document.getElementById("gojito-beta-banner-root");
  if (target) return createPortal(banner, target);
  return banner;
}
