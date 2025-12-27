import Link from 'next/link';
import { format } from 'date-fns';
import {
  getUsers,
  getEquipment,
  getMaintenanceRequests,
  getTechnicians,
  resolveTechnicianName,
  type MaintenanceRequest,
} from '@/lib/dummyData';
import StatusBadge from '@/components/dashboard/StatusBadge';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivityTable from '@/components/dashboard/RecentActivityTable';

// Server Component: loads dummy data and renders the operational overview
export default async function DashboardPage() {
  // Simulate API calls by reading JSON files (server-side)
  const [users, equipment, requests, technicians] = await Promise.all([
    getUsers(),
    getEquipment(),
    getMaintenanceRequests(),
    getTechnicians(),
  ]);

  // KPIs
  const totalActiveEquipment = equipment.filter((e) => e.status === 'active').length;
  const openRequests = requests.filter((r) => r.stage === 'new' || r.stage === 'in_progress').length;
  const overdueRequests = requests.filter((r) => r.overdue).length;
  const preventiveScheduled = requests.filter((r) => r.request_type === 'preventive').length;

  // Recent activity (latest 5)
  const recent: (MaintenanceRequest & {
    equipment_name: string;
    technician_name: string;
  })[] = [...requests]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((r) => ({
      ...r,
      equipment_name: equipment.find((e) => e.id === r.equipment_id)?.name ?? 'Unknown Equipment',
      technician_name: resolveTechnicianName(r.assigned_to ?? null, technicians, users),
    }));

  // Overdue highlight (up to 3)
  const overdueTop = requests
    .filter((r) => r.overdue)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      subject: r.subject,
      equipment: equipment.find((e) => e.id === r.equipment_id)?.name ?? 'Unknown Equipment',
      technician: resolveTechnicianName(r.assigned_to ?? null, technicians, users),
    }));

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-100">Dashboard</h1>
          <p className="text-sm text-neutral-400 mt-2">Operational overview of maintenance activities</p>
        </div>
        <Link
          href="/dashboard/requests/new"
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
        >
          + New Request
        </Link>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Equipment" value={totalActiveEquipment} tone="neutral" icon="📦" />
        <StatCard label="Open Maintenance Requests" value={openRequests} tone="warning" icon="🔧" />
        <StatCard label="Overdue Requests" value={overdueRequests} tone="error" icon="⚠️" />
        <StatCard label="Preventive Scheduled" value={preventiveScheduled} tone="primary" icon="📅" />
      </section>

      {/* Recent Maintenance Activity */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-100">Recent Maintenance Activity</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm shadow-xl shadow-black/20">
          {recent.length === 0 ? (
            <div className="p-8 text-center text-neutral-400">
              <p>No recent activity.</p>
            </div>
          ) : (
            <RecentActivityTable requests={recent} />
          )}
        </div>
      </section>

      {/* Overdue Highlight */}
      {overdueTop.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-100">Overdue Alerts</h2>
          <div className="rounded-xl border border-red-800/60 bg-gradient-to-br from-red-950/40 to-red-950/20 backdrop-blur-sm shadow-xl shadow-red-950/20">
            <ul className="divide-y divide-red-900/30">
              {overdueTop.map((o) => (
                <li key={o.id} className="p-5 hover:bg-red-950/20 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-red-200 mb-1">{o.subject}</p>
                      <p className="text-sm text-red-300/70">
                        {o.equipment} • {o.technician}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/requests/${o.id}/edit`}
                      className="text-sm px-4 py-2 rounded-lg bg-red-900/50 text-red-100 border border-red-800/60 hover:bg-red-900/70 hover:border-red-700/60 transition-all duration-200 font-medium shadow-sm"
                    >
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Role-aware Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-100">Quick Actions</h2>
        <QuickActions users={users} />
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'warning' | 'error' | 'primary';
  icon?: string;
}) {
  const tones: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
    neutral: { 
      bg: 'bg-gradient-to-br from-neutral-900 to-neutral-900/80', 
      border: 'border-neutral-800/60', 
      text: 'text-neutral-200',
      shadow: 'shadow-neutral-950/20'
    },
    warning: { 
      bg: 'bg-gradient-to-br from-amber-950/40 to-amber-950/20', 
      border: 'border-amber-800/60', 
      text: 'text-amber-200',
      shadow: 'shadow-amber-950/20'
    },
    error: { 
      bg: 'bg-gradient-to-br from-red-950/40 to-red-950/20', 
      border: 'border-red-800/60', 
      text: 'text-red-200',
      shadow: 'shadow-red-950/20'
    },
    primary: { 
      bg: 'bg-gradient-to-br from-blue-950/40 to-blue-950/20', 
      border: 'border-blue-800/60', 
      text: 'text-blue-200',
      shadow: 'shadow-blue-950/20'
    },
  };
  const t = tones[tone];
  return (
    <div className={`rounded-xl border ${t.border} ${t.bg} p-5 backdrop-blur-sm shadow-xl ${t.shadow} hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}> 
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm font-medium text-neutral-400">{label}</div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className={`text-4xl font-bold ${t.text}`}>{value}</div>
    </div>
  );
}

