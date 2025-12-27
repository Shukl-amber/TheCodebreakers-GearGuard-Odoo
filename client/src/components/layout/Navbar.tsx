'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { permissions } from '@/lib/permissions';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', show: permissions.canAccessDashboard(user.role) },
    { href: '/dashboard/equipment', label: 'Equipment', show: permissions.canAccessEquipment(user.role) },
    { href: '/dashboard/requests/kanban', label: 'Requests', show: permissions.canAccessRequests(user.role) },
    { href: '/dashboard/requests/calendar', label: 'Calendar', show: permissions.canSchedulePreventive(user.role) },
    { href: '/dashboard/teams', label: 'Teams', show: permissions.canAccessTeams(user.role) },
    { href: '/dashboard/technicians', label: 'Technicians', show: permissions.canAccessTechnicians(user.role) },
  ].filter(item => item.show);

  const getRoleVariant = (role: string): 'primary' | 'secondary' | 'success' | 'warning' | 'neutral' => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'technician':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <nav className="bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800/50 sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center transition-opacity hover:opacity-80">
                <Image src="/logo.png" alt="GearGuard" width={100} height={100} className="w-36" />
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navItems.map((item) => {
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30 shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60 hover:border-neutral-700/50 border border-transparent'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-neutral-300 font-medium">{user.name}</span>
            </div>
            <Badge variant={getRoleVariant(user.role)} size="sm">
              {user.role}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="hover:bg-red-950/30 hover:text-red-300 hover:border-red-800/50"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

