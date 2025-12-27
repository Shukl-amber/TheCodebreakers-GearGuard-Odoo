"use client";

import Link from 'next/link';
import { User, UserRole } from '@/lib/dummyData';
import { Button } from '@/components/ui/Button';

type Props = {
  users: User[]; // server-provided list to validate any local user
};

// Resolve current user role from localStorage if present; fallback to minimal defaults
function getCurrentRole(users: User[]): UserRole | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<User>;
    const full = parsed?.id ? users.find((u) => u.id === parsed.id) : null;
    return (full?.role as UserRole) ?? null;
  } catch {
    return null;
  }
}

export default function QuickActions({ users }: Props) {
  const role = getCurrentRole(users);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {role === 'admin' || role === 'manager' ? (
        <>
          <Link href="/dashboard/requests/calendar">
            <Button variant="secondary" className="w-full h-12 text-base font-semibold hover:bg-neutral-800/80 hover:border-neutral-700 transition-all duration-200 shadow-md hover:shadow-lg">
              Schedule Preventive Maintenance
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="secondary" className="w-full h-12 text-base font-semibold hover:bg-neutral-800/80 hover:border-neutral-700 transition-all duration-200 shadow-md hover:shadow-lg">
              View Reports
            </Button>
          </Link>
        </>
      ) : role === 'technician' ? (
        <>
          <Link href="/dashboard/requests/kanban">
            <Button variant="secondary" className="w-full h-12 text-base font-semibold hover:bg-neutral-800/80 hover:border-neutral-700 transition-all duration-200 shadow-md hover:shadow-lg">
              View Assigned Requests
            </Button>
          </Link>
        </>
      ) : (
        <>
          <Link href="/dashboard/requests/new">
            <Button variant="secondary" className="w-full h-12 text-base font-semibold hover:bg-neutral-800/80 hover:border-neutral-700 transition-all duration-200 shadow-md hover:shadow-lg">
              Create Maintenance Request
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
