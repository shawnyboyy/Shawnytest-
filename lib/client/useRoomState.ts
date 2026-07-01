"use client";

import { useCallback, useEffect, useState } from "react";
import { getRoomState, type RoomStateDTO } from "./api";

const POLL_INTERVAL_MS = 5000;

export function useRoomState(roomCode: string, token: string | null) {
  const [state, setState] = useState<RoomStateDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const next = await getRoomState(roomCode, token);
      setState(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room state");
    }
  }, [roomCode, token]);

  useEffect(() => {
    if (!token) return;

    // Fetch-on-mount-then-poll: the initial call's setState happens after the
    // fetch's await, not synchronously, so this doesn't cascade-render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [token, refresh]);

  const loading = token !== null && state === null && error === null;

  return { state, error, loading, refresh };
}
