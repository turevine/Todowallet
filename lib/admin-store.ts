import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

export type AdminCoupon = {
  id: string;
  code: string;
  label: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

export type AdminPrivilegeCode = {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  note?: string;
};

export type AdminStore = {
  coupons: AdminCoupon[];
  /** @deprecated 권한 코드 방식 — appAdminEmails 사용 */
  privilegeCodes: AdminPrivilegeCode[];
  /** 소문자 정규화된 이메일. 메인 앱 로그인 사용자가 여기 있으면 관리자 표시 */
  appAdminEmails: string[];
};

const defaultStore: AdminStore = { coupons: [], privilegeCodes: [], appAdminEmails: [] };

function storePath() {
  return join(process.cwd(), "data", "admin-store.json");
}

export async function loadAdminStore(): Promise<AdminStore> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as AdminStore;
    return {
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
      privilegeCodes: Array.isArray(parsed.privilegeCodes) ? parsed.privilegeCodes : [],
      appAdminEmails: Array.isArray((parsed as AdminStore).appAdminEmails)
        ? (parsed as AdminStore).appAdminEmails.map((e) => String(e).trim().toLowerCase()).filter(Boolean)
        : [],
    };
  } catch {
    return structuredClone(defaultStore);
  }
}

export async function saveAdminStore(store: AdminStore): Promise<void> {
  await mkdir(join(process.cwd(), "data"), { recursive: true });
  await writeFile(storePath(), JSON.stringify(store, null, 2), "utf8");
}

export function newId() {
  return randomBytes(12).toString("hex");
}

export function generatePrivilegeCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const size = Math.max(4, Math.min(32, Math.floor(length)));
  let out = "";
  for (let i = 0; i < size; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
