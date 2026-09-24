"use client";

// No real auth for this MVP — a person's identity within a group is just a
// name they picked, remembered in this browser via localStorage. Anyone with
// the invite link can join as themselves; nothing here is a security
// boundary, it's a demo-grade "who am I on this device" convenience.

export interface Identity {
  userId: string;
  name: string;
  emoji: string;
}

function key(groupId: string) {
  return `sff:identity:${groupId}`;
}

export function getIdentity(groupId: string): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(groupId));
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

export function setIdentity(groupId: string, identity: Identity) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(groupId), JSON.stringify(identity));
  } catch {
    // ignore — private browsing / storage disabled
  }
}

export function clearIdentity(groupId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(groupId));
  } catch {
    // ignore
  }
}
