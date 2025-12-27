'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import { useMemo } from 'react';
import { permissions } from '@/lib/permissions';

export default function TechniciansPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Check if user has access to technicians page
  if (!user || !permissions.canAccessTechnicians(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-neutral-100 mb-2">Access Denied</h1>
          <p className="text-neutral-400">You don't have permission to access technicians. Only technicians, managers, and administrators can access this page.</p>
        </div>
      </div>
    );
  }

  // Fetch data from API
  const { data: techniciansData, isLoading: techniciansLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => apiClient.getTechnicians(),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['maintenance-teams'],
    queryFn: () => apiClient.getMaintenanceTeams(),
  });

  const technicians = techniciansData || [];
  const users = usersData || [];
  const teams = teamsData || [];

  const isLoading = techniciansLoading || usersLoading || teamsLoading;

  // Create lookup maps for efficient access
  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    users.forEach((u: any) => map.set(u.id, u));
    return map;
  }, [users]);

  const teamMap = useMemo(() => {
    const map = new Map<string, any>();
    teams.forEach((t: any) => map.set(t.id, t));
    return map;
  }, [teams]);

  // Get technician user details
  const getTechnicianUser = (userId: string) => {
    return userMap.get(userId);
  };

  // Get team name
  const getTeamName = (teamId: string) => {
    const team = teamMap.get(teamId);
    return team?.name || 'N/A';
  };

  // Get team specialization
  const getTeamSpecialization = (teamId: string) => {
    const team = teamMap.get(teamId);
    return team?.specialization || 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-100">Technicians</h1>
          <p className="text-neutral-400 text-sm mt-2">
            View and manage technician assignments
          </p>
        </div>
        {user && permissions.canManageTeams(user.role) && (
          <button 
            onClick={() => router.push('/dashboard/technicians/new')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
          >
            + New Technician
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/60 rounded-xl p-4 shadow-lg shadow-black/10">
        <div className="relative">
          <input
            type="text"
            placeholder="Search technicians..."
            className="w-full px-4 py-2.5 pl-10 bg-neutral-950/80 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Technicians Table */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/60 rounded-xl overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-900/50 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Technician Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </td>
                </tr>
              ) : technicians.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-400 text-sm">
                    No technicians found
                  </td>
                </tr>
              ) : (
                technicians.map((tech: any) => {
                  const techUser = getTechnicianUser(tech.user_id);
                  const teamName = getTeamName(tech.team_id);
                  const specialization = getTeamSpecialization(tech.team_id);

                  return (
                    <tr
                      key={tech.id}
                      className="hover:bg-neutral-800/30 transition-all duration-200 cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-600/30 flex items-center justify-center text-neutral-100 text-sm font-semibold">
                            {techUser?.name?.charAt(0)?.toUpperCase() || 'T'}
                          </div>
                          <span className="text-sm font-semibold text-neutral-100 group-hover:text-blue-400 transition-colors">
                            {techUser?.name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-300">
                          {techUser?.email || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-100 font-medium">{getTeamName(tech.team_id)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-neutral-300">{getTeamSpecialization(tech.team_id)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tech.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-green-950/30 text-green-300 border border-green-800/60">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-red-950/30 text-red-300 border border-red-800/60">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/80 border border-neutral-800/60 rounded-xl p-5 backdrop-blur-sm shadow-xl shadow-black/20 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Total Technicians</p>
              <p className="text-3xl font-bold text-neutral-100 mt-2">
                {technicians.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-neutral-800/50 flex items-center justify-center border border-neutral-700/50">
              <svg className="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-950/40 to-green-950/20 border border-green-800/60 rounded-xl p-5 backdrop-blur-sm shadow-xl shadow-green-950/20 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Active</p>
              <p className="text-3xl font-bold text-green-400 mt-2">
                {technicians.filter((t: any) => t.is_active).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-950/30 flex items-center justify-center border border-green-800/50">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-950/40 to-red-950/20 border border-red-800/60 rounded-xl p-5 backdrop-blur-sm shadow-xl shadow-red-950/20 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Inactive</p>
              <p className="text-3xl font-bold text-red-400 mt-2">
                {technicians.filter((t: any) => !t.is_active).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-950/30 flex items-center justify-center border border-red-800/50">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
