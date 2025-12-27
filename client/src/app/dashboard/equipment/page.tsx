'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Equipment } from '@/types/equipment';
import EquipmentModal from '@/components/equipment/EquipmentModal';

export default function EquipmentPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => apiClient.getEquipment(),
  });

  const { data: departmentsData, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
  });

  const { data: techniciansData, isLoading: techniciansLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => apiClient.getTechnicians(),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });

  const equipment: any[] = equipmentData || [];
  const departments = departmentsData || [];
  const technicians = techniciansData || [];
  const users = usersData || [];

  const isLoading = equipmentLoading || departmentsLoading || techniciansLoading || usersLoading;

  // Create a map of technician ID to user name for quick lookup
  const technicianToUserMap = useMemo(() => {
    const map = new Map<string, string>();
    technicians.forEach((tech: any) => {
      const user = users.find((u: any) => u.id === tech.user_id);
      if (user) {
        map.set(tech.id, user.name);
      }
    });
    return map;
  }, [technicians, users]);

  // Get department name
  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'N/A';
    const dept = departments.find((d: any) => d.id === departmentId);
    return dept?.name || 'N/A';
  };

  // Get team technician name from API data
  const getTeamTechnician = (maintenanceTeamId?: string) => {
    if (!maintenanceTeamId) return 'Unassigned';
    
    // Find technicians for this team
    const teamTechnicians = technicians.filter(
      (t: any) => t.team_id === maintenanceTeamId && t.is_active === true
    );
    
    if (teamTechnicians.length === 0) {
      return 'Unassigned';
    }
    
    // Get the first technician's user info
    const firstTech = teamTechnicians[0];
    return technicianToUserMap.get(firstTech.id) || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-100">Equipment</h1>
          <p className="text-neutral-400 text-sm mt-2">
            Manage all equipment and maintenance
          </p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/equipment/new')}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
        >
          + New Equipment
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/60 rounded-xl p-4 shadow-lg shadow-black/10">
        <div className="relative">
          <input
            type="text"
            placeholder="Search equipment..."
            className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg px-4 py-2.5 pl-10 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500"
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

      {/* Equipment Table */}
      <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/60 rounded-xl overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-900/50 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Equipment Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Equipment Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </td>
                </tr>
              ) : equipment.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                    No equipment found
                  </td>
                </tr>
              ) : (
                equipment.map((item: any) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-800/30 transition-all duration-200 cursor-pointer group"
                      onClick={() => setSelectedEquipmentId(item.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-neutral-100 group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300">
                          {item.assigned_employee || 'Unassigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300">
                          {getDepartmentName(item.department_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300 font-mono">
                          {item.serial_number || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300">
                          {getTeamTechnician(item.maintenance_team_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300">
                          {item.category || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-300">{item.location || 'N/A'}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment Modal */}
      {selectedEquipmentId && (
        <EquipmentModal
          equipmentId={selectedEquipmentId}
          onClose={() => setSelectedEquipmentId(null)}
        />
      )}
    </div>
  );
}
