"use client";
import { useSyncExternalStore } from "react";

const empty = () => () => {};

export function useIsClient() {
  return useSyncExternalStore(empty, () => true, () => false);
}
