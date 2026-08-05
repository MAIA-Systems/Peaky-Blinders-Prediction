import { request } from "./client";

export interface AdminUserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "standard" | "admin";
  createdAt: string;
  balanceCents: number | null;
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const { users } = await request<{ users: AdminUserRow[] }>("/admin/users");
  return users;
}
