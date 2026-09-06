"use client";

import * as React from "react";
import { toast } from "sonner";
import { KeyRound, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { ApiError } from "@/lib/api-client";
import type { AppUser, UserRole } from "@/types";

const ROLE_LABEL: Record<UserRole, string> = {
  pgr_mo: "PGR/MO",
  sr_faculty: "SR/Faculty",
  admin: "Admin",
};
const ROLE_BADGE: Record<UserRole, React.ComponentProps<typeof Badge>["variant"]> = {
  pgr_mo: "neutral",
  sr_faculty: "warning",
  admin: "info",
};

/**
 * Admin-only. This is the actual account-management surface the login system
 * needs (create/deactivate/reset-password) — server-side enforced via
 * /api/users (admin-only) independent of this page's own gate, so this gate
 * is a UX convenience, not the security boundary.
 */
export default function UsersPage() {
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const users = useAppStore((s) => s.users);
  const updateUser = useAppStore((s) => s.updateUser);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [resetTarget, setResetTarget] = React.useState<AppUser | null>(null);

  const isAdmin = currentUser.role === "admin";

  async function toggleActive(u: AppUser) {
    try {
      await updateUser(u.id, { active: !u.active });
      toast.success(u.active ? `${u.name} deactivated` : `${u.name} reactivated`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update user");
    }
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-[720px] p-6">
        <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning/10 px-3 py-2.5 text-[13px] text-warning">
          Only Administrators can manage user accounts.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[820px] p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-[20px] font-semibold text-foreground">Users</h1>
          <p className="text-[13px] text-foreground-muted">
            Accounts never get hard-deleted — deactivate instead. A deactivated user is signed out
            on their very next request.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4" /> New User
        </Button>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium text-foreground">{u.name}</span>
                  <Badge variant={ROLE_BADGE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  {!u.active && <Badge variant="danger">Deactivated</Badge>}
                </div>
                <div className="text-[12px] text-foreground-subtle">
                  @{u.username} · {u.designation}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setResetTarget(u)}>
                <KeyRound className="size-3.5" /> Reset password
              </Button>
              <Button
                variant={u.active ? "outline" : "secondary"}
                size="sm"
                disabled={u.id === currentUser.id}
                onClick={() => toggleActive(u)}
              >
                {u.active ? "Deactivate" : "Reactivate"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ResetPasswordDialog user={resetTarget} onOpenChange={(open) => !open && setResetTarget(null)} />
    </div>
  );
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createUser = useAppStore((s) => s.createUser);
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [designation, setDesignation] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("pgr_mo");
  const [saving, setSaving] = React.useState(false);

  const canSave = name.trim() && username.trim() && password.length >= 8 && designation.trim();

  function reset() {
    setName("");
    setUsername("");
    setPassword("");
    setDesignation("");
    setRole("pgr_mo");
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      await createUser({
        name: name.trim(),
        username: username.trim(),
        password,
        designation: designation.trim(),
        role,
      });
      toast.success(`${name.trim()} can now sign in`);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't create user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New User</DialogTitle>
          <DialogDescription>Give them these credentials directly — there&apos;s no self-signup.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label required htmlFor="new-user-name">Full name</Label>
            <Input id="new-user-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Ayesha Khan" />
          </div>
          <div>
            <Label required htmlFor="new-user-designation">Designation</Label>
            <Input id="new-user-designation" className="mt-1.5" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. MO, Pediatrics" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required htmlFor="new-user-username">Username</Label>
              <Input id="new-user-username" className="mt-1.5" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <Label htmlFor="new-user-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger id="new-user-role" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pgr_mo">PGR/MO</SelectItem>
                  <SelectItem value="sr_faculty">SR/Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label required htmlFor="new-user-password">Temporary password</Label>
            <Input
              id="new-user-password"
              className="mt-1.5"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button disabled={!canSave || saving} onClick={handleSave}>
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onOpenChange }: { user: AppUser | null; onOpenChange: (open: boolean) => void }) {
  const updateUser = useAppStore((s) => s.updateUser);
  const [password, setPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  // Adjust state during render (React-recommended) instead of an effect, so
  // switching targets clears the field in the same pass rather than
  // flashing the previous user's typed password for one frame.
  const [prevUser, setPrevUser] = React.useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setPassword("");
  }

  async function handleSave() {
    if (!user || password.length < 8) return;
    setSaving(true);
    try {
      await updateUser(user.id, { password });
      toast.success(`Password reset for ${user.name}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't reset password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>{user && <>For {user.name} (@{user.username})</>}</DialogDescription>
        </DialogHeader>
        <div>
          <Label required htmlFor="reset-user-password">New password</Label>
          <Input
            id="reset-user-password"
            className="mt-1.5"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button disabled={password.length < 8 || saving} onClick={handleSave}>
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
