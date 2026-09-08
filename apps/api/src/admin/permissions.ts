export const ADMIN_PERMISSIONS = [
  "catalog:read",
  "catalog:manage",
  "inventory:read",
  "inventory:manage",
  "orders:read",
  "orders:operate",
  "payments:confirm_transfer",
  "orders:cancel_refund",
  "discounts:read",
  "discounts:manage",
  "delivery:read",
  "delivery:manage",
  "delivery:configure",
  "audit:read",
  "collaborators:manage"
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const impliedPermissions: Partial<Record<AdminPermission, readonly AdminPermission[]>> = {
  "catalog:manage": ["catalog:read"],
  "inventory:manage": ["inventory:read"],
  "orders:operate": ["orders:read"],
  "discounts:manage": ["discounts:read"],
  "delivery:manage": ["delivery:read"],
  "delivery:configure": ["delivery:read"]
};

const permissionSet = new Set<string>(ADMIN_PERMISSIONS);

export function isAdminPermission(value: string): value is AdminPermission {
  return permissionSet.has(value);
}

export function normalizePermissions(values: readonly string[]): AdminPermission[] {
  const normalized = new Set<AdminPermission>();

  for (const value of values) {
    if (!isAdminPermission(value)) {
      throw new Error("Unknown administrative permission");
    }

    normalized.add(value);
    for (const implied of impliedPermissions[value] ?? []) normalized.add(implied);
  }

  return ADMIN_PERMISSIONS.filter((permission) => normalized.has(permission));
}

export function hasPermission(
  role: "owner" | "collaborator",
  permissions: readonly string[],
  required: AdminPermission
): boolean {
  return role === "owner" || normalizePermissions(permissions).includes(required);
}
