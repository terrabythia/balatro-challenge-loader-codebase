"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export default function GuestActions({ hasDrafts }: { hasDrafts: boolean }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function handleLogout(deleteDrafts: boolean) {
    setLoggingOut(true);
    const params = deleteDrafts ? "?deleteDrafts=1" : "";
    window.location.href = `/api/auth/logout${params}`;
  }

  function handleClick() {
    if (hasDrafts) {
      setShowConfirm(true);
    } else {
      handleLogout(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loggingOut}
        className="px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        {loggingOut ? "Logging out…" : "Log out"}
      </button>

      {showConfirm &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
              <h2 className="text-lg font-semibold">Log out as guest?</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                You are logged in as a guest, so{" "}
                <strong className="text-amber-400">all your draft challenges will be permanently deleted</strong>
                . Log in with Discord to keep and publish your work instead.
              </p>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLogout(true)}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-medium transition-colors"
                >
                  Log out &amp; delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
