"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRoomState, type RoomStateDTO } from "./api";

const POLL_INTERVAL_MS = 5000;

export function useRoomState(roomCode: string, token: string | null) {
  const [state, setState] = useState<RoomStateDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const refresh = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    try {
      const next = await getRoomState(roomCode, currentToken);
      setState(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room state");
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (!cancelled && document.visibilityState === "visible") {
        void refresh();
      }
    };

    void refresh();
    intervalId = setInterval(tick, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [token, refresh]);

  return { state, error, loading, refresh };
}
