"use client";

import { useEffect } from "react";

/**
 * Dialog/Select content renders through a portal into document.body, outside
 * the .admin-shell wrapper div, so the --radius: 0 override on that wrapper
 * never cascades to portaled content. Applying the same class to <body>
 * while an admin page is mounted fixes every current and future modal.
 */
export function AdminRadiusScope() {
  useEffect(() => {
    document.body.classList.add("admin-shell");
    return () => {
      document.body.classList.remove("admin-shell");
    };
  }, []);

  return null;
}
