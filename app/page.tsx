"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from "react";
import { Home, Archive, Plus, X, Play, Square, Pause, Coffee, Crown, CreditCard, BookOpen, ChevronRight, Edit3, Check, ToggleLeft, ToggleRight, Info, ChevronLeft, GripVertical, Trash2, Settings, LogOut, UserX, Shield, LayoutGrid, CalendarClock, RotateCcw, Mail, Lock, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { getSupabase, isSupabaseConfigured, setSupabaseRuntimeConfig } from "@/lib/supabase/client";

// ═══════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════

const CARD_PRESETS = [
  { id: "midnight", name: "미드나이트", gradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", patternClass: "card-grid-pattern", textColor: "#E8E8FF" },
  { id: "obsidian-gold", name: "오브시디안 골드", gradient: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 40%, #1a0208 100%)", patternClass: "card-wave-pattern", textColor: "#93C5FD" },
  { id: "aurora", name: "오로라", gradient: "linear-gradient(135deg, #0d1b2a 0%, #1b4332 50%, #1e3a5f 100%)", patternClass: "card-grid-pattern", textColor: "#A8FFCE" },
  { id: "crimson-night", name: "크림슨 나이트", gradient: "linear-gradient(135deg, #1a0a0a 0%, #3d0c02 50%, #1a0505 100%)", patternClass: "card-wave-pattern", textColor: "#FFB5A7" },
  { id: "steel-blue", name: "스틸 블루", gradient: "linear-gradient(135deg, #0d1b2a 0%, #1c3d5a 50%, #0a2540 100%)", patternClass: "card-grid-pattern", textColor: "#90CDF4" },
  { id: "march-holographic", name: "홀로그래픽", gradient: "linear-gradient(135deg, #1a0533 0%, #0a1628 25%, #0d2b1f 50%, #1a0d05 75%, #1a0533 100%)", patternClass: "card-holographic card-grid-pattern", textColor: "#FFE5F0", limited: "3월 한정" },
];

const getPreset = (id: string) => CARD_PRESETS.find((p) => p.id === id) || CARD_PRESETS[0];

const formatSeconds = (secs: number) => {
  if (!secs) return "0s";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const getBreakRatioMessage = (breakRatio: number) => {
  if (breakRatio < 10) return "거의 쉬지 않고 달리는 중이에요";
  if (breakRatio < 25) return "적당히 쉬며 집중하고 있어요";
  if (breakRatio < 40) return "여유 있는 리듬으로 진행 중이에요";
  return "충분히 재충전하며 진행하고 있어요";
};

const formatSecondsShort = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const formatDateInputValue = (isoString: string) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

const getDdayLabel = (deadline?: string) => {
  if (!deadline?.trim()) return "기한 없음";
  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) return "기한 미정";
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.ceil((startOfTarget.getTime() - startOfToday.getTime()) / 86400000);
  if (diffDays > 0) return `D-${diffDays}`;
  if (diffDays === 0) return "D-DAY";
  return `D+${Math.abs(diffDays)}`;
};

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** 로고 스택 최상단 레이어 — 마스터 카드 강조용 */
const MASTER_BRAND_RED = "#F43F5E";

/** 마스터 골드/실버 등급 뱃지·상단 리본 (메탈 톤) */
const GOLD_METAL_RIBBON =
  "linear-gradient(90deg, #8B6914 0%, #D4AF37 18%, #FFD700 38%, #FFF4B8 50%, #FFD700 62%, #C5A028 82%, #7A5C0C 100%)";
const SILVER_METAL_RIBBON =
  "linear-gradient(90deg, #4B5563 0%, #9CA3AF 22%, #E8EAEF 48%, #F9FAFB 52%, #C4C8D0 72%, #6B7280 100%)";
const GOLD_BADGE_COLOR = "#FFD966";
const SILVER_BADGE_COLOR = "#D1D5DB";
const GOLD_BADGE_SHADOW = "0 0 10px rgba(255, 215, 0, 0.45), 0 1px 2px rgba(0,0,0,0.5)";
const SILVER_BADGE_SHADOW = "0 0 8px rgba(255, 255, 255, 0.35), 0 1px 2px rgba(0,0,0,0.45)";

/** 카드 체크리스트: 한 페이지에 보이는 개수 (넘치면 옆으로 페이지 이동) */
const CHECKLIST_ITEMS_PER_PAGE = 8;
/** 전체 항목 상한 (로컬 저장·성능) */
const CHECKLIST_MAX_TOTAL = 500;

function regularVisibleToday(c: RegularCard, now = new Date()): boolean {
  if (c.isCompleted) return false;
  const today = now.toISOString().split("T")[0];
  if (!c.isScheduled) {
    return c.date === today;
  }
  const timeStr = c.scheduleTime;
  const afterScheduledTime = () => {
    if (!timeStr) return true;
    const parts = timeStr.split(":");
    const hh = parseInt(parts[0] ?? "0", 10);
    const mm = parseInt(parts[1] ?? "0", 10);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return true;
    return now.getHours() * 60 + now.getMinutes() >= hh * 60 + mm;
  };
  if (!afterScheduledTime()) return false;

  const mode = c.scheduleMode ?? "daily";
  if (mode === "once") {
    return (c.scheduleDate ?? c.date) === today;
  }
  if (mode === "daily") {
    return true;
  }
  if (mode === "weekly") {
    const dow = now.getDay();
    const days = c.scheduleWeekdays ?? [];
    return days.length === 0 ? true : days.includes(dow);
  }
  return false;
}

function formatScheduleSummary(c: RegularCard): string {
  if (!c.isScheduled) return "";
  const mode = c.scheduleMode ?? "daily";
  const t = c.scheduleTime ? ` ${c.scheduleTime}` : "";
  if (mode === "once") {
    return `1회 ${c.scheduleDate ?? c.date}${t}`;
  }
  if (mode === "daily") {
    return `매일${t}`;
  }
  const labels = ["일", "월", "화", "수", "목", "금", "토"];
  const days = (c.scheduleWeekdays ?? []).map((i) => labels[i]).join(",");
  return `매주 ${days || "—"}${t}`;
}

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface Profile {
  name: string;
  job: string;
  age: string;
  vision: string;
  avatarColor: string;
}

interface Session {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  breakDuration: number;
  breaks: unknown[];
}

interface MasterCard {
  id: string;
  type: "master";
  name: string;
  designPresetId: string;
  createdAt: string;
  status: "active" | "gold" | "silver";
  hasGoal?: boolean;
  goalContent?: string;
  goalDeadline?: string;
}

interface RegularCard {
  id: string;
  type: "regular";
  name: string;
  masterId: string;
  designPresetId: string;
  createdAt: string;
  date: string;
  sessions: Session[];
  totalWorkSeconds: number;
  totalBreakSeconds: number;
  isWorking: boolean;
  isPaused: boolean;
  currentSessionStart: string | null;
  currentBreakStart: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  isScheduled?: boolean;
  /** once: 특정 일 1회 / daily / weekly */
  scheduleMode?: "once" | "daily" | "weekly";
  /** YYYY-MM-DD (once) */
  scheduleDate?: string;
  /** HH:mm */
  scheduleTime?: string;
  /** 0=일 … 6=토 */
  scheduleWeekdays?: number[];
  presetId?: string;
}

interface RecipeCard {
  id: string;
  type: "recipe";
  name: string;
  masterId: string;
  designPresetId: string;
  createdAt: string;
  content?: string;
}

interface PresetCard {
  id: string;
  type: "preset";
  name: string;
  masterId: string;
  designPresetId: string;
  createdAt: string;
}

type Card = MasterCard | RegularCard | RecipeCard | PresetCard;

interface AppState {
  /** Supabase 세션 확인 전에는 false — 로그인 화면 깜빡임 방지 */
  authReady: boolean;
  isLoggedIn: boolean;
  profile: Profile;
  masterCards: MasterCard[];
  presetCards: PresetCard[];
  regularCards: RegularCard[];
  recipeCards: RecipeCard[];
  activeTab: "home" | "vault";
  tick: number;
  isAdmin: boolean;
  redeemedCouponIds: string[];
}

interface AppContextType extends AppState {
  logout: () => Promise<void>;
  applyCouponCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  updateProfile: (p: Partial<Profile>) => void;
  setActiveTab: (tab: "home" | "vault") => void;
  addMasterCard: (card: Omit<MasterCard, "id" | "createdAt" | "status">) => MasterCard;
  updateMasterCard: (
    id: string,
    updates: Partial<Pick<MasterCard, "name" | "designPresetId" | "hasGoal" | "goalContent" | "goalDeadline">>,
  ) => void;
  addRegularCard: (card: Omit<RegularCard, "id" | "createdAt" | "date" | "sessions" | "totalWorkSeconds" | "totalBreakSeconds" | "isWorking" | "isPaused" | "currentSessionStart" | "currentBreakStart" | "isCompleted" | "completedAt"> & { date?: string }) => RegularCard;
  addPresetCard: (card: Omit<PresetCard, "id" | "createdAt">) => PresetCard;
  addRecipeCard: (card: Omit<RecipeCard, "id" | "createdAt">) => RecipeCard;
  updateRegularCard: (id: string, updates: Partial<RegularCard>) => void;
  deleteRegularCard: (id: string) => void;
  deleteMasterCard: (id: string) => void;
  deletePresetCard: (id: string) => void;
  deleteRecipeCard: (id: string) => void;
  reorderRegularCards: (ids: string[]) => void;
  completeRegularCard: (id: string) => void;
  /** 방금 완료한 카드 5초 내 실행 취소 (홈에서 완료 시) */
  pendingUndo: { id: string; until: number } | null;
  undoPendingRegularCompletion: () => void;
  /** 오늘 날짜 일반카드만 미완료로 복구 (보관함 갤러리 등) */
  revertRegularCompletion: (id: string) => void;
  /** 마스터 상태 전환 (골드 승급 시 미완료 일반카드 자동 완료) */
  setMasterStatus: (id: string, status: MasterCard["status"]) => void;
  completeMasterCard: (id: string, asGold: boolean) => void;
  startWork: (cardId: string) => void;
  stopWork: (cardId: string) => void;
  pauseWork: (cardId: string) => void;
  resumeWork: (cardId: string) => void;
  startBreak: (cardId: string) => void;
  endBreak: (cardId: string) => void;
  getLiveWorkSeconds: (card: RegularCard) => number;
  getLiveBreakSeconds: (card: RegularCard) => number;
}

// ═══════════════════════════════════════════
// CONTEXT / STORE
// ═══════════════════════════════════════════

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = "todowallet_v3_light";
const SUPABASE_STATE_TABLE = "user_wallet_data";
const AUTO_LOGIN_PREF_KEY = "todowallet.autoLogin";

const DEFAULT_PROFILE: Profile = { name: "나", job: "직업 입력", age: "나이 입력", vision: "비전 입력", avatarColor: "#2563EB" };

type SyncedAppState = Pick<AppState, "profile" | "masterCards" | "presetCards" | "regularCards" | "recipeCards" | "redeemedCouponIds"> & {
  checklistByCard: Record<string, ChecklistItem[]>;
};

function readChecklistMapFromLocalStorage(): Record<string, ChecklistItem[]> {
  if (typeof window === "undefined") return {};
  const out: Record<string, ChecklistItem[]> = {};
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (!key.startsWith("checklist_")) continue;
      const cardId = key.slice("checklist_".length);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) out[cardId] = parsed as ChecklistItem[];
    }
  } catch {
    // ignore localStorage parse failures
  }
  return out;
}

function readChecklistMapFromMainStorage(): Record<string, ChecklistItem[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { checklistByCard?: Record<string, ChecklistItem[]> };
    if (!parsed.checklistByCard || typeof parsed.checklistByCard !== "object") return {};
    return parsed.checklistByCard;
  } catch {
    return {};
  }
}

function writeChecklistMapToMainStorage(next: Record<string, ChecklistItem[]>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, checklistByCard: next }));
  } catch {
    // ignore localStorage parse/write failures
  }
}

function replaceChecklistMapInLocalStorage(next: Record<string, ChecklistItem[]>) {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("checklist_")) {
        localStorage.removeItem(key);
      }
    }
    for (const [cardId, list] of Object.entries(next)) {
      localStorage.setItem(`checklist_${cardId}`, JSON.stringify(list));
    }
  } catch {
    // ignore localStorage write failures
  }
}

function normalizeSyncedState(raw: unknown): SyncedAppState | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<SyncedAppState>;
  return {
    profile: obj.profile ?? DEFAULT_PROFILE,
    masterCards: Array.isArray(obj.masterCards) ? obj.masterCards : [],
    presetCards: Array.isArray(obj.presetCards) ? obj.presetCards : [],
    regularCards: Array.isArray(obj.regularCards) ? obj.regularCards : [],
    recipeCards: Array.isArray(obj.recipeCards) ? obj.recipeCards : [],
    redeemedCouponIds: Array.isArray(obj.redeemedCouponIds)
      ? obj.redeemedCouponIds.map((x) => String(x))
      : [],
    checklistByCard:
      obj.checklistByCard && typeof obj.checklistByCard === "object"
        ? obj.checklistByCard
        : {},
  };
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") {
      return {
        authReady: false,
        isLoggedIn: false,
        profile: DEFAULT_PROFILE,
        masterCards: [],
        presetCards: [],
        regularCards: [],
        recipeCards: [],
        activeTab: "home",
        tick: 0,
        isAdmin: false,
        redeemedCouponIds: [],
      };
    }
    let saved: Partial<AppState> = {};
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) saved = JSON.parse(raw); } catch {}
    return {
      authReady: false,
      isLoggedIn: false,
      profile: saved.profile ?? DEFAULT_PROFILE,
      masterCards: saved.masterCards ?? [],
      presetCards: saved.presetCards ?? [],
      regularCards: saved.regularCards ?? [],
      recipeCards: saved.recipeCards ?? [],
      activeTab: "home",
      tick: 0,
      isAdmin: false,
      redeemedCouponIds: Array.isArray(saved.redeemedCouponIds) ? saved.redeemedCouponIds : [],
    };
  });

  // tick을 별도 state로 분리 → tick 변경이 localStorage 쓰기를 트리거하지 않음
  const [tick, setTick] = useState(0);
  const [checklistSyncTick, setChecklistSyncTick] = useState(0);
  const cloudUserIdRef = useRef<string | null>(null);
  const cloudHydratedRef = useRef(false);
  const cloudSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // localStorage 저장: tick/activeTab 등 제외, 실제 데이터가 바뀔 때만 실행
  const { profile: stProfile, masterCards: stMaster, presetCards: stPreset, regularCards: stRegular, recipeCards: stRecipe, redeemedCouponIds: stCoupons } = state;
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        profile: stProfile,
        masterCards: stMaster,
        presetCards: stPreset,
        regularCards: stRegular,
        recipeCards: stRecipe,
        redeemedCouponIds: stCoupons,
        checklistByCard: readChecklistMapFromLocalStorage(),
      }));
    } catch {}
  }, [stProfile, stMaster, stPreset, stRegular, stRecipe, stCoupons]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const res = await fetch("/api/auth/public-config");
        const data = (await res.json()) as { url?: string; anonKey?: string };
        if (data.url && data.anonKey) {
          setSupabaseRuntimeConfig(data.url, data.anonKey);
        }
      } catch {
        /* 서버가 env를 못 읽은 경우만 해당 */
      }

      if (cancelled) return;
      if (!isSupabaseConfigured()) {
        setState((s) => ({ ...s, isLoggedIn: false, authReady: true }));
        return;
      }
      const sb = getSupabase();
      void sb.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return;
        const allowAutoLogin = (() => {
          try {
            return localStorage.getItem(AUTO_LOGIN_PREF_KEY) !== "false";
          } catch {
            return true;
          }
        })();
        if (session && !allowAutoLogin) {
          void sb.auth.signOut().finally(() => {
            if (!cancelled) setState((s) => ({ ...s, isLoggedIn: false }));
          });
          return;
        }
        setState((s) => ({ ...s, isLoggedIn: !!session }));
      }).finally(() => {
        if (!cancelled) setState((s) => ({ ...s, authReady: true }));
      });
      const {
        data: { subscription },
      } = sb.auth.onAuthStateChange((_event, session) => {
        setState((s) => ({ ...s, isLoggedIn: !!session }));
      });
      unsubscribe = () => subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const authReady = state.authReady;
  const isLoggedIn = state.isLoggedIn;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onChecklistUpdated = () => setChecklistSyncTick((t) => t + 1);
    window.addEventListener("todowallet:checklist-updated", onChecklistUpdated as EventListener);
    return () => {
      window.removeEventListener("todowallet:checklist-updated", onChecklistUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!authReady || !isLoggedIn || !isSupabaseConfigured()) {
      cloudUserIdRef.current = null;
      cloudHydratedRef.current = false;
      return;
    }
    let cancelled = false;
    void (async () => {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (cancelled) return;
      const userId = user?.id ?? null;
      cloudUserIdRef.current = userId;
      cloudHydratedRef.current = false;
      if (!userId) return;

      const { data, error } = await sb
        .from(SUPABASE_STATE_TABLE)
        .select("payload")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("[sync] failed to load state from Supabase:", error.message);
        cloudHydratedRef.current = true;
        return;
      }
      const normalized = normalizeSyncedState(data?.payload);
      if (normalized) {
        const { checklistByCard = {}, ...rest } = normalized;
        setState((s) => ({ ...s, ...rest }));
        replaceChecklistMapInLocalStorage(checklistByCard);
        writeChecklistMapToMainStorage(checklistByCard);
        setChecklistSyncTick((t) => t + 1);
        try {
          window.dispatchEvent(new Event("todowallet:checklist-updated"));
        } catch {
          // ignore browser event dispatch failures
        }
      }
      cloudHydratedRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    if (!authReady) return;
    if (!isSupabaseConfigured() || !isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((s) => ({ ...s, isAdmin: false }));
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!session?.access_token || cancelled) return;
      const res = await fetch("/api/me/app-admin", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const j = (await res.json()) as { isAdmin?: boolean };
      if (!cancelled) setState((s) => ({ ...s, isAdmin: Boolean(j.isAdmin) }));
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    if (!authReady || !isLoggedIn || !isSupabaseConfigured()) return;
    if (!cloudHydratedRef.current) return;
    const userId = cloudUserIdRef.current;
    if (!userId) return;

    if (cloudSaveTimerRef.current) clearTimeout(cloudSaveTimerRef.current);
    const payload: SyncedAppState & { checklistByCard: Record<string, ChecklistItem[]> } = {
      profile: stProfile,
      masterCards: stMaster,
      presetCards: stPreset,
      regularCards: stRegular,
      recipeCards: stRecipe,
      redeemedCouponIds: stCoupons,
      checklistByCard: readChecklistMapFromLocalStorage(),
    };
    cloudSaveTimerRef.current = setTimeout(() => {
      void (async () => {
        const { error } = await getSupabase()
          .from(SUPABASE_STATE_TABLE)
          .upsert(
            {
              user_id: userId,
              payload,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
        if (error) {
          console.warn("[sync] failed to save state to Supabase:", error.message);
        }
      })();
    }, 700);

    return () => {
      if (cloudSaveTimerRef.current) {
        clearTimeout(cloudSaveTimerRef.current);
      }
    };
  }, [authReady, isLoggedIn, stProfile, stMaster, stPreset, stRegular, stRecipe, stCoupons, checklistSyncTick]);

  const update = useCallback((updater: (s: AppState) => Partial<AppState>) => setState((s) => ({ ...s, ...updater(s) })), []);

  const [pendingUndo, setPendingUndo] = useState<{ id: string; until: number } | null>(null);

  useEffect(() => {
    if (!pendingUndo) return;
    const ms = pendingUndo.until - Date.now();
    const t = setTimeout(() => setPendingUndo(null), Math.max(0, ms));
    return () => clearTimeout(t);
  }, [pendingUndo]);

  const applyCouponCode = useCallback(async (code: string) => {
    try {
      const res = await fetch("/api/redeem/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; couponId?: string; message?: string };
      if (!data.ok || !data.couponId) {
        return { ok: false, message: data.error ?? "쿠폰을 적용할 수 없습니다." };
      }
      setState((s) => ({
        ...s,
        redeemedCouponIds: s.redeemedCouponIds.includes(data.couponId!)
          ? s.redeemedCouponIds
          : [...s.redeemedCouponIds, data.couponId!],
      }));
      return { ok: true, message: data.message ?? "쿠폰이 적용되었습니다." };
    } catch {
      return { ok: false, message: "네트워크 오류가 발생했습니다." };
    }
  }, []);

  const applyMasterStatus = useCallback((id: string, status: MasterCard["status"]) => {
    update((s) => {
      const prev = s.masterCards.find((m) => m.id === id);
      if (!prev) return {};
      const masterCards = s.masterCards.map((c) => (c.id === id ? { ...c, status } : c));
      if (status === "gold" && prev.status !== "gold") {
        const nowIso = new Date().toISOString();
        const regularCards = s.regularCards.map((c) => {
          if (c.masterId !== id || c.isCompleted) return c;
          return {
            ...c,
            isCompleted: true,
            completedAt: nowIso,
            isWorking: false,
            isPaused: false,
            currentSessionStart: null,
            currentBreakStart: null,
          };
        });
        return { masterCards, regularCards };
      }
      return { masterCards };
    });
  }, [update]);

  // actions를 useMemo로 안정화 → 매 렌더마다 새 객체 생성 방지
  const actions: Omit<AppContextType, keyof AppState | "pendingUndo"> = useMemo(() => ({
    logout: async () => {
      if (isSupabaseConfigured()) {
        await getSupabase().auth.signOut();
      }
      update(() => ({ isLoggedIn: false, isAdmin: false }));
    },
    applyCouponCode,
    updateProfile: (p) => update((s) => ({ profile: { ...s.profile, ...p } })),
    setActiveTab: (tab) => update(() => ({ activeTab: tab })),
    addMasterCard: (card) => {
      const newCard: MasterCard = { ...card, id: generateId(), createdAt: new Date().toISOString(), status: "active" };
      update((s) => ({ masterCards: [...s.masterCards, newCard] }));
      return newCard;
    },
    updateMasterCard: (id, updates) => {
      update((s) => ({
        masterCards: s.masterCards.map((c) => {
          if (c.id !== id || c.type !== "master") return c;
          const next = { ...c, ...updates } as MasterCard;
          if (updates.hasGoal === false) {
            next.hasGoal = false;
            next.goalContent = undefined;
            next.goalDeadline = undefined;
          }
          return next;
        }),
      }));
    },
    addRegularCard: (card) => {
      const todayStr = new Date().toISOString().split("T")[0];
      let date = card.date ?? todayStr;
      if (card.isScheduled && card.scheduleMode === "once" && card.scheduleDate) {
        date = card.scheduleDate;
      }
      const newCard: RegularCard = {
        ...card,
        date,
        id: generateId(),
        createdAt: new Date().toISOString(),
        sessions: [],
        totalWorkSeconds: 0,
        totalBreakSeconds: 0,
        isWorking: false,
        isPaused: false,
        currentSessionStart: null,
        currentBreakStart: null,
        isCompleted: false,
        completedAt: null,
      };
      update((s) => ({ regularCards: [...s.regularCards, newCard] }));
      return newCard;
    },
    addRecipeCard: (card) => {
      const newCard: RecipeCard = { ...card, id: generateId(), createdAt: new Date().toISOString() };
      update((s) => ({ recipeCards: [...s.recipeCards, newCard] }));
      return newCard;
    },
    addPresetCard: (card) => {
      const newCard: PresetCard = { ...card, id: generateId(), createdAt: new Date().toISOString() };
      update((s) => ({ presetCards: [...s.presetCards, newCard] }));
      return newCard;
    },
    updateRegularCard: (id, updates) => {
      update((s) => ({
        regularCards: s.regularCards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
    },
    deleteRegularCard: (id) => {
      update((s) => ({
        regularCards: s.regularCards.filter((c) => c.id !== id),
      }));
    },
    deleteMasterCard: (id) => {
      update((s) => ({
        masterCards: s.masterCards.filter((c) => c.id !== id),
        regularCards: s.regularCards.filter((c) => c.masterId !== id),
        presetCards: s.presetCards.filter((c) => c.masterId !== id),
        recipeCards: s.recipeCards.filter((c) => c.masterId !== id),
      }));
    },
    deletePresetCard: (id) => {
      update((s) => ({
        presetCards: s.presetCards.filter((c) => c.id !== id),
      }));
    },
    deleteRecipeCard: (id) => {
      update((s) => ({
        recipeCards: s.recipeCards.filter((c) => c.id !== id),
      }));
    },
    reorderRegularCards: (ids) => {
      update((s) => {
        const map = new Map(s.regularCards.map(c => [c.id, c]));
        const reordered = ids.map(id => map.get(id)).filter(Boolean) as RegularCard[];
        const rest = s.regularCards.filter(c => !ids.includes(c.id));
        return { regularCards: [...reordered, ...rest] };
      });
    },
    completeRegularCard: (id) => {
      update((s) => ({
        regularCards: s.regularCards.map((c) =>
          c.id === id
            ? {
                ...c,
                isCompleted: true,
                completedAt: new Date().toISOString(),
                isWorking: false,
                isPaused: false,
                currentSessionStart: null,
                currentBreakStart: null,
              }
            : c,
        ),
      }));
      setPendingUndo({ id, until: Date.now() + 5000 });
    },
    undoPendingRegularCompletion: () => {
      setPendingUndo((u) => {
        if (!u || Date.now() > u.until) return null;
        const uid = u.id;
        update((s) => ({
          regularCards: s.regularCards.map((c) => (c.id === uid ? { ...c, isCompleted: false, completedAt: null } : c)),
        }));
        return null;
      });
    },
    revertRegularCompletion: (id) => {
      const today = new Date().toISOString().split("T")[0];
      update((s) => {
        const c = s.regularCards.find((x) => x.id === id);
        if (!c || c.date !== today || !c.isCompleted) return {};
        return {
          regularCards: s.regularCards.map((x) => (x.id === id ? { ...x, isCompleted: false, completedAt: null } : x)),
        };
      });
      setPendingUndo((u) => (u?.id === id ? null : u));
    },
    setMasterStatus: applyMasterStatus,
    completeMasterCard: (id, asGold) => {
      applyMasterStatus(id, asGold ? "gold" : "silver");
    },
    startWork: (cardId) => {
      const now = new Date().toISOString();
      update((s) => ({ regularCards: s.regularCards.map((c) => c.id === cardId ? { ...c, isWorking: true, isPaused: false, currentSessionStart: now } : c) }));
    },
    stopWork: (cardId) => {
      const now = new Date();
      update((s) => {
        const card = s.regularCards.find((c) => c.id === cardId);
        if (!card || !card.currentSessionStart) return {};
        const duration = Math.floor((now.getTime() - new Date(card.currentSessionStart).getTime()) / 1000);
        const session: Session = { id: generateId(), startTime: card.currentSessionStart, endTime: now.toISOString(), duration, breakDuration: 0, breaks: [] };
        return { regularCards: s.regularCards.map((c) => c.id === cardId ? { ...c, isWorking: false, isPaused: false, currentSessionStart: null, currentBreakStart: null, sessions: [...c.sessions, session], totalWorkSeconds: c.totalWorkSeconds + duration } : c) };
      });
    },
    pauseWork: (cardId) => {
      update((s) => ({ regularCards: s.regularCards.map((c) => c.id === cardId ? { ...c, isPaused: true } : c) }));
    },
    resumeWork: (cardId) => {
      update((s) => ({ regularCards: s.regularCards.map((c) => c.id === cardId ? { ...c, isPaused: false } : c) }));
    },
    startBreak: (cardId) => {
      const now = new Date().toISOString();
      update((s) => ({ regularCards: s.regularCards.map((c) => c.id === cardId ? { ...c, currentBreakStart: now, isPaused: true } : c) }));
    },
    endBreak: (cardId) => {
      const now = new Date();
      update((s) => ({ regularCards: s.regularCards.map((c) => {
        if (c.id !== cardId || !c.currentBreakStart) return c;
        const breakDur = Math.floor((now.getTime() - new Date(c.currentBreakStart).getTime()) / 1000);
        return { ...c, currentBreakStart: null, isPaused: false, totalBreakSeconds: (c.totalBreakSeconds || 0) + breakDur };
      })}));
    },
    getLiveWorkSeconds: (card) => {
      if (!card || card.type !== "regular") return 0;
      let total = card.totalWorkSeconds || 0;
      if (card.isWorking && !card.isPaused && card.currentSessionStart) {
        total += Math.floor((Date.now() - new Date(card.currentSessionStart).getTime()) / 1000);
      }
      return total;
    },
    getLiveBreakSeconds: (card) => {
      if (!card || card.type !== "regular") return 0;
      let total = card.totalBreakSeconds || 0;
      if (card.currentBreakStart) {
        total += Math.floor((Date.now() - new Date(card.currentBreakStart).getTime()) / 1000);
      }
      return total;
    },
  }), [update, applyMasterStatus, applyCouponCode]);

  // Context value를 메모이제이션 → 불필요한 consumer 리렌더 방지
  const contextValue = useMemo<AppContextType>(
    () => ({ ...state, tick, ...actions, pendingUndo }),
    [state, tick, actions, pendingUndo],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// ═══════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════

function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [autoLogin, setAutoLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    try {
      setAutoLogin(localStorage.getItem(AUTO_LOGIN_PREF_KEY) !== "false");
    } catch {
      setAutoLogin(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let supabaseUrl = "";
    let supabaseAnon = "";
    try {
      const res = await fetch(`${origin}/api/auth/public-config`, { cache: "no-store" });
      const data = (await res.json()) as { url?: string; anonKey?: string };
      supabaseUrl = (data.url ?? "").trim();
      supabaseAnon = (data.anonKey ?? "").trim();
      if (!res.ok && !supabaseUrl) {
        setError("서버에서 Supabase 설정을 불러오지 못했습니다. 터미널에 오류가 있는지 확인해 주세요.");
        return;
      }
    } catch {
      setError("네트워크 오류로 설정을 불러오지 못했습니다. 주소가 http://127.0.0.1:3003 인지 확인해 주세요.");
      return;
    }
    if (!supabaseUrl || !supabaseAnon) {
      setError(
        "Supabase 값이 비어 있습니다. 프로젝트 루트의 .env.local에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 넣고, 저장한 뒤 터미널에서 dev 서버를 껐다가 다시 npm run dev 하세요.",
      );
      return;
    }
    setSupabaseRuntimeConfig(supabaseUrl, supabaseAnon);
    const sb = getSupabase();
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signErr } = await sb.auth.signUp({
          email: trimmed,
          password,
          options: { emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined },
        });
        if (signErr) {
          setError(signErr.message);
          return;
        }
        if (data.session) {
          setInfo("가입이 완료되었습니다.");
        } else {
          setInfo("확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요. (대시보드에서 이메일 확인을 끈 경우 바로 로그인됩니다.)");
        }
      } else {
        const { error: signInErr } = await sb.auth.signInWithPassword({ email: trimmed, password });
        if (signInErr) {
          setError(signInErr.message);
          return;
        }
      }
      try {
        localStorage.setItem(AUTO_LOGIN_PREF_KEY, autoLogin ? "true" : "false");
      } catch {
        // ignore localStorage failures
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(var(--brand-rgb),0.08) 0%, transparent 70%)" }} />

      <div className="animate-fadeInUp flex flex-col items-center gap-8 w-full max-w-sm z-10">
        <div className="flex flex-col items-center gap-4">
          <div
            className="overflow-hidden shadow-xl shrink-0"
            style={{
              borderRadius: "22%",
              width: 88,
              height: 88,
              boxShadow: "0 16px 48px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <BrandLogo size={88} withBackground />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)", fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif" }}>
              TodoWallet
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>한 일은 사라지지 않는다</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <div className="flex rounded-xl p-0.5 gap-0.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <button
            type="button"
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors cursor-pointer"
            onClick={() => { setMode("login"); setError(null); setInfo(null); }}
            style={{ background: mode === "login" ? "var(--surface-1)" : "transparent", color: mode === "login" ? "var(--fg)" : "var(--text-muted)", boxShadow: mode === "login" ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}
          >
            로그인
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors cursor-pointer"
            onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
            style={{ background: mode === "signup" ? "var(--surface-1)" : "transparent", color: mode === "signup" ? "var(--fg)" : "var(--text-muted)", boxShadow: mode === "signup" ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}
          >
            회원가입
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium px-0.5" style={{ color: "var(--text-muted)" }}>이메일</span>
          <div className="flex items-center gap-2 rounded-xl px-3 py-3" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <Mail size={18} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-w-0 bg-transparent border-none outline-none text-sm"
              style={{ color: "var(--fg)" }}
              placeholder="you@example.com"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium px-0.5" style={{ color: "var(--text-muted)" }}>비밀번호</span>
          <div className="flex items-center gap-2 rounded-xl px-3 py-3" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <Lock size={18} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-w-0 bg-transparent border-none outline-none text-sm"
              style={{ color: "var(--fg)" }}
              placeholder="6자 이상"
            />
          </div>
        </label>

        <label className="flex items-center gap-2 px-1 py-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoLogin}
            onChange={(e) => setAutoLogin(e.target.checked)}
            className="accent-blue-600"
          />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>자동 로그인 유지</span>
        </label>

        {error && (
          <p className="text-sm px-1 rounded-lg py-2" style={{ color: "#F87171", background: "rgba(248,113,113,0.08)" }}>{error}</p>
        )}
        {info && (
          <p className="text-sm px-1 rounded-lg py-2" style={{ color: "var(--fg)", background: "rgba(var(--brand-rgb),0.08)" }}>{info}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-press w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-semibold text-sm cursor-pointer disabled:opacity-60"
          style={{ background: "var(--gradient-cta)", color: "#FFFFFF", border: "none" }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {mode === "signup" ? "이메일로 가입하기" : "로그인"}
        </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// CARD STACK ITEM
// ═══════════════════════════════════════════

interface CardStackItemProps {
  card: Card;
  masterName?: string;
  liveSeconds?: number;
  isFocused?: boolean;
}

function CardStackItem({ card, masterName, liveSeconds, isFocused }: CardStackItemProps) {
  const preset = getPreset(card.designPresetId);
  const isMaster = card.type === "master";
  const isRegular = card.type === "regular";
  const masterStatus = isMaster ? (card as MasterCard).status : null;
  const regularCard = isRegular ? (card as RegularCard) : null;
  const showElapsed = (liveSeconds || 0) >= 60;

  return (
    <div className={isFocused ? "" : "btn-press"}
      style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", aspectRatio: "85.6 / 53.98", background: preset.gradient, border: "1px solid rgba(255,255,255,0.15)", boxShadow: isFocused ? "0 12px 40px rgba(0,0,0,0.2)" : "0 8px 32px rgba(0,0,0,0.12)", cursor: isFocused ? "default" : "pointer", transition: "box-shadow 0.2s" }}>
      <div className={preset.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3, pointerEvents: "none" }} />
      {masterStatus === "gold" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: GOLD_METAL_RIBBON, boxShadow: "0 1px 3px rgba(0,0,0,0.35)" }} />}
      {masterStatus === "silver" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: SILVER_METAL_RIBBON, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />}
      {preset.limited && <div style={{ position: "absolute", top: 8, right: 10, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "var(--gradient-badge)", color: "#0A0A0A" }}>{preset.limited}</div>}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "7px 14px 11px" }}>
        <div style={{ minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
            {isMaster ? (
              <>
                <span />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color:
                      masterStatus === "gold"
                        ? GOLD_BADGE_COLOR
                        : masterStatus === "silver"
                          ? SILVER_BADGE_COLOR
                          : "rgba(255,255,255,0.5)",
                    textShadow:
                      masterStatus === "gold" ? GOLD_BADGE_SHADOW : masterStatus === "silver" ? SILVER_BADGE_SHADOW : undefined,
                  }}
                >
                  {masterStatus === "gold" ? "GOLD" : masterStatus === "silver" ? "SILVER" : "MASTER"}
                </span>
              </>
            ) : (
              <>
                <span />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>{masterName || (card.type === "recipe" ? "RECIPE" : "")}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: preset.textColor, lineHeight: 1.2 }}>{card.name}</div>
          {(isMaster || isRegular) && showElapsed && (
            <div className="font-mono tabular-nums" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.78)", marginTop: 3, letterSpacing: "0.02em", textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>
              {formatSeconds(liveSeconds || 0)}
            </div>
          )}
        </div>
        <div style={{ width: 36, height: 27, borderRadius: 5, background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.08) 100%)", border: "1px solid rgba(255,255,255,0.15)" }} />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{new Date(card.createdAt).toLocaleDateString("ko-KR")}</div>
          <div style={{ textAlign: "right" }}>
            {isRegular && regularCard?.isWorking && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                <div className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                <span style={{ fontSize: 11, color: "#22C55E" }}>진행중</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// HOME SCREEN - Apple Wallet Style
// ═══════════════════════════════════════════

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

function checklistPageCount(list: { length: number }): number {
  return Math.max(1, Math.ceil(list.length / CHECKLIST_ITEMS_PER_PAGE));
}

function clampChecklistPage(page: number, list: ChecklistItem[]): number {
  const max = Math.max(0, checklistPageCount(list) - 1);
  return Math.min(Math.max(0, page), max);
}

function checklistPageSlice(list: ChecklistItem[], page: number): ChecklistItem[] {
  const p = clampChecklistPage(page, list);
  const start = p * CHECKLIST_ITEMS_PER_PAGE;
  return list.slice(start, start + CHECKLIST_ITEMS_PER_PAGE);
}

function EditRegularCardModal({
  focusedCard,
  masterCards,
  onSave,
  onClose,
}: {
  focusedCard: RegularCard;
  masterCards: MasterCard[];
  onSave: (updates: { name: string; date: string; masterId: string }) => void;
  onClose: () => void;
}) {
  const [draftName, setDraftName] = useState(focusedCard.name);
  const [draftDate, setDraftDate] = useState(() => formatDateInputValue(focusedCard.date || focusedCard.createdAt));
  const [draftMasterId, setDraftMasterId] = useState(focusedCard.masterId || "");

  const save = () => {
    if (!draftName.trim()) return;
    onSave({
      name: draftName.trim(),
      date: draftDate || focusedCard.date,
      masterId: draftMasterId || focusedCard.masterId,
    });
  };

  return (
    <div className="animate-fadeIn fixed inset-0 z-[700] flex items-end overlay-bg" onClick={onClose}>
      <div className="animate-slideUp w-full rounded-t-3xl p-6" style={{ background: "var(--surface-1)", borderTop: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />
        <h3 className="text-lg font-bold mb-4" style={{ color: "var(--fg)" }}>카드 수정</h3>
        <div className="flex flex-col gap-3">
          <input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="카드 이름" className="rounded-xl py-3 px-3.5 text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }} />
          <input type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} className="rounded-xl py-3 px-3.5 text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)", colorScheme: "light" }} />
          <select value={draftMasterId} onChange={(e) => setDraftMasterId(e.target.value)} className="rounded-xl py-3 px-3.5 text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }}>
            {masterCards.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2.5 mt-4">
          <button className="btn-press flex-1 py-3 rounded-xl font-bold border-none cursor-pointer" style={{ background: "var(--gradient-cta)", color: "#FFF" }} onClick={save}>저장</button>
          <button className="btn-press flex-1 py-3 rounded-xl font-semibold cursor-pointer" style={{ background: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border)" }} onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

function EditVaultMasterModal({
  master,
  onSave,
  onClose,
}: {
  master: MasterCard;
  onSave: (updates: Partial<Pick<MasterCard, "name" | "designPresetId" | "hasGoal" | "goalContent" | "goalDeadline">>) => void;
  onClose: () => void;
}) {
  const [draftName, setDraftName] = useState(master.name);
  const [designId, setDesignId] = useState(master.designPresetId);
  const [hasGoal, setHasGoal] = useState(Boolean(master.hasGoal && master.goalContent));
  const [goalContent, setGoalContent] = useState(master.goalContent ?? "");
  const [goalDeadline, setGoalDeadline] = useState(() =>
    master.goalDeadline ? formatDateInputValue(master.goalDeadline) : "",
  );

  const preset = getPreset(designId);
  const save = () => {
    if (!draftName.trim()) return;
    if (!hasGoal) {
      onSave({
        name: draftName.trim(),
        designPresetId: designId,
        hasGoal: false,
        goalContent: undefined,
        goalDeadline: undefined,
      });
      return;
    }
    onSave({
      name: draftName.trim(),
      designPresetId: designId,
      hasGoal: true,
      goalContent: goalContent.trim() || undefined,
      goalDeadline: goalDeadline || undefined,
    });
  };

  const labelStyle = "text-xs font-semibold mb-2 block tracking-wide";
  const inputStyle = "w-full rounded-xl py-3 px-3.5 text-sm outline-none";

  return (
    <div className="animate-fadeIn fixed inset-0 z-[700] flex items-end overlay-bg" onClick={onClose}>
      <div
        className="animate-slideUp w-full rounded-t-3xl p-6 max-h-[88vh] overflow-y-auto max-w-lg mx-auto"
        style={{ background: "var(--surface-1)", borderTop: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />
        <h3 className="text-lg font-bold mb-4" style={{ color: "var(--fg)" }}>마스터 카드 편집</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelStyle} style={{ color: "var(--text-muted)" }}>카드 이름</label>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="카드 이름"
              maxLength={30}
              className={inputStyle}
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }}
            />
          </div>
          <div>
            <label className={labelStyle} style={{ color: "var(--text-muted)" }}>카드 디자인</label>
            <PresetSelector selected={designId} onSelect={setDesignId} />
          </div>
          <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "85.6 / 53.98", background: preset.gradient, border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
            <div className={preset.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-9 rounded-md" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.08))", border: "1px solid rgba(255,255,255,0.15)" }} />
                <span className="text-[10px] font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.6)" }}>MASTER</span>
              </div>
              <div>
                <div className="font-mono text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{new Date().toLocaleDateString("ko-KR")}</div>
                <div className="text-sm font-bold" style={{ color: preset.textColor }}>{draftName || "이름"}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>목표 설정</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>ON이면 기한을 설정할 수 있어요</p>
              </div>
              <button type="button" onClick={() => setHasGoal(!hasGoal)} className="bg-transparent border-none cursor-pointer">
                {hasGoal ? <ToggleRight size={32} style={{ color: "var(--gold)" }} /> : <ToggleLeft size={32} style={{ color: "var(--text-faint)" }} />}
              </button>
            </div>
            {hasGoal && (
              <div className="flex flex-col gap-3">
                <input
                  placeholder="목표 내용"
                  value={goalContent}
                  onChange={(e) => setGoalContent(e.target.value)}
                  className={inputStyle}
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }}
                />
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className={inputStyle}
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)", colorScheme: "light" }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2.5 mt-6">
          <button type="button" className="btn-press flex-1 py-3 rounded-xl font-bold border-none cursor-pointer" style={{ background: "var(--gradient-cta)", color: "#FFF" }} onClick={save}>
            저장
          </button>
          <button type="button" className="btn-press flex-1 py-3 rounded-xl font-semibold cursor-pointer" style={{ background: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border)" }} onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

function CardManagementSheet({
  open,
  onClose,
  canReorder,
  onReorder,
  onScheduled,
}: {
  open: boolean;
  onClose: () => void;
  canReorder: boolean;
  onReorder: () => void;
  onScheduled: () => void;
}) {
  const { masterCards, regularCards, recipeCards, presetCards, deleteRegularCard, deleteMasterCard, deletePresetCard, deleteRecipeCard } = useApp();
  const [deleteMode, setDeleteMode] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!open) return null;

  const allCards = [
    ...masterCards.map((c) => ({ ...c, _kind: "master" as const, _label: "마스터" })),
    ...regularCards.filter((c) => !c.isCompleted).map((c) => ({ ...c, _kind: "regular" as const, _label: "일반" })),
    ...presetCards.map((c) => ({ ...c, _kind: "preset" as const, _label: "프리셋" })),
    ...recipeCards.map((c) => ({ ...c, _kind: "recipe" as const, _label: "레시피" })),
  ];

  const handleDelete = (card: (typeof allCards)[number]) => {
    if (card._kind === "master") deleteMasterCard(card.id);
    else if (card._kind === "regular") deleteRegularCard(card.id);
    else if (card._kind === "preset") deletePresetCard(card.id);
    else deleteRecipeCard(card.id);
    setConfirmId(null);
    if (allCards.length <= 1) setDeleteMode(false);
  };

  return (
    <div className="animate-fadeIn fixed inset-0 z-[480] flex items-end overlay-bg" onClick={() => { setDeleteMode(false); setConfirmId(null); onClose(); }}>
      <div
        className="animate-slideUp w-full rounded-t-3xl p-6 max-w-lg mx-auto"
        style={{ background: "var(--surface-1)", borderTop: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />
        <p className="text-sm font-bold mb-4" style={{ color: "var(--fg)" }}>카드 관리</p>

        {!deleteMode ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn-press w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm border-none cursor-pointer disabled:opacity-40"
              style={{ background: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border)" }}
              disabled={!canReorder}
              onClick={() => { onReorder(); onClose(); }}
            >
              <GripVertical size={18} /> 순서 바꾸기
            </button>
            <button
              type="button"
              className="btn-press w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm border-none cursor-pointer"
              style={{ background: "var(--gradient-cta)", color: "#fff" }}
              onClick={() => { onScheduled(); onClose(); }}
            >
              <CalendarClock size={18} /> 예약카드 관리하기
            </button>
            <button
              type="button"
              className="btn-press w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm border-none cursor-pointer"
              style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
              onClick={() => setDeleteMode(true)}
            >
              <Trash2 size={18} /> 카드 삭제하기
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>삭제할 카드를 선택하세요. 마스터카드 삭제 시 하위 카드도 모두 삭제됩니다.</p>
            <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto">
              {allCards.map((card) => {
                const cardPreset = getPreset((card as { designPresetId?: string }).designPresetId ?? "midnight");
                return (
                  <div key={card.id} className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <div className="shrink-0 w-10 h-6 rounded-md overflow-hidden relative" style={{ background: cardPreset.gradient }}>
                        <div className={cardPreset.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--fg)" }}>{card.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>{card._label}</p>
                      </div>
                    </div>
                    {confirmId === card.id ? (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          className="btn-press px-3 py-2 rounded-lg text-[12px] font-bold cursor-pointer"
                          style={{ background: "#EF4444", color: "#fff", border: "none" }}
                          onClick={() => handleDelete(card)}
                        >
                          확인
                        </button>
                        <button
                          type="button"
                          className="btn-press px-3 py-2 rounded-lg text-[12px] font-bold cursor-pointer"
                          style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                          onClick={() => setConfirmId(null)}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-press shrink-0 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                        onClick={() => setConfirmId(card.id)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </button>
                    )}
                  </div>
                );
              })}
              {allCards.length === 0 && (
                <p className="text-center text-sm py-6" style={{ color: "var(--text-faint)" }}>삭제할 카드가 없습니다.</p>
              )}
            </div>
            <button
              type="button"
              className="btn-press w-full mt-4 py-3 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border)" }}
              onClick={() => { setDeleteMode(false); setConfirmId(null); }}
            >
              돌아가기
            </button>
          </div>
        )}

        {!deleteMode && (
          <button type="button" className="btn-press w-full mt-3 py-3 text-sm font-semibold cursor-pointer rounded-xl" style={{ color: "var(--text-muted)" }} onClick={onClose}>
            닫기
          </button>
        )}
      </div>
    </div>
  );
}

function ScheduledCardsManageSheet({
  open,
  onClose,
  masterCards,
}: {
  open: boolean;
  onClose: () => void;
  masterCards: MasterCard[];
}) {
  const { regularCards, updateRegularCard } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("09:00");
  const [editMode, setEditMode] = useState<"once" | "daily" | "weekly">("daily");
  const [editWeekdays, setEditWeekdays] = useState<number[]>([]);

  const scheduled = useMemo(() => regularCards.filter((c) => !c.isCompleted && c.isScheduled), [regularCards]);

  const openEdit = (c: RegularCard) => {
    setEditingId(c.id);
    setEditMode(c.scheduleMode ?? "daily");
    setEditDate(c.scheduleDate ?? c.date ?? "");
    setEditTime(c.scheduleTime ?? "09:00");
    setEditWeekdays(c.scheduleWeekdays ?? []);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const todayStr = new Date().toISOString().split("T")[0];
    let nextDate = editDate || todayStr;
    if (editMode === "once") {
      nextDate = editDate || todayStr;
    } else {
      nextDate = todayStr;
    }
    updateRegularCard(editingId, {
      scheduleMode: editMode,
      scheduleDate: editMode === "once" ? editDate : undefined,
      scheduleTime: editTime || undefined,
      scheduleWeekdays: editMode === "weekly" ? editWeekdays : undefined,
      date: nextDate,
    });
    setEditingId(null);
  };

  const cancelReservation = (id: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    updateRegularCard(id, {
      isScheduled: false,
      scheduleMode: undefined,
      scheduleDate: undefined,
      scheduleTime: undefined,
      scheduleWeekdays: undefined,
      date: todayStr,
    });
  };

  if (!open) return null;

  return (
    <div className="animate-fadeIn fixed inset-0 z-[490] flex items-end overlay-bg" onClick={onClose}>
      <div
        className="animate-slideUp w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto max-w-lg mx-auto"
        style={{ background: "var(--surface-1)", borderTop: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--border)" }} />
        <h3 className="text-lg font-bold mb-1" style={{ color: "var(--fg)" }}>예약카드 관리</h3>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>예약된 일반 카드의 날짜·시간을 바꾸거나 예약을 취소할 수 있어요.</p>

        {scheduled.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>예약된 카드가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {scheduled.map((c) => {
              const masterName = masterCards.find((m) => m.id === c.masterId)?.name ?? "";
              return (
                <div key={c.id} className="rounded-2xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--fg)" }}>{c.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{masterName}</p>
                      <p className="text-xs mt-2 font-mono" style={{ color: "var(--gold-dim)" }}>{formatScheduleSummary(c)}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        className="btn-press-sm px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border-none"
                        style={{ background: "rgba(var(--brand-rgb),0.12)", color: "var(--gold-dim)" }}
                        onClick={() => openEdit(c)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="btn-press-sm px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border-none"
                        style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}
                        onClick={() => {
                          if (confirm("예약을 취소하고 오늘 일반 카드로 둘까요?")) cancelReservation(c.id);
                        }}
                      >
                        예약 취소
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {editingId && (
          <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-bold mb-3" style={{ color: "var(--fg)" }}>예약 수정</p>
            <div className="flex gap-2 mb-3">
              {(["once", "daily", "weekly"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="btn-press flex-1 py-2 rounded-xl text-xs font-semibold"
                  onClick={() => setEditMode(m)}
                  style={{
                    background: editMode === m ? "rgba(var(--brand-rgb),0.15)" : "var(--surface-2)",
                    color: editMode === m ? "var(--gold-dim)" : "var(--text-muted)",
                    border: editMode === m ? "1px solid var(--gold)" : "1px solid var(--border)",
                  }}
                >
                  {m === "once" ? "1회" : m === "daily" ? "매일" : "매주"}
                </button>
              ))}
            </div>
            {editMode === "once" && (
              <div className="mb-3">
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--text-muted)" }}>날짜</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full rounded-xl py-2.5 px-3 text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)", colorScheme: "light" }} />
              </div>
            )}
            {editMode === "weekly" && (
              <div className="flex gap-1.5 flex-wrap mb-3">
                {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    className="btn-press py-2 px-2.5 rounded-lg text-[11px] font-bold"
                    onClick={() => setEditWeekdays(editWeekdays.includes(i) ? editWeekdays.filter((x) => x !== i) : [...editWeekdays, i])}
                    style={{
                      background: editWeekdays.includes(i) ? "rgba(var(--brand-rgb),0.15)" : "var(--surface-2)",
                      color: editWeekdays.includes(i) ? "var(--gold-dim)" : "var(--text-muted)",
                      border: editWeekdays.includes(i) ? "1px solid var(--gold)" : "1px solid var(--border)",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
            <div className="mb-4">
              <label className="text-xs font-semibold block mb-1" style={{ color: "var(--text-muted)" }}>시간</label>
              <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full rounded-xl py-2.5 px-3 text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)", colorScheme: "light" }} />
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-press flex-1 py-3 rounded-xl font-bold border-none cursor-pointer" style={{ background: "var(--gradient-cta)", color: "#fff" }} onClick={saveEdit}>
                저장
              </button>
              <button className="btn-press flex-1 py-3 rounded-xl font-semibold cursor-pointer" style={{ background: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border)" }} onClick={() => setEditingId(null)}>
                취소
              </button>
            </div>
          </div>
        )}

        <button type="button" className="btn-press w-full mt-4 py-3 text-sm font-semibold cursor-pointer rounded-xl" style={{ color: "var(--text-muted)" }} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

function HomeScreen() {
  const { masterCards, regularCards, getLiveWorkSeconds, deleteRegularCard, reorderRegularCards, completeRegularCard, startWork, stopWork, startBreak, endBreak, getLiveBreakSeconds, updateRegularCard, tick } = useApp();
  const [homeMasterPage, setHomeMasterPage] = useState<"all" | string>("all");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showBreakTimer, setShowBreakTimer] = useState(false);
  const [breakTimerInput, setBreakTimerInput] = useState("15");
  const [showCardBack, setShowCardBack] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [cardMgmtOpen, setCardMgmtOpen] = useState(false);
  const [scheduledManageOpen, setScheduledManageOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Swipe state
  const [swipeCardId, setSwipeCardId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const swipeStartRef = useRef<{ x: number; y: number; id: string } | null>(null);
  const swipeXRef = useRef(0);
  const swipeThreshold = 120;
  const didSwipeRef = useRef(false);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>(() => {
    const fromKeys = readChecklistMapFromLocalStorage();
    if (Object.keys(fromKeys).length > 0) return fromKeys;
    return readChecklistMapFromMainStorage();
  });
  const [newCheckItem, setNewCheckItem] = useState("");
  /** 카드별 체크리스트 페이지 (0부터, 페이지당 CHECKLIST_ITEMS_PER_PAGE개) */
  const [checklistPageByCard, setChecklistPageByCard] = useState<Record<string, number>>({});
  const checklistSwipeRef = useRef<{ cardId: string; x: number } | null>(null);
  const [goalBannerIndex, setGoalBannerIndex] = useState(0);
  const goalBannerSwipeRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reload = () => setChecklists(readChecklistMapFromLocalStorage());
    window.addEventListener("todowallet:checklist-updated", reload as EventListener);
    return () => {
      window.removeEventListener("todowallet:checklist-updated", reload as EventListener);
    };
  }, []);

  useEffect(() => {
    writeChecklistMapToMainStorage(checklists);
  }, [checklists]);

  const activeRegular = useMemo(() => {
    void tick;
    return regularCards.filter((c) => regularVisibleToday(c, new Date()));
  }, [regularCards, tick]);
  const homeMasterPages = useMemo(() => {
    const ids = Array.from(new Set(activeRegular.map((c) => c.masterId)));
    return ids
      .map((id) => masterCards.find((m) => m.id === id))
      .filter(Boolean) as MasterCard[];
  }, [activeRegular, masterCards]);
  const effectiveHomeMasterPage: "all" | string =
    homeMasterPage !== "all" && !homeMasterPages.some((m) => m.id === homeMasterPage)
      ? "all"
      : homeMasterPage;
  const selectedHomeMaster = useMemo(
    () => (effectiveHomeMasterPage === "all" ? null : homeMasterPages.find((m) => m.id === effectiveHomeMasterPage) ?? null),
    [effectiveHomeMasterPage, homeMasterPages],
  );
  const goalBannerMasters = useMemo(() => {
    const hasGoal = (m: MasterCard) => Boolean(m.hasGoal || m.goalContent?.trim() || m.goalDeadline);
    if (effectiveHomeMasterPage === "all") return masterCards.filter(hasGoal);
    if (selectedHomeMaster && hasGoal(selectedHomeMaster)) return [selectedHomeMaster];
    return [];
  }, [effectiveHomeMasterPage, masterCards, selectedHomeMaster]);
  const safeGoalBannerIndex = goalBannerMasters.length === 0 ? 0 : Math.min(goalBannerIndex, goalBannerMasters.length - 1);
  const activeGoalBanner = goalBannerMasters[safeGoalBannerIndex] ?? null;
  const activeGoalBannerText = activeGoalBanner?.goalContent?.trim() || "목표 내용을 설정해 주세요";
  const activeGoalBannerDday = getDdayLabel(activeGoalBanner?.goalDeadline);
  const visibleRegular = useMemo(
    () => (effectiveHomeMasterPage === "all" ? activeRegular : activeRegular.filter((c) => c.masterId === effectiveHomeMasterPage)),
    [activeRegular, effectiveHomeMasterPage],
  );
  const scheduledPending = useMemo(
    () => regularCards.filter((c) => !c.isCompleted && c.isScheduled),
    [regularCards],
  );
  const showCardMgmt = !focusedId && (visibleRegular.length > 0 || scheduledPending.length > 0);

  useEffect(() => {
    if (goalBannerMasters.length === 0) {
      setGoalBannerIndex(0);
      return;
    }
    setGoalBannerIndex((prev) => (prev >= goalBannerMasters.length ? 0 : prev));
  }, [goalBannerMasters]);

  useEffect(() => {
    if (focusedId || goalBannerMasters.length <= 1) return;
    const timer = window.setInterval(() => {
      setGoalBannerIndex((prev) => (prev + 1) % goalBannerMasters.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [focusedId, goalBannerMasters.length]);
  
  // Card stack configuration
  const OVERLAP = 52; // How much each card overlaps the one below
  const HOVER_LIFT = -12; // How much to lift on hover (negative = up toward screen top)
  
  // Focused card configuration  
  const FOCUSED_TOP = 124; // Space for top action + goal widget above card
  const QUEUE_VISIBLE_HEIGHT = 32; // How much of queued cards is visible (상단 정리된 부분)
  
  // Get focused card for detail view
  const focusedCard = focusedId ? visibleRegular.find(c => c.id === focusedId) : null;
  const focusedIndex = focusedId ? visibleRegular.findIndex(c => c.id === focusedId) : -1;
  const focusedMaster = focusedCard ? (masterCards.find((m) => m.id === focusedCard.masterId) ?? null) : null;
  const focusedMasterName = focusedMaster?.name ?? "";
  const focusedMasterGoalText = focusedMaster?.goalContent?.trim() || "목표 내용을 설정해 주세요";
  const focusedMasterDeadline = focusedMaster?.goalDeadline ?? "";
  const focusedMasterDday = getDdayLabel(focusedMasterDeadline);
  const hasFocusedMasterGoalWidget = Boolean(
    focusedMaster && (focusedMaster.hasGoal || focusedMaster.goalContent?.trim() || focusedMaster.goalDeadline),
  );

  // Individual hover lift - NO wave effect, only the hovered card lifts
  const getHoverOffset = (cardIndex: number) => {
    if (hoveredIndex === null || focusedId) return 0;
    // Only the directly hovered card lifts up
    if (cardIndex === hoveredIndex) return HOVER_LIFT;
    return 0;
  };

  // Handle card interactions
  const handleCardClick = (cardId: string) => {
    if (!focusedId) {
      setFocusedId(cardId);
      setHoveredIndex(null);
      setShowCardBack(false);
    } else if (focusedId === cardId) {
      // If already focused, toggle card back
      setShowCardBack(!showCardBack);
    }
  };

  // Click between buttons area to go back
  const handleBackdropClick = () => {
    if (showCardBack) {
      setShowCardBack(false);
    } else {
      setFocusedId(null);
    }
  };

  // Action handlers for focused card
  const handleStartWork = () => {
    if (focusedCard) startWork(focusedCard.id);
  };
  
  const handleEndWork = () => {
    if (focusedCard) {
      stopWork(focusedCard.id);
      setFocusedId(null);
    }
  };
  
  const handleComplete = () => {
    if (focusedCard) {
      completeRegularCard(focusedCard.id);
      setFocusedId(null);
    }
  };
  
  const handleBreak = () => {
    if (focusedCard) {
      if (focusedCard.currentBreakStart) {
        endBreak(focusedCard.id);
      } else {
        setShowBreakTimer(true);
      }
    }
  };
  
  const confirmBreak = () => {
    if (focusedCard && !focusedCard.currentBreakStart) {
      startBreak(focusedCard.id);
    }
    setShowBreakTimer(false);
  };

  // Per-card checklist helpers
  const getChecklist = (cardId: string): ChecklistItem[] => checklists[cardId] ?? [];

  const updateChecklist = (cardId: string, updater: (prev: ChecklistItem[]) => ChecklistItem[]) => {
    setChecklists(prev => {
      const updated = updater(prev[cardId] ?? []);
      try { localStorage.setItem(`checklist_${cardId}`, JSON.stringify(updated)); } catch {}
      return { ...prev, [cardId]: updated };
    });
    try {
      window.dispatchEvent(new Event("todowallet:checklist-updated"));
    } catch {
      // ignore browser event dispatch failures
    }
  };

  const addCheckItem = () => {
    if (!focusedCard) return;
    const cardId = focusedCard.id;
    const text = newCheckItem.trim();
    if (!text) return;
    let didAdd = false;
    let newPage = 0;
    updateChecklist(cardId, (prev) => {
      if (prev.length >= CHECKLIST_MAX_TOTAL) return prev;
      const nextList = [...prev, { id: generateId(), text, checked: false }];
      newPage = Math.floor((nextList.length - 1) / CHECKLIST_ITEMS_PER_PAGE);
      didAdd = true;
      return nextList;
    });
    if (!didAdd) return;
    setChecklistPageByCard((p) => ({ ...p, [cardId]: newPage }));
    setNewCheckItem("");
  };

  const toggleCheckItem = (cardId: string, itemId: string) => {
    updateChecklist(cardId, prev => prev.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item));
  };

  const removeCheckItem = (cardId: string, itemId: string) => {
    updateChecklist(cardId, prev => prev.filter(item => item.id !== itemId));
  };

  // Swipe handlers (touch + mouse)
  const handleTouchStart = (e: React.TouchEvent, cardId: string) => {
    if (focusedId || reorderMode) return;
    const touch = e.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY, id: cardId };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeStartRef.current || focusedId || reorderMode) return;
    const dx = e.touches[0].clientX - swipeStartRef.current.x;
    const dy = Math.abs(e.touches[0].clientY - swipeStartRef.current.y);
    if (dy > 30 && Math.abs(dx) < 30) { swipeStartRef.current = null; setSwipeCardId(null); setSwipeX(0); return; }
    if (Math.abs(dx) > 10) { setSwipeCardId(swipeStartRef.current.id); setSwipeX(dx); }
  };
  const handleTouchEnd = () => {
    if (swipeCardId && Math.abs(swipeX) > swipeThreshold) {
      if (swipeX < -swipeThreshold) { deleteRegularCard(swipeCardId); }
      else if (swipeX > swipeThreshold) { completeRegularCard(swipeCardId); }
    }
    swipeStartRef.current = null; setSwipeCardId(null); setSwipeX(0);
  };
  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    if (focusedId || reorderMode) return;
    e.preventDefault();
    didSwipeRef.current = false;
    swipeStartRef.current = { x: e.clientX, y: e.clientY, id: cardId };
    const onMouseMove = (ev: MouseEvent) => {
      if (!swipeStartRef.current) return;
      const dx = ev.clientX - swipeStartRef.current.x;
      const dy = Math.abs(ev.clientY - swipeStartRef.current.y);
      if (dy > 30 && Math.abs(dx) < 30) { swipeStartRef.current = null; setSwipeCardId(null); setSwipeX(0); return; }
      if (Math.abs(dx) > 10) { didSwipeRef.current = true; swipeXRef.current = dx; setSwipeCardId(swipeStartRef.current.id); setSwipeX(dx); }
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      const ref = swipeStartRef.current;
      const finalX = swipeXRef.current;
      swipeStartRef.current = null;
      swipeXRef.current = 0;
      setSwipeCardId(null);
      setSwipeX(0);
      if (ref && Math.abs(finalX) > swipeThreshold) {
        setTimeout(() => {
          if (finalX < -swipeThreshold) deleteRegularCard(ref.id);
          else if (finalX > swipeThreshold) completeRegularCard(ref.id);
        }, 0);
      }
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Drag reorder
  const handleDragStart = (i: number) => { setDragIndex(i); };
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIndex(i); };
  const handleDrop = (i: number) => {
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOverIndex(null); return; }
    const ids = visibleRegular.map(c => c.id);
    const [moved] = ids.splice(dragIndex, 1);
    ids.splice(i, 0, moved);
    reorderRegularCards(ids);
    setDragIndex(null); setDragOverIndex(null);
  };

  if (visibleRegular.length === 0) {
    return (
      <div className="relative w-full h-full overflow-auto">
        {!focusedId && activeGoalBanner && (
          <div className="px-5 mt-1 mb-3" style={{ maxWidth: 500, margin: "0 auto" }}>
            <div
              className="rounded-2xl px-3.5 py-3"
              style={{
                background: "linear-gradient(135deg, rgba(var(--brand-rgb),0.14), rgba(var(--brand-rgb),0.06))",
                border: "1px solid rgba(var(--brand-rgb),0.35)",
                boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
              }}
              onTouchStart={(e) => {
                goalBannerSwipeRef.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (goalBannerMasters.length <= 1) return;
                const startX = goalBannerSwipeRef.current;
                goalBannerSwipeRef.current = null;
                if (startX === null) return;
                const endX = e.changedTouches[0]?.clientX ?? startX;
                const dx = endX - startX;
                if (Math.abs(dx) < 48) return;
                if (dx < 0) {
                  setGoalBannerIndex((prev) => (prev + 1) % goalBannerMasters.length);
                } else {
                  setGoalBannerIndex((prev) => (prev - 1 + goalBannerMasters.length) % goalBannerMasters.length);
                }
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-[11px] font-bold tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {activeGoalBanner.name} 목표
                </p>
                <span
                  className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg"
                  style={{
                    color: activeGoalBannerDday === "D-DAY" ? "#fff" : "var(--gold-dim)",
                    background: activeGoalBannerDday === "D-DAY" ? "rgba(244,63,94,0.75)" : "rgba(var(--brand-rgb),0.16)",
                    border: activeGoalBannerDday === "D-DAY" ? "1px solid rgba(244,63,94,0.95)" : "1px solid rgba(var(--brand-rgb),0.35)",
                  }}
                >
                  {activeGoalBannerDday}
                </span>
              </div>
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--fg)" }}>
                {activeGoalBannerText}
              </p>
              {activeGoalBanner.goalDeadline && (
                <p className="font-mono text-[11px] mt-1.5" style={{ color: "var(--text-faint)" }}>
                  기한 {activeGoalBanner.goalDeadline}
                </p>
              )}
              {goalBannerMasters.length > 1 && (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                    좌우로 스와이프하거나 10초마다 자동 전환
                  </p>
                  <div className="flex items-center gap-1">
                    {goalBannerMasters.map((m, idx) => (
                      <span
                        key={m.id}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          background: idx === safeGoalBannerIndex ? "var(--gold)" : "rgba(255,255,255,0.35)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="animate-fadeInUp flex flex-col items-center justify-center h-full gap-6 p-16">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "rgba(var(--brand-rgb),0.08)", border: "1px solid rgba(var(--brand-rgb),0.2)" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="6" y="12" width="28" height="18" rx="3" stroke="var(--gold)" strokeWidth="1.5" /><rect x="6" y="17" width="28" height="2" fill="var(--gold)" opacity="0.4" /><line x1="20" y1="8" x2="20" y2="12" stroke="var(--gold)" strokeWidth="1.5" /><line x1="16" y1="8" x2="24" y2="8" stroke="var(--gold)" strokeWidth="1.5" /></svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--fg)" }}>오늘의 카드가 없어요</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>아래 + 버튼을 눌러<br />새로운 카드를 발급받으세요</p>
          </div>
        </div>
      </div>
    );
  }

  const liveWork = focusedCard ? getLiveWorkSeconds(focusedCard) : 0;
  const liveBreak = focusedCard ? getLiveBreakSeconds(focusedCard) : 0;
  const focusedChecklistLen = focusedCard ? getChecklist(focusedCard.id).length : 0;
  const focusedChecklistAtMax = focusedChecklistLen >= CHECKLIST_MAX_TOTAL;
  const focusedChecklistPage = focusedCard
    ? clampChecklistPage(checklistPageByCard[focusedCard.id] ?? 0, getChecklist(focusedCard.id))
    : 0;
  const focusedChecklistPageCount = focusedCard ? checklistPageCount(getChecklist(focusedCard.id)) : 1;
  const focusedTotalWork = focusedCard ? getLiveWorkSeconds(focusedCard) : 0;
  const focusedTotalBreak = focusedCard ? getLiveBreakSeconds(focusedCard) : 0;
  const focusedNetWork = Math.max(0, focusedTotalWork - focusedTotalBreak);
  const focusedBreakRatio = focusedTotalWork > 0 ? Math.round((focusedTotalBreak / focusedTotalWork) * 100) : 0;
  const focusedNetRatio = focusedTotalWork > 0 ? Math.round((focusedNetWork / focusedTotalWork) * 100) : 0;

  // Reorder mode
  if (reorderMode) {
    return (
      <div className="relative w-full h-full overflow-auto">
        <div className="flex justify-center" style={{ padding: "8px 20px 0" }}>
          <div className="w-full" style={{ maxWidth: 460 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: "var(--fg)" }}>순서 바꾸기</p>
              <button className="btn-press px-4 py-2 rounded-xl text-sm font-bold cursor-pointer" style={{ background: "var(--gradient-cta)", color: "#fff", border: "none" }} onClick={() => setReorderMode(false)}>완료</button>
            </div>
            {visibleRegular.map((card, i) => {
              const preset = getPreset(card.designPresetId);
              return (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                  className="flex items-center gap-3 mb-2 rounded-xl p-2 cursor-grab active:cursor-grabbing"
                  style={{
                    background: dragOverIndex === i ? "rgba(var(--brand-rgb),0.1)" : "var(--surface-1)",
                    border: dragOverIndex === i ? "1px solid var(--gold)" : "1px solid var(--border)",
                    opacity: dragIndex === i ? 0.5 : 1,
                    transition: "all 0.15s ease",
                  }}
                >
                  <GripVertical size={18} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                  <div className="w-12 h-8 rounded-md shrink-0 overflow-hidden" style={{ background: preset.gradient }}>
                    <div className={preset.patternClass} style={{ width: "100%", height: "100%", opacity: 0.3 }} />
                  </div>
                  <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--fg)" }}>{card.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ overflow: focusedId ? "hidden" : "auto" }}>
      {!focusedId && homeMasterPages.length > 0 && (
        <div className="px-5 mb-2" style={{ maxWidth: 500, margin: "0 auto" }}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              className="btn-press shrink-0 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
              onClick={() => { setHomeMasterPage("all"); setFocusedId(null); setShowCardBack(false); }}
              style={{
                background: effectiveHomeMasterPage === "all" ? "rgba(var(--brand-rgb),0.14)" : "var(--surface-2)",
                color: effectiveHomeMasterPage === "all" ? "var(--gold-dim)" : "var(--text-muted)",
                border: effectiveHomeMasterPage === "all" ? "1px solid var(--gold)" : "1px solid var(--border)",
              }}
            >
              전체 ({activeRegular.length})
            </button>
            {homeMasterPages.map((m) => {
              const count = activeRegular.filter((c) => c.masterId === m.id).length;
              return (
                <button
                  key={m.id}
                  type="button"
                  className="btn-press shrink-0 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  onClick={() => { setHomeMasterPage(m.id); setFocusedId(null); setShowCardBack(false); }}
                  style={{
                    background: effectiveHomeMasterPage === m.id ? "rgba(var(--brand-rgb),0.14)" : "var(--surface-2)",
                    color: effectiveHomeMasterPage === m.id ? "var(--gold-dim)" : "var(--text-muted)",
                    border: effectiveHomeMasterPage === m.id ? "1px solid var(--gold)" : "1px solid var(--border)",
                  }}
                >
                  {m.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}
      {!focusedId && activeGoalBanner && (
        <div className="px-5 mb-2" style={{ maxWidth: 500, margin: "0 auto" }}>
          <div
            className="rounded-2xl px-3.5 py-3"
            style={{
              background: "linear-gradient(135deg, rgba(var(--brand-rgb),0.14), rgba(var(--brand-rgb),0.06))",
              border: "1px solid rgba(var(--brand-rgb),0.35)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
            }}
            onTouchStart={(e) => {
              goalBannerSwipeRef.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              if (goalBannerMasters.length <= 1) return;
              const startX = goalBannerSwipeRef.current;
              goalBannerSwipeRef.current = null;
              if (startX === null) return;
              const endX = e.changedTouches[0]?.clientX ?? startX;
              const dx = endX - startX;
              if (Math.abs(dx) < 48) return;
              if (dx < 0) {
                setGoalBannerIndex((prev) => (prev + 1) % goalBannerMasters.length);
              } else {
                setGoalBannerIndex((prev) => (prev - 1 + goalBannerMasters.length) % goalBannerMasters.length);
              }
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-[11px] font-bold tracking-wide" style={{ color: "var(--text-muted)" }}>
                {activeGoalBanner.name} 목표
              </p>
              <span
                className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg"
                style={{
                  color: activeGoalBannerDday === "D-DAY" ? "#fff" : "var(--gold-dim)",
                  background: activeGoalBannerDday === "D-DAY" ? "rgba(244,63,94,0.75)" : "rgba(var(--brand-rgb),0.16)",
                  border: activeGoalBannerDday === "D-DAY" ? "1px solid rgba(244,63,94,0.95)" : "1px solid rgba(var(--brand-rgb),0.35)",
                }}
              >
                {activeGoalBannerDday}
              </span>
            </div>
            <p className="text-sm font-semibold leading-snug" style={{ color: "var(--fg)" }}>
              {activeGoalBannerText}
            </p>
            {activeGoalBanner.goalDeadline && (
              <p className="font-mono text-[11px] mt-1.5" style={{ color: "var(--text-faint)" }}>
                기한 {activeGoalBanner.goalDeadline}
              </p>
            )}
            {goalBannerMasters.length > 1 && (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                  좌우로 스와이프하거나 10초마다 자동 전환
                </p>
                <div className="flex items-center gap-1">
                  {goalBannerMasters.map((m, idx) => (
                    <span
                      key={m.id}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: idx === safeGoalBannerIndex ? "var(--gold)" : "rgba(255,255,255,0.35)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 카드 관리 */}
      {showCardMgmt && (
        <div className="flex justify-end px-5 mb-1" style={{ maxWidth: 500, margin: "0 auto" }}>
          <button
            type="button"
            className="btn-press-sm flex items-center gap-1.5 text-xs font-semibold cursor-pointer bg-transparent border-none py-1.5 px-2 rounded-xl"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            onClick={() => setCardMgmtOpen(true)}
          >
            <LayoutGrid size={14} /> 카드 관리
          </button>
        </div>
      )}

      <CardManagementSheet
        open={cardMgmtOpen}
        onClose={() => setCardMgmtOpen(false)}
        canReorder={visibleRegular.length > 1}
        onReorder={() => setReorderMode(true)}
        onScheduled={() => setScheduledManageOpen(true)}
      />
      <ScheduledCardsManageSheet
        open={scheduledManageOpen}
        onClose={() => setScheduledManageOpen(false)}
        masterCards={masterCards}
      />

      {/* Back and Edit buttons - ABOVE the card */}
      {focusedId && focusedCard && !showCardBack && (
        <div className="absolute left-5 right-5 top-3 z-[400] flex items-center justify-between animate-fadeIn" style={{ maxWidth: 460, margin: "0 auto" }}>
          <button
            className="btn-press flex items-center gap-1.5 bg-transparent border-none cursor-pointer py-2 px-1 text-sm font-semibold"
            style={{ color: "var(--text-muted)" }}
            onClick={() => setFocusedId(null)}
          >
            <ChevronLeft size={18} /> 뒤로가기
          </button>
          <button
            className="btn-press flex items-center gap-1.5 bg-transparent border-none cursor-pointer py-2 px-1 text-sm font-bold"
            style={{ color: "var(--text-muted)" }}
            onClick={() => setShowEdit(true)}
          >
            <Edit3 size={16} /> 편집하기
          </button>
        </div>
      )}
      {focusedId && focusedCard && hasFocusedMasterGoalWidget && (
        <div className="absolute left-5 right-5 z-[395] animate-fadeIn" style={{ top: 46, maxWidth: 460, margin: "0 auto" }}>
          <div className="rounded-2xl px-3.5 py-2.5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[11px] font-bold tracking-wide" style={{ color: "var(--text-muted)" }}>
                이 카드가 속한 목표 · {focusedMasterName || "미분류"}
              </p>
              <span
                className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg"
                style={{
                  color: focusedMasterDday === "D-DAY" ? "#fff" : "var(--gold-dim)",
                  background: focusedMasterDday === "D-DAY" ? "rgba(244,63,94,0.75)" : "rgba(var(--brand-rgb),0.14)",
                  border: focusedMasterDday === "D-DAY" ? "1px solid rgba(244,63,94,0.95)" : "1px solid rgba(var(--brand-rgb),0.3)",
                }}
              >
                {focusedMasterDday}
              </span>
            </div>
            <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--fg)" }}>
              {focusedMasterGoalText}
            </p>
            {focusedMasterDeadline && (
              <p className="font-mono text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
                기한 {focusedMasterDeadline}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Card Stack */}
      <div className={focusedId ? "absolute inset-0 flex justify-center" : "flex justify-center"} style={{ padding: "0 20px" }}>
        <div className="relative w-full" style={{ maxWidth: 460 }}>
          {visibleRegular.map((card, i) => {
            const masterName = masterCards.find((m) => m.id === card.masterId)?.name ?? "";
            const isFocused = focusedId === card.id;
            const hoverOffset = getHoverOffset(i);
            const preset = getPreset(card.designPresetId);
            const isSwiping = swipeCardId === card.id;
            const swipeProgress = isSwiping ? Math.min(Math.abs(swipeX) / swipeThreshold, 1) : 0;

            const cl = getChecklist(card.id);
            const cp = clampChecklistPage(checklistPageByCard[card.id] ?? 0, cl);
            const pc = checklistPageCount(cl);
            const pageItems = checklistPageSlice(cl, cp);

            // Calculate position
            let top: string | number;
            let zIndex: number;
            let opacity = 1;
            let scale = 1;
            let pointerEvents: "auto" | "none" = "auto";

            if (focusedId) {
              if (isFocused) {
                top = FOCUSED_TOP;
                zIndex = 300;
                scale = 1;
              } else {
                const queueIndex = i < focusedIndex ? i : i - 1;
                top = `calc(${FOCUSED_TOP}px + (min(100vw, 500px) - 40px) * 0.632 + 150px + ${Math.min(queueIndex, 5) * 12}px)`;
                zIndex = 100 + i;
                opacity = 0.6;
                pointerEvents = "none";
              }
            } else {
              top = i * OVERLAP + hoverOffset;
              zIndex = i;
            }

            return (
              <div
                key={card.id}
                className="absolute left-0 right-0 animate-fadeInUp"
                style={{
                  top,
                  zIndex,
                  opacity,
                  transform: `scale(${scale})`,
                  transition: isSwiping ? "none" : "top 0.4s cubic-bezier(0.32, 0.72, 0, 1), transform 0.3s ease, opacity 0.3s ease",
                  animationDelay: `${i * 0.05}s`,
                  animationFillMode: "both",
                  pointerEvents,
                  touchAction: focusedId ? "none" : "pan-y",
                  perspective: "1000px",
                }}
                onMouseEnter={() => !focusedId && !reorderMode && setHoveredIndex(i)}
                onMouseLeave={() => !focusedId && setHoveredIndex(null)}
                onClick={() => { if (didSwipeRef.current) { didSwipeRef.current = false; return; } if (!isSwiping) handleCardClick(card.id); }}
                onTouchStart={(e) => handleTouchStart(e, card.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => handleMouseDown(e, card.id)}
              >
                {/* Swipe indicators */}
                {isSwiping && (
                  <>
                    {swipeX < 0 && (
                      <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center z-[-1]" style={{ right: 0, opacity: swipeProgress }}>
                        <div className="flex items-center gap-2 px-4" style={{ marginLeft: "auto" }}>
                          <Trash2 size={24} color="#EF4444" strokeWidth={2.5} />
                        </div>
                      </div>
                    )}
                    {swipeX > 0 && (
                      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center z-[-1]" style={{ left: 0, opacity: swipeProgress }}>
                        <div className="flex items-center gap-2 px-4">
                          <Check size={24} color="#22C55E" strokeWidth={2.5} />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div style={{ transform: isSwiping ? `translateX(${swipeX}px)` : "none", transition: isSwiping ? "none" : "transform 0.3s ease" }}>
                {/* Card Front/Back Container */}
                <div
                  style={{
                    transformStyle: "preserve-3d",
                    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isFocused && showCardBack ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* Card Front */}
                  <div style={{ backfaceVisibility: "hidden" }}>
                    <CardStackItem 
                      card={card} 
                      masterName={masterName} 
                      liveSeconds={getLiveWorkSeconds(card)} 
                      isFocused={isFocused} 
                    />
                  </div>
                  
                  {/* Card Back */}
                  <div 
                    style={{ 
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      borderRadius: 16,
                      overflow: "hidden",
                      aspectRatio: "85.6 / 53.98",
                      background: preset.gradient,
                      border: "1px solid rgba(255,255,255,0.15)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    }}
                  >
                    <div className={preset.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
                    {/* Magnetic Stripe */}
                    <div style={{ 
                      position: "absolute", 
                      top: 16, 
                      left: 0, 
                      right: 0, 
                      height: 36, 
                      background: "linear-gradient(180deg, #1a1a1a 0%, #333 50%, #1a1a1a 100%)",
                    }} />
                    {/* Card Info Area */}
                    <div style={{ 
                      position: "absolute", 
                      top: 64, 
                      left: 16, 
                      right: 16, 
                      bottom: 12,
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 2, flexShrink: 0 }}>
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                          CHECKLIST · 총 {cl.length}
                          {cl.length >= CHECKLIST_MAX_TOTAL ? " (상한)" : ""}
                        </p>
                        {pc > 1 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button
                              type="button"
                              aria-label="이전 페이지"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cp > 0) setChecklistPageByCard((p) => ({ ...p, [card.id]: cp - 1 }));
                              }}
                              style={{ background: "rgba(0,0,0,0.2)", border: "none", borderRadius: 4, padding: 2, cursor: "pointer", display: "flex", opacity: cp === 0 ? 0.35 : 1 }}
                            >
                              <ChevronLeft size={12} color="rgba(255,255,255,0.85)" />
                            </button>
                            <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.55)", minWidth: 28, textAlign: "center" }}>{cp + 1}/{pc}</span>
                            <button
                              type="button"
                              aria-label="다음 페이지"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cp < pc - 1) setChecklistPageByCard((p) => ({ ...p, [card.id]: cp + 1 }));
                              }}
                              style={{ background: "rgba(0,0,0,0.2)", border: "none", borderRadius: 4, padding: 2, cursor: "pointer", display: "flex", opacity: cp >= pc - 1 ? 0.35 : 1 }}
                            >
                              <ChevronRight size={12} color="rgba(255,255,255,0.85)" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div
                        style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3, touchAction: "pan-y" }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          checklistSwipeRef.current = { cardId: card.id, x: e.touches[0].clientX };
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          const start = checklistSwipeRef.current;
                          checklistSwipeRef.current = null;
                          if (!start || start.cardId !== card.id) return;
                          const dx = e.changedTouches[0].clientX - start.x;
                          if (dx < -48 && cp < pc - 1) {
                            setChecklistPageByCard((p) => ({ ...p, [card.id]: cp + 1 }));
                          } else if (dx > 48 && cp > 0) {
                            setChecklistPageByCard((p) => ({ ...p, [card.id]: cp - 1 }));
                          }
                        }}
                      >
                        {pageItems.length === 0 ? (
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>아래에서 항목을 추가하세요</p>
                        ) : (
                          pageItems.map((item) => (
                          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleCheckItem(card.id, item.id); }}
                              style={{
                                width: 14, height: 14, borderRadius: 3, border: "1px solid rgba(255,255,255,0.4)",
                                background: item.checked ? "var(--gold)" : "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", flexShrink: 0,
                              }}
                            >
                              {item.checked && <Check size={10} color="#fff" strokeWidth={3} />}
                            </button>
                            <span style={{
                              fontSize: 10, color: "rgba(255,255,255,0.8)", flex: 1,
                              textDecoration: item.checked ? "line-through" : "none",
                              opacity: item.checked ? 0.6 : 1,
                            }}>{item.text}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCheckItem(card.id, item.id); }}
                              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}
                            >
                              <X size={10} color="rgba(255,255,255,0.4)" />
                            </button>
                          </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>{/* close swipe wrapper */}
              </div>
            );
          })}
          {/* Spacer for scrolling */}
          <div style={{ height: visibleRegular.length * OVERLAP + 240 }} />
        </div>
      </div>

      {/* Focused Card Actions - Between card and queued cards */}
      {focusedId && focusedCard && (
        <>
          {/* Invisible backdrop - clicking empty area between buttons returns home */}
          <div 
            className="absolute inset-0 z-[250]" 
            onClick={handleBackdropClick}
          />
          
          {/* Action Buttons below focused card */}
          {!showCardBack ? (
            <div
              className="absolute left-5 right-5 z-[320] animate-slideUp"
              style={{
                top: `calc(${FOCUSED_TOP}px + (min(100vw, 500px) - 40px) * 0.632 + 20px)`,
                maxWidth: 460, margin: "0 auto",
              }}
            >
              {/* Work/Complete Actions */}
              <div className="flex gap-3">
                {!focusedCard.isWorking ? (
                  <>
                    <button 
                      className="btn-press flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-base border-none cursor-pointer"
                      style={{ background: "var(--gradient-cta)", color: "#FFFFFF", boxShadow: "var(--shadow-cta)" }}
                      onClick={(e) => { e.stopPropagation(); handleStartWork(); }}
                    >
                      <Play size={20} fill="#FFFFFF" /> 출근하기
                    </button>
                    <button 
                      className="btn-press flex-1 py-4 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-[15px] cursor-pointer"
                      style={{ background: "var(--surface-1)", color: "var(--fg)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                      onClick={(e) => { e.stopPropagation(); handleComplete(); }}
                    >
                      <Check size={18} strokeWidth={3} /> 완료하기
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn-press flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-base cursor-pointer"
                      style={{ background: "var(--surface-1)", color: "var(--fg)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                      onClick={(e) => { e.stopPropagation(); handleEndWork(); }}
                    >
                      <Check size={20} strokeWidth={3} /> 퇴근하기
                    </button>
                    <button 
                      className="btn-press py-4 px-5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer"
                      style={{ 
                        background: focusedCard.currentBreakStart ? "rgba(var(--brand-rgb),0.15)" : "var(--surface-1)", 
                        color: focusedCard.currentBreakStart ? "var(--gold-dim)" : "var(--fg)", 
                        border: focusedCard.currentBreakStart ? "1px solid rgba(var(--brand-rgb),0.3)" : "1px solid var(--border)" 
                      }}
                      onClick={(e) => { e.stopPropagation(); handleBreak(); }}
                    >
                      <Coffee size={16} />
                    </button>
                  </>
                )}
              </div>
              <div className="mt-3 rounded-2xl px-4 py-3" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  작업 통계
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="rounded-lg p-2.5" style={{ background: "var(--surface-2)" }}>
                    <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>전체 작업시간</p>
                    <p className="font-mono text-[13px] font-bold" style={{ color: "var(--fg)" }}>{formatSeconds(focusedTotalWork)}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: "var(--surface-2)" }}>
                    <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>쉬는 시간</p>
                    <p className="font-mono text-[13px] font-bold" style={{ color: "var(--gold-dim)" }}>{formatSeconds(focusedTotalBreak)}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: "var(--surface-2)" }}>
                    <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>순 작업시간</p>
                    <p className="font-mono text-[13px] font-bold" style={{ color: "var(--fg)" }}>{formatSeconds(focusedNetWork)}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: "var(--surface-2)" }}>
                    <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>순 작업시간 비율</p>
                    <p className="font-mono text-[13px] font-bold" style={{ color: "var(--fg)" }}>
                      {focusedTotalWork > 0 ? `${focusedNetRatio}%` : "—"}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] mt-2" style={{ color: "var(--text-faint)" }}>
                  휴식 비율 {focusedTotalWork > 0 ? `${focusedBreakRatio}%` : "—"} (휴식시간/전체 작업시간)
                </p>
                {focusedTotalWork > 0 && (
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                    {getBreakRatioMessage(focusedBreakRatio)}
                  </p>
                )}
              </div>

              {/* Tap hint */}
              <p className="text-center text-xs mt-4" style={{ color: "var(--text-faint)" }}>카드를 다시 탭하면 세부항목을 볼 수 있어요</p>
            </div>
          ) : (
            /* Card Back - Checklist input */
            <div
              className="absolute left-5 right-5 z-[320] animate-slideUp"
              style={{
                top: `calc(${FOCUSED_TOP}px + (min(100vw, 500px) - 40px) * 0.632 + 20px)`,
                maxWidth: 460, margin: "0 auto",
              }}
            >
              <div className="rounded-2xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                  세부항목 추가 (페이지당 {CHECKLIST_ITEMS_PER_PAGE}개 · 카드 뒤에서 옆으로 넘겨 더 보기)
                </p>
                {focusedCard && focusedChecklistPageCount > 1 && (
                  <div className="flex items-center justify-between mb-2 mt-2">
                    <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                      보기 {focusedChecklistPage + 1}/{focusedChecklistPageCount} · 총 {focusedChecklistLen}개
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="btn-press p-1 rounded-lg"
                        style={{ border: "1px solid var(--border)", opacity: focusedChecklistPage === 0 ? 0.4 : 1 }}
                        disabled={focusedChecklistPage === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!focusedCard || focusedChecklistPage === 0) return;
                          setChecklistPageByCard((p) => ({ ...p, [focusedCard.id]: focusedChecklistPage - 1 }));
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-press p-1 rounded-lg"
                        style={{ border: "1px solid var(--border)", opacity: focusedChecklistPage >= focusedChecklistPageCount - 1 ? 0.4 : 1 }}
                        disabled={focusedChecklistPage >= focusedChecklistPageCount - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!focusedCard || focusedChecklistPage >= focusedChecklistPageCount - 1) return;
                          setChecklistPageByCard((p) => ({ ...p, [focusedCard.id]: focusedChecklistPage + 1 }));
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      e.stopPropagation();
                      addCheckItem();
                    }}
                    placeholder={focusedChecklistAtMax ? `항목은 최대 ${CHECKLIST_MAX_TOTAL}개까지` : "할 일을 입력하세요"}
                    maxLength={30}
                    disabled={!focusedCard || focusedChecklistAtMax}
                    className="flex-1 rounded-xl py-2.5 px-3 text-sm outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    className="btn-press px-4 rounded-xl font-bold cursor-pointer"
                    style={{ background: focusedChecklistAtMax ? "var(--surface-2)" : "var(--gradient-cta)", color: focusedChecklistAtMax ? "var(--text-faint)" : "#fff", border: "none" }}
                    onClick={(e) => { e.stopPropagation(); addCheckItem(); }}
                    disabled={!focusedCard || focusedChecklistAtMax}
                  >
                    추가
                  </button>
                </div>
              </div>
              <p className="text-center text-xs mt-4" style={{ color: "var(--text-faint)" }}>빈 공간을 탭하면 앞면으로 돌아가요</p>
            </div>
          )}
        </>
      )}

      {/* Break Timer Modal */}
      {showBreakTimer && (
        <div className="animate-fadeIn fixed inset-0 z-[600] flex items-end overlay-bg" onClick={() => setShowBreakTimer(false)}>
          <div className="animate-slideUp w-full rounded-t-3xl p-6" style={{ background: "var(--surface-1)", borderTop: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full mx-auto mb-6" style={{ background: "var(--border)" }} />
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--fg)" }}>휴식 타이머 (선택)</h3>
            <div className="flex gap-3 mb-6">
              {[5, 10, 15, 20, 30].map((min) => (
                <button key={min} className="btn-press flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer" onClick={() => setBreakTimerInput(String(min))} style={{ background: breakTimerInput === String(min) ? "rgba(var(--brand-rgb),0.15)" : "var(--surface-2)", color: breakTimerInput === String(min) ? "var(--gold-dim)" : "var(--text-muted)", border: breakTimerInput === String(min) ? "1px solid var(--gold)" : "1px solid transparent" }}>{min}분</button>
              ))}
            </div>
            <button className="btn-press w-full py-4 rounded-2xl font-bold border-none cursor-pointer" style={{ background: "var(--gradient-cta)", color: "#FFFFFF" }} onClick={confirmBreak}>{breakTimerInput}분 타이머로 휴식 시작</button>
            <button
              className="btn-press w-full py-3 mt-2 rounded-2xl font-semibold cursor-pointer"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
              onClick={() => {
                if (focusedCard && !focusedCard.currentBreakStart) startBreak(focusedCard.id);
                setShowBreakTimer(false);
              }}
            >
              휴식 타이머 없이 시작
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && focusedCard && (
        <EditRegularCardModal
          key={focusedCard.id}
          focusedCard={focusedCard}
          masterCards={masterCards}
          onSave={(updates) => {
            updateRegularCard(focusedCard.id, updates);
            setShowEdit(false);
          }}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// GALLERY VIEW (sub-card detail)
// ═══════════════════════════════════════════

function GalleryView({ masterId, onClose }: { masterId: string; onClose: () => void }) {
  const { masterCards, presetCards, regularCards, recipeCards, revertRegularCompletion, setActiveTab } = useApp();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [galleryChecklistPage, setGalleryChecklistPage] = useState(0);

  const selected = masterCards.find((m) => m.id === masterId);
  if (!selected) return null;

  const masterPresets = presetCards.filter((p) => p.masterId === masterId);
  const cards = [...regularCards.filter((r) => r.masterId === masterId), ...recipeCards.filter((r) => r.masterId === masterId)]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const presetCardsChildren = selectedPresetId
    ? regularCards.filter((r) => r.masterId === masterId && r.presetId === selectedPresetId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const detailCard = selectedCardId ? cards.find(c => c.id === selectedCardId) : null;
  const detailRegular = detailCard?.type === "regular" ? detailCard as RegularCard : null;
  const detailRecipe = detailCard?.type === "recipe" ? detailCard as RecipeCard : null;

  // Load checklist from localStorage
  const getChecklist = (cardId: string) => {
    try { const raw = localStorage.getItem(`checklist_${cardId}`); return raw ? JSON.parse(raw) : []; } catch { return []; }
  };

  if (detailCard) {
    const cp = getPreset(detailCard.designPresetId);
    const checklistRaw = getChecklist(detailCard.id);
    const checklist: ChecklistItem[] = Array.isArray(checklistRaw)
      ? checklistRaw.map((x: { id: string; text: string; checked: boolean }) => x)
      : [];
    const gPage = clampChecklistPage(galleryChecklistPage, checklist);
    const gPc = checklistPageCount(checklist);
    const gSlice = checklistPageSlice(checklist, gPage);
    const totalWork = detailRegular?.totalWorkSeconds || 0;
    const totalBreak = detailRegular?.totalBreakSeconds || 0;
    const sessions = detailRegular?.sessions?.length || 0;
    const todayStr = new Date().toISOString().split("T")[0];
    const canRevertToHome = Boolean(detailRegular && detailRegular.date === todayStr && detailRegular.isCompleted);

    return (
      <div className="animate-fadeIn fixed inset-0 z-[500] overflow-y-auto" style={{ background: "linear-gradient(180deg, #F8F8F4 0%, #EFEFE9 100%)" }}>
        <div className="p-5 pb-10 mx-auto" style={{ maxWidth: 500 }}>
          <div className="flex items-center justify-between mb-4">
            <button className="btn-press flex items-center gap-1.5 bg-transparent border-none cursor-pointer py-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }} onClick={() => { setSelectedCardId(null); setShowBack(false); setGalleryChecklistPage(0); }}>
              <ChevronLeft size={18} /> 목록으로
            </button>
          </div>
          {detailRecipe ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "85.6 / 53.98", background: cp.gradient, border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
                  <div className={cp.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
                  <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: "10px 14px 12px" }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>RECIPE</span>
                      <div style={{ fontSize: 16, fontWeight: 700, color: cp.textColor, marginTop: 2, lineHeight: 1.2 }}>{detailCard.name}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{new Date(detailCard.createdAt).toLocaleDateString("ko-KR")}</div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>레시피</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs mb-4" style={{ color: "var(--text-faint)" }}>설명은 아래 패널에 표시됩니다</p>
              <div className="rounded-2xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>레시피 · 설명</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--fg)" }}>{detailRecipe.content?.trim() ? detailRecipe.content : "작성된 설명이 없습니다."}</p>
              </div>
            </>
          ) : (
            <>
              <div style={{ perspective: "1000px", marginBottom: 16 }} onClick={() => setShowBack(!showBack)}>
                <div style={{ transformStyle: "preserve-3d", transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)", transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                  <div style={{ backfaceVisibility: "hidden" }}>
                    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "85.6 / 53.98", background: cp.gradient, border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
                      <div className={cp.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
                      <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: "10px 14px 12px" }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>CARD</span>
                          <div style={{ fontSize: 16, fontWeight: 700, color: cp.textColor, marginTop: 2, lineHeight: 1.2 }}>{detailCard.name}</div>
                          {detailRegular && totalWork > 0 && (
                            <div className="font-mono tabular-nums" style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.78)", marginTop: 4, letterSpacing: "0.02em", textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>
                              {formatSeconds(totalWork)}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <div className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{new Date(detailCard.createdAt).toLocaleDateString("ko-KR")}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", top: 0, left: 0, right: 0 }}>
                    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "85.6 / 53.98", background: cp.gradient, border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
                      <div className={cp.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
                      <div style={{ position: "absolute", top: 16, left: 0, right: 0, height: 36, background: "linear-gradient(180deg, #1a1a1a, #333, #1a1a1a)" }} />
                      <div style={{ position: "absolute", top: 64, left: 16, right: 16, bottom: 12, background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", overflow: "auto" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, gap: 6 }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: 0 }}>CHECKLIST · 총 {checklist.length}</p>
                          {gPc > 1 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <button type="button" aria-label="이전" onClick={(e) => { e.stopPropagation(); setGalleryChecklistPage((p) => Math.max(0, clampChecklistPage(p, checklist) - 1)); }} style={{ background: "rgba(0,0,0,0.2)", border: "none", borderRadius: 4, padding: 2, cursor: "pointer", opacity: gPage === 0 ? 0.35 : 1 }}>
                                <ChevronLeft size={12} color="rgba(255,255,255,0.85)" />
                              </button>
                              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>{gPage + 1}/{gPc}</span>
                              <button type="button" aria-label="다음" onClick={(e) => { e.stopPropagation(); setGalleryChecklistPage((p) => Math.min(clampChecklistPage(p, checklist) + 1, gPc - 1)); }} style={{ background: "rgba(0,0,0,0.2)", border: "none", borderRadius: 4, padding: 2, cursor: "pointer", opacity: gPage >= gPc - 1 ? 0.35 : 1 }}>
                                <ChevronRight size={12} color="rgba(255,255,255,0.85)" />
                              </button>
                            </div>
                          )}
                        </div>
                        {checklist.length === 0 ? (
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>세부항목 없음</p>
                        ) : (
                          gSlice.map((item) => (
                            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <div style={{ width: 12, height: 12, borderRadius: 3, border: "1px solid rgba(255,255,255,0.4)", background: item.checked ? "var(--gold)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {item.checked && <Check size={8} color="#fff" strokeWidth={3} />}
                              </div>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", textDecoration: item.checked ? "line-through" : "none", opacity: item.checked ? 0.6 : 1 }}>{item.text}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs mb-4" style={{ color: "var(--text-faint)" }}>카드를 탭하면 체크리스트를 볼 수 있어요</p>
              {detailRegular && (
                <div className="rounded-2xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-bold tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>통계</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg px-3 py-2" style={{ background: "var(--surface-2)" }}>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>작업시간</p>
                      <p className="font-mono text-sm font-bold" style={{ color: "var(--fg)" }}>{formatSeconds(totalWork)}</p>
                    </div>
                    <div className="rounded-lg px-3 py-2" style={{ background: "var(--surface-2)" }}>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>휴식시간</p>
                      <p className="font-mono text-sm font-bold" style={{ color: "var(--fg)" }}>{formatSeconds(totalBreak)}</p>
                    </div>
                    <div className="rounded-lg px-3 py-2" style={{ background: "var(--surface-2)" }}>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>세션수</p>
                      <p className="font-mono text-sm font-bold" style={{ color: "var(--fg)" }}>{sessions}회</p>
                    </div>
                  </div>
                  {canRevertToHome && (
                    <button
                      type="button"
                      className="btn-press w-full mt-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                      style={{ border: "1px solid rgba(var(--brand-rgb),0.35)", background: "rgba(var(--brand-rgb),0.1)", color: "var(--gold-dim)" }}
                      onClick={() => {
                        revertRegularCompletion(detailRegular.id);
                        setActiveTab("home");
                        onClose();
                      }}
                    >
                      <RotateCcw size={18} />
                      홈 화면으로 되돌리기 (오늘 날짜 카드)
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (selectedPresetId) {
    const preset = masterPresets.find((p) => p.id === selectedPresetId);
    const totalWork = presetCardsChildren.reduce((sum, c) => sum + (c.totalWorkSeconds || 0), 0);
    const totalBreak = presetCardsChildren.reduce((sum, c) => sum + (c.totalBreakSeconds || 0), 0);
    const netWork = Math.max(0, totalWork - totalBreak);
    const netRatio = totalWork > 0 ? Math.round((netWork / totalWork) * 100) : 0;
    return (
      <div className="animate-fadeIn fixed inset-0 z-[500] overflow-y-auto p-6 pb-10" style={{ background: "linear-gradient(180deg, #F8F8F4 0%, #EFEFE9 100%)" }}>
        <div className="mx-auto" style={{ maxWidth: 500 }}>
          <div className="flex items-center justify-between mb-4">
            <button className="btn-press flex items-center gap-1.5 bg-transparent border-none cursor-pointer py-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }} onClick={() => { setSelectedPresetId(null); setSelectedCardId(null); }}>
              <ChevronLeft size={18} /> 프리셋 목록
            </button>
            <h3 className="text-sm font-extrabold" style={{ color: "var(--fg)" }}>{preset?.name ?? "프리셋"} 하위카드</h3>
          </div>
          <div className="rounded-2xl p-4 mb-3" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold tracking-wide" style={{ color: "var(--text-muted)" }}>프리셋 통계</p>
            <p className="font-mono text-lg font-bold mt-1" style={{ color: "var(--fg)" }}>{totalWork > 0 ? `${netRatio}%` : "—"}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>순 작업시간 {formatSeconds(netWork)} / 전체 {formatSeconds(totalWork)} · 휴식 {formatSeconds(totalBreak)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {presetCardsChildren.map((c) => {
              const cp = getPreset(c.designPresetId);
              return (
                <div key={c.id} className="btn-press rounded-xl p-2.5 cursor-pointer" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid var(--border)" }} onClick={() => { setSelectedCardId(c.id); setGalleryChecklistPage(0); }}>
                  <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: "85.6 / 53.98", background: cp.gradient, border: "1px solid rgba(255,255,255,0.15)" }}>
                    <div className={cp.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.32 }} />
                    <div className="absolute inset-0 p-2.5 flex flex-col justify-between">
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>CARD</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: cp.textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                        {(c.totalWorkSeconds || 0) > 0 && <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{formatSeconds(c.totalWorkSeconds || 0)}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn fixed inset-0 z-[500] overflow-y-auto p-6 pb-10" style={{ background: "linear-gradient(180deg, #F8F8F4 0%, #EFEFE9 100%)" }}>
      <div className="mx-auto" style={{ maxWidth: 500 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold" style={{ color: "var(--fg)" }}>{selected.name} 하위카드</h3>
          <button className="btn-press rounded-xl px-3 py-2 font-bold cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }} onClick={onClose}>닫기</button>
        </div>
        {masterPresets.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>프리셋 카드</p>
            <div className="grid grid-cols-2 gap-3">
              {masterPresets.map((p) => {
                const cp = getPreset(p.designPresetId);
                const childrenCount = regularCards.filter((r) => r.presetId === p.id).length;
                return (
                  <div key={p.id} className="btn-press rounded-xl p-2.5 cursor-pointer" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid var(--border)" }} onClick={() => setSelectedPresetId(p.id)}>
                    <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: "85.6 / 53.98", background: cp.gradient, border: "1px solid rgba(255,255,255,0.15)" }}>
                      <div className={cp.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.32 }} />
                      <div className="absolute inset-0 p-2.5 flex flex-col justify-between">
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>PRESET</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: cp.textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                          <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{childrenCount}개 카드</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => {
            const cp = getPreset(c.designPresetId);
            const workSecs = c.type === "regular" ? (c as RegularCard).totalWorkSeconds || 0 : 0;
            return (
              <div key={c.id} className="btn-press rounded-xl p-2.5 cursor-pointer" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid var(--border)" }} onClick={() => { setSelectedCardId(c.id); setGalleryChecklistPage(0); }}>
                <div className="relative w-full rounded-lg overflow-hidden" style={{ aspectRatio: "85.6 / 53.98", background: cp.gradient, border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div className={cp.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.32 }} />
                  <div className="absolute inset-0 p-2.5 flex flex-col justify-between">
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)" }}>{c.type === "recipe" ? "RECIPE" : "CARD"}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: cp.textColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                      {c.type === "regular" && workSecs > 0 && <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{formatSeconds(workSecs)}</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// VAULT SCREEN
// ═══════════════════════════════════════════

function VaultScreen() {
  const { masterCards, regularCards, recipeCards, setMasterStatus, updateMasterCard } = useApp();
  const [masterLane, setMasterLane] = useState<"general" | "recipe">("general");
  const [filter, setFilter] = useState<"active" | "gold" | "silver">("active");
  const [focusedMasterId, setFocusedMasterId] = useState<string | null>(null);
  const [galleryMasterId, setGalleryMasterId] = useState<string | null>(null);
  const [editMasterId, setEditMasterId] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (masterCards.length === 0) {
    return (
      <div className="animate-fadeInUp flex flex-col items-center justify-center h-full gap-6 p-16">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "rgba(var(--brand-rgb),0.08)", border: "1px solid rgba(var(--brand-rgb),0.2)" }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="10" width="32" height="22" rx="3" stroke="var(--gold)" strokeWidth="1.5" /><rect x="4" y="10" width="32" height="6" fill="var(--gold)" opacity="0.2" /><circle cx="32" cy="26" r="3" stroke="var(--gold)" strokeWidth="1.5" /></svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--fg)" }}>보관함이 비어있어요</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>마스터카드를 만들고<br />활동을 기록해 보세요</p>
        </div>
      </div>
    );
  }

  const filteredMasters = masterCards.filter((m) => {
    const category = (m as MasterCard & { masterCategory?: "general" | "recipe" }).masterCategory ?? "general";
    if (category !== masterLane) return false;
    if (filter === "active") return m.status === "active";
    if (filter === "gold") return m.status === "gold";
    return m.status === "silver";
  });

  const OVERLAP = 54;
  const HOVER_LIFT = -12;
  const FOCUS_TOP = 60; // Space for back button
  const QUEUE_BASE = 140;
  const QUEUE_STEP = 8;

  // Individual hover - only the hovered card lifts (no wave effect)
  const getHoverOffset = (cardIndex: number) => {
    if (hoveredIndex === null || focusedMasterId) return 0;
    if (cardIndex === hoveredIndex) return HOVER_LIFT;
    return 0;
  };

  const renderMasterStack = () => filteredMasters.length > 0 && (
    <section className="mb-8 relative mx-auto" style={{ maxWidth: 460 }}>
      {/* Back button above cards when focused */}
      {focusedMasterId && (
        <div className="absolute -top-10 left-0 right-0 z-[400] flex items-center justify-between animate-fadeIn">
          <button
            type="button"
            className="btn-press flex items-center gap-1.5 bg-transparent border-none cursor-pointer py-2 px-1 text-sm font-semibold"
            style={{ color: "var(--text-muted)" }}
            onClick={() => setFocusedMasterId(null)}
          >
            <ChevronLeft size={18} /> 뒤로가기
          </button>
          <button
            type="button"
            className="btn-press flex items-center gap-1.5 bg-transparent border-none cursor-pointer py-2 px-1 text-sm font-bold"
            style={{ color: "var(--text-muted)" }}
            onClick={(e) => {
              e.stopPropagation();
              setEditMasterId(focusedMasterId);
            }}
          >
            <Edit3 size={16} /> 편집하기
          </button>
        </div>
      )}
      
      {!focusedMasterId && (
        <h3 className="text-xs font-bold tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
          {(masterLane === "recipe" ? "레시피 마스터 카드보기" : "일반 마스터 카드보기")} · {filter === "active" ? "진행" : filter === "gold" ? "골드" : "실버"} — {filteredMasters.length}개
        </h3>
      )}
      <div className="relative" style={{ marginTop: focusedMasterId ? 40 : 0 }}>
        {/* focusedIndex를 루프 밖에서 한 번만 계산 */}
        {(() => {
          const focusedIndex = focusedMasterId ? filteredMasters.findIndex((m) => m.id === focusedMasterId) : -1;
          return filteredMasters.map((card, i) => {
          const preset = getPreset(card.designPresetId);
          const children = regularCards.filter((r) => r.masterId === card.id);
          const rChildren = recipeCards.filter((r) => r.masterId === card.id);
          const allChildren = [...children, ...rChildren].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const isFocused = focusedMasterId === card.id;
          const isGold = card.status === "gold";
          const isSilver = card.status === "silver";
          const hoverOffset = getHoverOffset(i);

          const totalWork = children.reduce((sum, c) => sum + (c.totalWorkSeconds || 0), 0);

          let top: string | number;
          if (focusedMasterId) {
            if (isFocused) {
              top = 0; // Focused card at top
            } else {
              // Other cards go below the stats panel, peeking out
              const queueIndex = i < focusedIndex ? i : i - 1;
              top = `calc((min(100vw, 500px) - 40px) * 0.632 * 0.65 + 230px + ${Math.min(queueIndex, 5) * 12}px)`;
            }
          } else {
            top = i * OVERLAP + hoverOffset;
          }

          return (
            <div
              key={card.id}
              className="animate-fadeInUp absolute left-0 right-0"
              style={{
                animationDelay: `${i * 0.06}s`,
                animationFillMode: "both",
                top,
                zIndex: isFocused ? 300 : 100 + i,
                transition: "top 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.22s ease",
                transform: isFocused ? "scale(0.65)" : "scale(1)",
                transformOrigin: "top center",
                boxShadow: isFocused ? "0 12px 32px rgba(0,0,0,0.18)" : "0 8px 24px rgba(0,0,0,0.12)",
                opacity: focusedMasterId && !isFocused ? 0.85 : 1,
                pointerEvents: focusedMasterId && !isFocused ? "none" : "auto"
              }}
              onMouseEnter={() => !focusedMasterId && setHoveredIndex(i)}
              onMouseLeave={() => !focusedMasterId && setHoveredIndex(null)}
            >
              <div className="btn-press relative w-full rounded-2xl overflow-hidden cursor-pointer" onClick={() => setFocusedMasterId(card.id)} style={{ aspectRatio: "85.6 / 53.98", background: preset.gradient, border: isFocused ? "2px solid rgba(var(--brand-rgb),0.6)" : "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", transition: "all 0.2s" }}>
                <div className={preset.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
                {isGold && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: GOLD_METAL_RIBBON, boxShadow: "0 1px 3px rgba(0,0,0,0.35)" }} />}
                {isSilver && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: SILVER_METAL_RIBBON, boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />}
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "7px 14px 11px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: preset.textColor, lineHeight: 1.2, flex: 1, minWidth: 0 }}>{card.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {preset.limited && (
                          <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 9, fontWeight: 700, background: "var(--gradient-badge)", color: "#0A0A0A" }}>
                            {preset.limited}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: isGold ? GOLD_BADGE_COLOR : isSilver ? SILVER_BADGE_COLOR : "rgba(255,255,255,0.5)",
                            textShadow: isGold ? GOLD_BADGE_SHADOW : isSilver ? SILVER_BADGE_SHADOW : undefined,
                          }}
                        >
                          {isGold ? "GOLD" : isSilver ? "SILVER" : "MASTER"}
                        </span>
                      </div>
                    </div>
                    {totalWork > 0 && <div className="font-mono tabular-nums" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.78)", marginTop: 3, letterSpacing: "0.02em", textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>{formatSeconds(totalWork)}</div>}
                  </div>
                  <div style={{ width: 36, height: 27, borderRadius: 5, background: "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.08))", border: "1px solid rgba(255,255,255,0.15)" }} />
                  {card.hasGoal && card.goalContent?.trim() && (
                    <div style={{ marginTop: 6, padding: "5px 7px", borderRadius: 8, background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.12)", maxHeight: 44, overflow: "hidden" }}>
                      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>목표</p>
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.92)",
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {card.goalContent}
                      </p>
                      {card.goalDeadline && (
                        <p className="font-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                          기한 {card.goalDeadline}
                        </p>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{new Date(card.createdAt).toLocaleDateString("ko-KR")}</div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{allChildren.length}개 카드</span>
                  </div>
                </div>
              </div>
            </div>
          );
        });
        })()}
        <div style={{ height: filteredMasters.length * OVERLAP + 260 }} />
        {focusedMasterId && (() => {
          const selected = filteredMasters.find((m) => m.id === focusedMasterId);
          if (!selected) return null;
          const children = regularCards.filter((r) => r.masterId === selected.id);
          const totalWork = children.reduce((sum, c) => sum + (c.totalWorkSeconds || 0), 0);
          const totalBreak = children.reduce((sum, c) => sum + (c.totalBreakSeconds || 0), 0);
          const netWork = Math.max(0, totalWork - totalBreak);
          const netRatio = totalWork > 0 ? Math.round((netWork / totalWork) * 100) : 0;
          const assignedDays = new Set(children.map((c) => c.date)).size;
          const attendanceDays = new Set(
            children
              .filter((c) => (c.totalWorkSeconds || 0) >= 60 || (c.sessions ?? []).some((s) => (s.duration || 0) >= 60))
              .map((c) => c.date),
          ).size;
          const attendanceRate = assignedDays > 0 ? Math.round((attendanceDays / assignedDays) * 100) : 0;
          const completionRate = children.length > 0 ? Math.round((children.filter((c) => c.isCompleted).length / children.length) * 100) : 0;
          return (
            <div
              className="absolute left-0 right-0 z-[320] rounded-2xl p-3 animate-fadeInUp"
              style={{
                top: `calc((min(100vw, 500px) - 40px) * 0.632 * 0.65 + 20px)`,
                animationDelay: "0.15s",
                animationFillMode: "both",
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                boxShadow: "0 14px 36px rgba(0,0,0,0.12)"
              }}
            >
              <p className="text-[11px] font-bold tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>통계</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-semibold" style={{ color: "var(--text-faint)" }}>순 작업시간</p>
                  <p className="font-mono text-xl font-bold mt-1" style={{ color: "var(--fg)" }}>
                    {totalWork > 0 ? `${netRatio}%` : "—"}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                    {formatSeconds(netWork)} / {formatSeconds(totalWork)}
                  </p>
                  <p className="text-[9px] mt-1" style={{ color: "var(--text-faint)" }}>
                    {getBreakRatioMessage(Math.max(0, 100 - netRatio))}
                  </p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-semibold" style={{ color: "var(--text-faint)" }}>출석률</p>
                  <p className="font-mono text-xl font-bold mt-1" style={{ color: "var(--fg)" }}>
                    {assignedDays > 0 ? `${attendanceRate}%` : "—"}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                    {attendanceDays}일 / {assignedDays}일
                  </p>
                  <p className="text-[9px] mt-1" style={{ color: "var(--text-faint)" }}>
                    1분 이상 출근일 기준
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  className="btn-press w-full py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--fg)" }}
                  onClick={() => setGalleryMasterId(selected.id)}
                >
                  하위카드 보기
                </button>
                {selected.status === "active" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-press flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                      style={{
                        border: "1px solid rgba(180,140,40,0.45)",
                        background: "linear-gradient(180deg, rgba(255,230,150,0.35) 0%, rgba(212,175,55,0.22) 100%)",
                        color: "#7A5C0C",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                      }}
                      onClick={() => {
                        setMasterStatus(selected.id, "gold");
                        setFilter("gold");
                        setTimeout(() => setFocusedMasterId(null), 800);
                      }}
                    >
                      골드카드 전환
                    </button>
                    <button
                      type="button"
                      className="btn-press flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                      style={{
                        border: "1px solid rgba(148,163,184,0.55)",
                        background: "linear-gradient(180deg, rgba(229,231,235,0.35) 0%, rgba(156,163,175,0.2) 100%)",
                        color: "#334155",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                      }}
                      onClick={() => {
                        setMasterStatus(selected.id, "silver");
                        setFilter("silver");
                        setTimeout(() => setFocusedMasterId(null), 800);
                      }}
                    >
                      실버카드 전환
                    </button>
                  </div>
                )}
                {selected.status === "gold" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-press flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                      style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--fg)" }}
                      onClick={() => {
                        setMasterStatus(selected.id, "active");
                        setFilter("active");
                        setTimeout(() => setFocusedMasterId(null), 800);
                      }}
                    >
                      마스터 전환
                    </button>
                    <button
                      type="button"
                      className="btn-press flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                      style={{
                        border: "1px solid rgba(148,163,184,0.55)",
                        background: "linear-gradient(180deg, rgba(229,231,235,0.35) 0%, rgba(156,163,175,0.2) 100%)",
                        color: "#334155",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                      }}
                      onClick={() => {
                        setMasterStatus(selected.id, "silver");
                        setFilter("silver");
                        setTimeout(() => setFocusedMasterId(null), 800);
                      }}
                    >
                      실버카드 전환
                    </button>
                  </div>
                )}
                {selected.status === "silver" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-press flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                      style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--fg)" }}
                      onClick={() => {
                        setMasterStatus(selected.id, "active");
                        setFilter("active");
                        setTimeout(() => setFocusedMasterId(null), 800);
                      }}
                    >
                      마스터 전환
                    </button>
                    <button
                      type="button"
                      className="btn-press flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
                      style={{
                        border: "1px solid rgba(180,140,40,0.45)",
                        background: "linear-gradient(180deg, rgba(255,230,150,0.35) 0%, rgba(212,175,55,0.22) 100%)",
                        color: "#7A5C0C",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                      }}
                      onClick={() => {
                        setMasterStatus(selected.id, "gold");
                        setFilter("gold");
                        setTimeout(() => setFocusedMasterId(null), 800);
                      }}
                    >
                      골드카드 전환
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );

  return (
    <div className="h-full px-5 pt-4 pb-24" style={{ overflow: focusedMasterId ? "hidden" : "auto" }}>
      {!focusedMasterId && (
        <div className="mb-4">
          <div className="flex gap-2">
          <button className="btn-press flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer" onClick={() => setFilter("active")} style={{ background: filter === "active" ? "rgba(var(--brand-rgb),0.14)" : "var(--surface-2)", color: filter === "active" ? "var(--gold-dim)" : "var(--text-muted)", border: filter === "active" ? "1px solid var(--gold)" : "1px solid var(--border)" }}>진행</button>
          <button
            className="btn-press flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer"
            onClick={() => setFilter("gold")}
            style={{
              background: filter === "gold" ? "linear-gradient(180deg, rgba(255,230,150,0.5) 0%, rgba(212,175,55,0.28) 100%)" : "var(--surface-2)",
              color: filter === "gold" ? "#7A5C0C" : "var(--text-muted)",
              border: filter === "gold" ? "1px solid rgba(212,175,55,0.65)" : "1px solid var(--border)",
              boxShadow: filter === "gold" ? "inset 0 1px 0 rgba(255,255,255,0.4)" : undefined,
            }}
          >
            골드카드
          </button>
          <button
            className="btn-press flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer"
            onClick={() => setFilter("silver")}
            style={{
              background: filter === "silver" ? "linear-gradient(180deg, rgba(241,245,249,0.85) 0%, rgba(148,163,184,0.35) 100%)" : "var(--surface-2)",
              color: filter === "silver" ? "#334155" : "var(--text-muted)",
              border: filter === "silver" ? "1px solid rgba(148,163,184,0.65)" : "1px solid var(--border)",
              boxShadow: filter === "silver" ? "inset 0 1px 0 rgba(255,255,255,0.55)" : undefined,
            }}
          >
            실버카드
          </button>
          </div>
        </div>
      )}
      {renderMasterStack()}
      {!focusedMasterId && (
        <div className="fixed left-5 right-5 z-[220]" style={{ bottom: 104 }}>
          <div className="mx-auto flex max-w-[460px] items-center justify-between rounded-xl px-2 py-1.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <button
              type="button"
              className="btn-press p-1.5 rounded-lg cursor-pointer"
              style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
              onClick={() => setMasterLane((p) => (p === "general" ? "recipe" : "general"))}
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs font-bold" style={{ color: "var(--fg)" }}>
              {masterLane === "general" ? "일반 마스터 카드보기" : "레시피 마스터 카드보기"}
            </span>
            <button
              type="button"
              className="btn-press p-1.5 rounded-lg cursor-pointer"
              style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
              onClick={() => setMasterLane((p) => (p === "general" ? "recipe" : "general"))}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {focusedMasterId && (
        <div onClick={() => setFocusedMasterId(null)} className="fixed inset-0 z-[250] bg-transparent" />
      )}

      {galleryMasterId && <GalleryView masterId={galleryMasterId} onClose={() => setGalleryMasterId(null)} />}

      {editMasterId && (() => {
        const em = masterCards.find((m) => m.id === editMasterId);
        if (!em || em.type !== "master") return null;
        return (
          <EditVaultMasterModal
            key={editMasterId}
            master={em}
            onClose={() => setEditMasterId(null)}
            onSave={(u) => {
              updateMasterCard(editMasterId, u);
              setEditMasterId(null);
            }}
          />
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════
// PRESET SELECTOR
// ═══════════════════════════════════════════

function PresetSelector({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {CARD_PRESETS.map((p) => (
        <button key={p.id} className="btn-press relative shrink-0 w-24 h-14 rounded-xl overflow-hidden cursor-pointer" onClick={() => onSelect(p.id)} style={{ background: p.gradient, border: selected === p.id ? "2px solid var(--gold)" : "2px solid transparent", boxShadow: selected === p.id ? "var(--shadow-brand-ring)" : "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div className={p.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
          {p.limited && <div className="absolute top-1 right-1 px-1 rounded text-[8px] font-bold" style={{ background: "#FACC15", color: "#0f172a" }}>한정</div>}
          <div className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-medium" style={{ color: p.textColor }}>{p.name}</div>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// CREATE CARD SHEET
// ═══════════════════════════════════════════

function CreateCardSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addMasterCard, addRegularCard, addRecipeCard, addPresetCard, masterCards, presetCards } = useApp();
  const [step, setStep] = useState<"type" | "form">("type");
  const [selectedType, setSelectedType] = useState<"master" | "preset" | "regular" | "recipe">("regular");
  const [cardName, setCardName] = useState("");
  const [designId, setDesignId] = useState(CARD_PRESETS[0].id);
  const [hasGoal, setHasGoal] = useState(true);
  const [goalContent, setGoalContent] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [masterId, setMasterId] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"once" | "daily" | "weekly">("daily");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [recipeContent, setRecipeContent] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [showPresetAdd, setShowPresetAdd] = useState(false);
  const [presetAddName, setPresetAddName] = useState("");

  const activeMasters = masterCards.filter((m) => m.status === "active");
  const masterPresetsList = presetCards.filter((p) => p.masterId === masterId);
  const preset = getPreset(designId);

  const reset = () => {
    setStep("type");
    setCardName("");
    setDesignId(CARD_PRESETS[0].id);
    setHasGoal(true);
    setGoalContent("");
    setGoalDeadline("");
    setMasterId("");
    setIsScheduled(false);
    setScheduleMode("daily");
    setScheduleDate("");
    setScheduleTime("09:00");
    setWeekdays([]);
    setRecipeContent("");
    setSelectedPresetId("");
    setShowPresetAdd(false);
    setPresetAddName("");
  };
  const handleClose = () => { reset(); onClose(); };

  const handleTypeSelect = (type: "master" | "regular" | "recipe") => {
    setSelectedType(type);
    setStep("form");
    if (type === "master") {
      setHasGoal(true);
    }
    if ((type === "regular" || type === "recipe") && activeMasters.length > 0) {
      setMasterId(activeMasters[0].id);
    }
  };

  const handleCreate = () => {
    if (!cardName.trim()) return;
    if (selectedType === "master") {
      addMasterCard({ type: "master", name: cardName, designPresetId: designId, hasGoal, goalContent: hasGoal ? goalContent : undefined, goalDeadline: hasGoal ? goalDeadline : undefined });
    } else if (selectedType === "preset") {
      if (!masterId) return;
      addPresetCard({ type: "preset", masterId, name: cardName, designPresetId: designId });
    } else if (selectedType === "regular") {
      if (!masterId) return;
      const todayStr = new Date().toISOString().split("T")[0];
      if (isScheduled && scheduleMode === "once" && !scheduleDate) return;
      if (isScheduled && scheduleMode === "weekly" && weekdays.length === 0) return;
      addRegularCard({
        type: "regular",
        masterId,
        name: cardName,
        designPresetId: designId,
        presetId: selectedPresetId || undefined,
        isScheduled,
        ...(isScheduled
          ? {
              scheduleMode,
              scheduleTime: scheduleTime || "09:00",
              scheduleDate: scheduleMode === "once" ? scheduleDate : undefined,
              scheduleWeekdays: scheduleMode === "weekly" ? weekdays : undefined,
              date: scheduleMode === "once" ? scheduleDate : todayStr,
            }
          : {}),
      });
    } else {
      if (!masterId) return;
      addRecipeCard({ type: "recipe", masterId, name: cardName, designPresetId: designId, content: recipeContent });
    }
    handleClose();
  };

  const canSubmit =
    !!cardName.trim() &&
    (selectedType === "master" || !!masterId) &&
    (selectedType !== "regular" ||
      !isScheduled ||
      (scheduleMode === "once" && !!scheduleDate) ||
      scheduleMode === "daily" ||
      (scheduleMode === "weekly" && weekdays.length > 0));
  const inputStyle = "rounded-xl py-3 px-4 w-full text-[15px] outline-none";
  const labelStyle = "text-xs font-semibold tracking-wide mb-2 block";

  if (!open) return null;

  const TYPES = [
    { id: "master" as const, icon: Crown, title: "마스터카드", desc: "장기 목표와 일반 카드를 모아주는 최상위 카드", badge: "목표 설정 가능", color: MASTER_BRAND_RED, bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.28)" },
    { id: "regular" as const, icon: CreditCard, title: "일반카드", desc: "마스터카드 안에서 오늘의 할 일을 관리해요.", badge: "예약 발급 가능", color: "#3B82F6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.2)" },
    { id: "recipe" as const, icon: BookOpen, title: "레시피카드", desc: "특정 마스터카드에 소속된 참고자료나 아이디어 모음.", badge: "컬렉션", color: "#10B981", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)" },
  ];

  return (
    <div className="animate-fadeIn fixed inset-0 z-[500] flex items-end overlay-bg" onClick={handleClose}>
      <div className="animate-slideUp w-full rounded-t-3xl overflow-hidden max-h-[92vh]" style={{ background: "var(--surface-1)", borderTop: "1px solid var(--border)", boxShadow: "0 -8px 40px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center py-4 pb-2">
          <div className="w-12 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="flex items-center justify-between px-6 pb-4">
          <div className="flex items-center gap-3">
            {step === "form" && (
              <button className="btn-press-sm w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} onClick={() => setStep("type")}>
                <ChevronRight size={16} color="var(--fg)" style={{ transform: "rotate(180deg)" }} />
              </button>
            )}
            <h2 className="text-lg font-bold" style={{ color: "var(--fg)" }}>{step === "type" ? "카드 만들기" : `${selectedType === "master" ? "마스터카드" : selectedType === "regular" ? "일반카드" : "레시피카드"} 생성`}</h2>
          </div>
          <button className="btn-press-sm w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--surface-2)", border: "none" }} onClick={handleClose}>
            <X size={16} color="var(--fg)" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-80px)] px-6 pb-8">
          {step === "type" ? (
            <div className="flex flex-col gap-3">
              {TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button key={type.id} className="btn-press w-full rounded-2xl p-5 text-left flex items-start gap-4 cursor-pointer" onClick={() => handleTypeSelect(type.id)} style={{ background: type.bg, border: `1px solid ${type.border}` }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--surface-1)", border: `1px solid ${type.border}` }}>
                      <Icon size={22} style={{ color: type.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base" style={{ color: "var(--fg)" }}>{type.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--surface-1)", color: type.color, border: `1px solid ${type.border}` }}>{type.badge}</span>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{type.desc}</p>
                    </div>
                    <ChevronRight size={18} color="var(--text-faint)" className="shrink-0 mt-1" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div><label className={labelStyle} style={{ color: "var(--text-muted)" }}>카드 이름</label><input placeholder="카드 이름을 입력하세요" value={cardName} onChange={(e) => setCardName(e.target.value)} className={inputStyle} maxLength={30} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }} /></div>
              {(selectedType === "regular" || selectedType === "recipe") && (
                <div><label className={labelStyle} style={{ color: "var(--text-muted)" }}>소속 마스터카드</label>
                  {activeMasters.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <Info size={16} color="#EF4444" />
                      <p className="text-[13px] font-semibold" style={{ color: "#EF4444" }}>먼저 마스터카드를 만들어주세요.</p>
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {activeMasters.map((m) => {
                        const mPreset = getPreset(m.designPresetId);
                        const isSelected = masterId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className="btn-press shrink-0 rounded-xl overflow-hidden cursor-pointer relative"
                            style={{ width: 120, aspectRatio: "85.6/53.98", background: mPreset.gradient, border: isSelected ? "2px solid var(--gold)" : "1px solid rgba(255,255,255,0.15)", boxShadow: isSelected ? "var(--shadow-brand-ring)" : "0 4px 12px rgba(0,0,0,0.1)" }}
                            onClick={() => setMasterId(m.id)}
                          >
                            <div className={mPreset.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3, pointerEvents: "none" }} />
                            <div className="absolute inset-0 flex flex-col justify-between p-2">
                              <span className="text-[8px] font-bold tracking-wide self-end" style={{ color: "rgba(255,255,255,0.5)" }}>MASTER</span>
                              <span className="text-[11px] font-bold leading-tight" style={{ color: mPreset.textColor }}>{m.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {selectedType === "regular" && masterId && masterPresetsList.length > 0 && (
                <div>
                  <label className={labelStyle} style={{ color: "var(--text-muted)" }}>프리셋으로 빠른 생성</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {masterPresetsList.map((p) => {
                      const pPreset = getPreset(p.designPresetId);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className="btn-press shrink-0 rounded-xl overflow-hidden cursor-pointer relative"
                          style={{ width: 120, aspectRatio: "85.6/53.98", background: pPreset.gradient, border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                          onClick={() => {
                            const todayStr = new Date().toISOString().split("T")[0];
                            addRegularCard({ type: "regular", masterId, name: p.name, designPresetId: p.designPresetId, presetId: p.id, isScheduled: false, date: todayStr });
                            handleClose();
                          }}
                        >
                          <div className={pPreset.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3, pointerEvents: "none" }} />
                          <div className="absolute inset-0 flex flex-col justify-between p-2">
                            <span className="text-[8px] font-bold tracking-wide self-end" style={{ color: "rgba(255,255,255,0.5)" }}>PRESET</span>
                            <span className="text-[11px] font-bold leading-tight" style={{ color: pPreset.textColor }}>{p.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>탭하면 바로 홈에 추가됩니다</p>
                </div>
              )}
              {selectedType === "regular" && masterId && (
                <div>
                  {!showPresetAdd ? (
                    <button
                      type="button"
                      className="btn-press-sm text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      onClick={() => setShowPresetAdd(true)}
                    >
                      + 프리셋 추가
                    </button>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <input
                        placeholder="프리셋 이름"
                        value={presetAddName}
                        onChange={(e) => setPresetAddName(e.target.value)}
                        className="rounded-lg py-2 px-3 text-[13px] outline-none flex-1"
                        maxLength={20}
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }}
                      />
                      <button
                        type="button"
                        className="btn-press-sm text-[12px] font-bold px-3 py-2 rounded-lg cursor-pointer shrink-0"
                        style={{ background: presetAddName.trim() ? "var(--gradient-cta)" : "var(--surface-2)", color: presetAddName.trim() ? "#fff" : "var(--text-faint)", border: "none" }}
                        onClick={() => {
                          if (!presetAddName.trim()) return;
                          addPresetCard({ type: "preset", masterId, name: presetAddName.trim(), designPresetId: designId });
                          setPresetAddName("");
                          setShowPresetAdd(false);
                        }}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        className="btn-press-sm text-[12px] px-2 py-2 rounded-lg cursor-pointer shrink-0"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                        onClick={() => { setShowPresetAdd(false); setPresetAddName(""); }}
                      >
                        취소
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "85.6 / 53.98", background: preset.gradient, border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                <div className={preset.patternClass} style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
                <div className="absolute inset-0 flex flex-col justify-between p-5">
                  <div className="flex justify-between items-center">
                    <div className="w-9 h-7 rounded-md" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.08))", border: "1px solid rgba(255,255,255,0.15)" }} />
                    <div className="flex items-center gap-2">
                      {preset.limited && (
                        <span className="rounded-full text-[9px] font-bold px-2 py-0.5" style={{ background: "var(--gradient-badge)", color: "#0A0A0A" }}>{preset.limited}</span>
                      )}
                      <span className="text-xs font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {selectedType === "master" ? "MASTER" : selectedType === "regular" ? "CARD" : "RECIPE"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{new Date().toLocaleDateString("ko-KR")}</div>
                    <div className="text-base font-bold" style={{ color: preset.textColor }}>{cardName || "카드 이름"}</div>
                  </div>
                </div>
              </div>
              <div><label className={labelStyle} style={{ color: "var(--text-muted)" }}>카드 디자인</label><PresetSelector selected={designId} onSelect={setDesignId} /></div>
              {selectedType === "master" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>목표 설정</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>ON이면 기한을 설정할 수 있어요</p>
                    </div>
                    <button onClick={() => setHasGoal(!hasGoal)} className="bg-transparent border-none cursor-pointer">{hasGoal ? <ToggleRight size={32} style={{ color: "var(--gold)" }} /> : <ToggleLeft size={32} style={{ color: "var(--text-faint)" }} />}</button>
                  </div>
                  {hasGoal && (
                    <div className="flex flex-col gap-3">
                      <input placeholder="목표 내용" value={goalContent} onChange={(e) => setGoalContent(e.target.value)} className={inputStyle} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }} />
                      <input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} className={inputStyle} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)", colorScheme: "light" }} />
                    </div>
                  )}
                </div>
              )}
              {selectedType === "regular" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>예약카드로 등록</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>자동으로 반복 발급됩니다</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsScheduled((prev) => {
                          const next = !prev;
                          if (next && !scheduleDate) setScheduleDate(new Date().toISOString().split("T")[0]);
                          return next;
                        });
                      }}
                      className="bg-transparent border-none cursor-pointer"
                    >
                      {isScheduled ? <ToggleRight size={32} style={{ color: "var(--gold)" }} /> : <ToggleLeft size={32} style={{ color: "var(--text-faint)" }} />}
                    </button>
                  </div>
                  {isScheduled && (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2 flex-wrap">
                        {(["once", "daily", "weekly"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            className="btn-press flex-1 min-w-[88px] py-2 rounded-xl text-sm font-semibold cursor-pointer"
                            onClick={() => setScheduleMode(m)}
                            style={{
                              background: scheduleMode === m ? "rgba(var(--brand-rgb),0.15)" : "var(--surface-2)",
                              color: scheduleMode === m ? "var(--gold-dim)" : "var(--text-muted)",
                              border: scheduleMode === m ? "1px solid var(--gold)" : "1px solid var(--border)",
                            }}
                          >
                            {m === "once" ? "특정일 1회" : m === "daily" ? "매일" : "매주"}
                          </button>
                        ))}
                      </div>
                      {scheduleMode === "once" && (
                        <div>
                          <label className={labelStyle} style={{ color: "var(--text-muted)" }}>생성될 날짜</label>
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className={inputStyle}
                            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)", colorScheme: "light" }}
                          />
                        </div>
                      )}
                      {scheduleMode === "weekly" && (
                        <div className="flex gap-1.5 flex-wrap">
                          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                            <button
                              key={i}
                              type="button"
                              className="btn-press py-2 px-2.5 rounded-lg text-xs font-bold cursor-pointer"
                              onClick={() => setWeekdays(weekdays.includes(i) ? weekdays.filter((w) => w !== i) : [...weekdays, i])}
                              style={{
                                background: weekdays.includes(i) ? "rgba(var(--brand-rgb),0.15)" : "var(--surface-2)",
                                color: weekdays.includes(i) ? "var(--gold-dim)" : "var(--text-muted)",
                                border: weekdays.includes(i) ? "1px solid var(--gold)" : "1px solid var(--border)",
                              }}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      )}
                      <div>
                        <label className={labelStyle} style={{ color: "var(--text-muted)" }}>표시 시간</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className={inputStyle}
                          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)", colorScheme: "light" }}
                        />
                        <p className="text-[11px] mt-1.5" style={{ color: "var(--text-faint)" }}>이 시간이 지나면 오늘 할 일 목록에 나타나요.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {selectedType === "recipe" && (
                <div>
                  <label className={labelStyle} style={{ color: "var(--text-muted)" }}>내용</label>
                  <textarea placeholder="레시피, 참고자료, 아이디어를 자유롭게 입력하세요" value={recipeContent} onChange={(e) => setRecipeContent(e.target.value)} rows={4} className={`${inputStyle} resize-none`} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }} />
                </div>
              )}

              <button className="btn-press w-full py-4 rounded-2xl font-bold text-base mt-2 border-none cursor-pointer" disabled={!canSubmit} onClick={handleCreate} style={{ background: canSubmit ? "var(--gradient-cta)" : "var(--surface-2)", color: canSubmit ? "#FFFFFF" : "var(--text-faint)", boxShadow: canSubmit ? "var(--shadow-cta)" : "none" }}>카드 생성</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PROFILE MODAL
// ═══════════════════════════════════════════

function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, updateProfile, logout } = useApp();
  if (!open) return null;
  return <ProfileModalContent profile={profile} updateProfile={updateProfile} logout={logout} onClose={onClose} />;
}

function ProfileModalContent({
  profile,
  updateProfile,
  logout,
  onClose,
}: {
  profile: Profile;
  updateProfile: (p: Partial<Profile>) => void;
  logout: () => void | Promise<void>;
  onClose: () => void;
}) {
  const { isAdmin, applyCouponCode } = useApp();
  const [editing, setEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [couponInput, setCouponInput] = useState("");
  const [settingsMsg, setSettingsMsg] = useState("");
  const [settingsBusy, setSettingsBusy] = useState(false);

  const handleSave = () => { updateProfile(draft); setEditing(false); };
  const inputStyle = "rounded-xl py-2.5 px-3.5 w-full text-sm outline-none";

  return (
    <div className="animate-fadeIn fixed inset-0 z-[600] flex items-end overlay-bg-dark" onClick={onClose}>
      <div className="animate-slideUp w-full rounded-t-3xl p-6" style={{ background: "var(--surface-1)", borderTop: "1px solid var(--border)", boxShadow: "0 -8px 40px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1 rounded-full mx-auto mb-6" style={{ background: "var(--border)" }} />
        {showSettings ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button className="btn-press-sm w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} onClick={() => setShowSettings(false)}>
                <ChevronLeft size={16} color="var(--fg)" />
              </button>
              <h3 className="text-lg font-bold" style={{ color: "var(--fg)" }}>설정</h3>
            </div>
            <div className="flex flex-col gap-3">
              {isAdmin ? (
                <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
                  <Shield size={18} style={{ color: "#7C3AED" }} />
                  <span className="text-xs font-semibold" style={{ color: "#6D28D9" }}>관리자로 등록된 계정입니다. (어드민에서 이메일로 부여)</span>
                </div>
              ) : null}
              <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>쿠폰 코드</p>
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="코드를 입력하세요"
                    className="flex-1 rounded-lg py-2 px-3 text-sm outline-none"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--fg)" }}
                    disabled={settingsBusy}
                  />
                  <button
                    type="button"
                    className="btn-press px-4 rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50"
                    style={{ background: "var(--gradient-cta)", color: "#fff", border: "none" }}
                    disabled={settingsBusy}
                    onClick={async () => {
                      setSettingsMsg("");
                      setSettingsBusy(true);
                      const r = await applyCouponCode(couponInput);
                      setSettingsBusy(false);
                      setSettingsMsg(r.message);
                      if (r.ok) setCouponInput("");
                    }}
                  >
                    적용
                  </button>
                </div>
              </div>
              {settingsMsg ? <p className="text-xs px-1" style={{ color: settingsMsg.includes("없") || settingsMsg.includes("유효") || settingsMsg.includes("만료") || settingsMsg.includes("소진") ? "#EF4444" : "var(--gold-dim)" }}>{settingsMsg}</p> : null}
              <button className="btn-press w-full py-4 rounded-xl flex items-center gap-3 px-4 cursor-pointer" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }} onClick={() => { void Promise.resolve(logout()).then(() => onClose()); }}>
                <LogOut size={20} style={{ color: "var(--text-muted)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>로그아웃</span>
              </button>
              <button className="btn-press w-full py-4 rounded-xl flex items-center gap-3 px-4 cursor-pointer" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }} onClick={() => { if (confirm("정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) { localStorage.clear(); void Promise.resolve(logout()).then(() => onClose()); } }}>
                <UserX size={20} style={{ color: "#EF4444" }} />
                <span className="text-sm font-semibold" style={{ color: "#EF4444" }}>회원탈퇴</span>
              </button>
            </div>
          </>
        ) : !editing ? (
          <>
            <div className="relative rounded-2xl p-6 mb-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #FFFFFF, #F5F5F0)", border: "1px solid var(--border)", boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
              {/* Settings button - top left */}
              <button className="btn-press-sm absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer z-10" style={{ background: "rgba(0,0,0,0.05)", border: "none" }} onClick={() => setShowSettings(true)}>
                <Settings size={13} style={{ color: "var(--text-faint)" }} />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0" style={{ background: "var(--gradient-cta)", color: "#FFFFFF", boxShadow: "var(--shadow-cta-sm)" }}>{profile.name?.[0] ?? "N"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold" style={{ color: "var(--fg)" }}>{profile.name}</h2>
                    {isAdmin ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0" style={{ color: "#6D28D9", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.28)" }}>관리자</span>
                    ) : null}
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: "var(--gold-dim)" }}>{profile.job}</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{profile.age}</p>
                </div>
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold mb-1 tracking-wide" style={{ color: "var(--text-faint)" }}>VISION</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{profile.vision}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-press flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer" onClick={() => { setDraft(profile); setEditing(true); }} style={{ background: "rgba(var(--brand-rgb),0.1)", color: "var(--gold-dim)", border: "1px solid rgba(var(--brand-rgb),0.2)" }}><Edit3 size={16} /> 수정하기</button>
              <button className="btn-press flex-1 py-3 rounded-xl font-semibold text-sm cursor-pointer" onClick={onClose} style={{ background: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border)" }}>닫기</button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold mb-5" style={{ color: "var(--fg)" }}>프로필 수정</h3>
            <div className="flex flex-col gap-4 mb-6">
              {[{ key: "name" as const, label: "이름", ph: "이름을 입력하세요" }, { key: "job" as const, label: "직업", ph: "직업을 입력하세요" }, { key: "age" as const, label: "나이", ph: "나이를 입력하세요" }, { key: "vision" as const, label: "비전", ph: "나의 비전을 입력하세요" }].map((f) => (
                <div key={f.key}><label className="text-xs font-semibold mb-2 block tracking-wide" style={{ color: "var(--text-muted)" }}>{f.label}</label><input placeholder={f.ph} value={draft[f.key] || ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} className={inputStyle} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--fg)" }} /></div>
              ))}
            </div>
            <div className="flex gap-3">
              <button className="btn-press flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold border-none cursor-pointer" onClick={handleSave} style={{ background: "var(--gradient-cta)", color: "#FFFFFF" }}><Check size={16} /> 저장</button>
              <button className="btn-press flex-1 py-3 rounded-xl font-semibold cursor-pointer" onClick={() => setEditing(false)} style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>취소</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════

function PendingUndoBar({
  pendingUndo,
  onUndo,
}: {
  pendingUndo: { id: string; until: number } | null;
  onUndo: () => void;
}) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!pendingUndo) return;
    const update = () => {
      setSec(Math.max(0, Math.ceil((pendingUndo.until - Date.now()) / 1000)));
    };
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [pendingUndo]);
  if (!pendingUndo) return null;
  if (sec <= 0) return null;
  return (
    <div className="shrink-0 flex justify-center px-4 pb-2 z-30">
      <button
        type="button"
        className="btn-press flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold shadow-lg"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
        onClick={onUndo}
      >
        <RotateCcw size={18} strokeWidth={2.5} />
        실행 취소 · 홈으로 되돌리기 ({sec}초)
      </button>
    </div>
  );
}

function AppShell() {
  const { activeTab, setActiveTab, profile, regularCards, isAdmin, tick, pendingUndo, undoPendingRegularCompletion } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const todayActiveCount = useMemo(() => {
    void tick;
    return regularCards.filter((c) => regularVisibleToday(c, new Date())).length;
  }, [regularCards, tick]);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <header className="shrink-0 flex items-center justify-between px-5 pt-12 pb-3 z-20">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: "var(--fg)", fontFamily: "var(--font-poppins), ui-sans-serif, system-ui, sans-serif" }}>TodoWallet</h1>
          <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            {activeTab === "home" ? ` · 오늘 ${todayActiveCount}개의 카드` : " · 보관함"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin ? (
            <span
              className="text-[10px] font-bold tracking-wide px-2 py-1 rounded-lg whitespace-nowrap"
              style={{ color: "#6D28D9", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.28)" }}
            >
              관리자
            </span>
          ) : null}
          <button className="btn-press-sm relative w-11 h-11 rounded-full flex items-center justify-center text-base font-bold border-none cursor-pointer" onClick={() => setProfileOpen(true)} style={{ background: "var(--gradient-cta)", color: "#FFFFFF", boxShadow: "var(--shadow-cta-sm)" }}>
            {profile.name?.[0] ?? "N"}
            {isAdmin ? (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white" style={{ background: "#7C3AED" }}>
                <Shield size={9} color="#fff" strokeWidth={2.5} />
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === "home" && <HomeScreen />}
        {activeTab === "vault" && <VaultScreen />}
      </main>

      <PendingUndoBar
        pendingUndo={pendingUndo}
        onUndo={() => {
          undoPendingRegularCompletion();
          setActiveTab("home");
        }}
      />

      <nav className="shrink-0 flex items-center justify-around px-2 pt-3 pb-8 z-20" style={{ background: "linear-gradient(to top, var(--bg) 55%, transparent)" }}>
        {/* Home button - large hit area */}
        <button 
          className="btn-press-sm flex flex-col items-center justify-center gap-1 bg-transparent border-none cursor-pointer relative px-8 py-3 -my-3" 
          onClick={() => setActiveTab("home")}
          style={{ minWidth: 80, minHeight: 60 }}
        >
          <div className="relative">
            <Home size={22} style={{ color: activeTab === "home" ? "var(--fg)" : "var(--text-faint)" }} strokeWidth={activeTab === "home" ? 2.5 : 2} />
            {todayActiveCount > 0 && activeTab !== "home" && (
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center" style={{ background: "#EF4444" }}>
                <span className="text-[8px] font-bold text-white">{todayActiveCount}</span>
              </div>
            )}
          </div>
          <span className="text-xs font-semibold" style={{ color: activeTab === "home" ? "var(--fg)" : "var(--text-faint)" }}>홈</span>
          {activeTab === "home" && <div className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: "var(--fg)" }} />}
        </button>

        {/* Plus button */}
        <button className="btn-press-sm w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer" onClick={() => setCreateOpen(true)} style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-nav-fab)", transition: "transform 0.2s", transform: createOpen ? "rotate(45deg)" : "rotate(0deg)" }}>
          <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
        </button>

        {/* Vault button - large hit area */}
        <button 
          className="btn-press-sm flex flex-col items-center justify-center gap-1 bg-transparent border-none cursor-pointer relative px-8 py-3 -my-3" 
          onClick={() => setActiveTab("vault")}
          style={{ minWidth: 80, minHeight: 60 }}
        >
          <Archive size={22} style={{ color: activeTab === "vault" ? "var(--fg)" : "var(--text-faint)" }} strokeWidth={activeTab === "vault" ? 2.5 : 2} />
          <span className="text-xs font-semibold" style={{ color: activeTab === "vault" ? "var(--fg)" : "var(--text-faint)" }}>보관함</span>
          {activeTab === "vault" && <div className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: "var(--fg)" }} />}
        </button>
      </nav>

      <CreateCardSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

// ═══════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════

function AppInner() {
  const { isLoggedIn, authReady } = useApp();
  if (!authReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "var(--bg)" }}>
        <Loader2 className="animate-spin" size={28} style={{ color: "var(--text-muted)" }} />
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>연결 중…</span>
      </div>
    );
  }
  return isLoggedIn ? <AppShell /> : <LoginScreen />;
}

export default function App() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Defer rendering until after hydration so server HTML matches first paint (localStorage only on client).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional hydration gate for AppProvider
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
