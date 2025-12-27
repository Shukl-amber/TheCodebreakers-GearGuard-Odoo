'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { permissions } from '@/lib/permissions';

export default function TeamsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Check if user has access to teams page
  if (!user || !permissions.canAccessTeams(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-neutral-100 mb-2">Access Denied</h1>
          <p className="text-neutral-400">You don't have permission to access teams. Only technicians, managers, and administrators can access this page.</p>
        </div>
      </div>
    );
  }

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => apiClient.getMaintenanceTeams(),
  });

  const { data: techniciansData, isLoading: techniciansLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => apiClient.getTechnicians(),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });

  const teams = teamsData || [];
  const technicians = techniciansData || [];
  const users = usersData || [];

  const isLoading = teamsLoading || techniciansLoading || usersLoading;

  // Get team members for a specific team
  const getTeamMembers = (teamId: string) => {
    const teamTechnicians = technicians.filter((t: any) => t.team_id === teamId && t.is_active);
    return teamTechnicians
      .map((tech: any) => {
        const techUser = users.find((u: any) => u.id === tech.user_id);
        return techUser?.name || 'Unknown';
      })
      .join(', ') || 'No members';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-100">Teams</h1>
          <p className="text-neutral-400 text-sm mt-2">
            Manage maintenance teams and members
          </p>
        </div>
        {user && permissions.canManageTeams(user.role) && (
          <button 
            onClick={() => router.push('/dashboard/teams/new')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
          >
            + New Team
          </button>
        )}
      </div>

      {/* Teams Table */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/60 rounded-xl overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-900/50 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Team Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Team Members
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Specialization
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-neutral-400">
                    No teams found
                  </td>
                </tr>
              ) : (
                teams.map((team: any) => (
                  <tr
                    key={team.id}
                    className="hover:bg-neutral-800/30 transition-all duration-200 cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-neutral-100 group-hover:text-blue-400 transition-colors">
                        {team.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-300">
                        {getTeamMembers(team.id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-300">{team.specialization}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
