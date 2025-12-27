'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/common/Loading';

interface EquipmentModalProps {
  equipmentId: string;
  onClose: () => void;
}

export default function EquipmentModal({ equipmentId, onClose }: EquipmentModalProps) {
  const router = useRouter();
  
  // Fetch equipment data
  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => apiClient.getEquipmentById(equipmentId),
    enabled: !!equipmentId,
  });

  // Fetch related data
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
  });

  const { data: teams } = useQuery({
    queryKey: ['maintenance-teams'],
    queryFn: () => apiClient.getMaintenanceTeams(),
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => apiClient.getTechnicians(),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });

  // Create lookup maps
  const departmentMap = useMemo(() => {
    const map = new Map<string, any>();
    (departments || []).forEach((d: any) => map.set(d.id, d));
    return map;
  }, [departments]);

  const teamMap = useMemo(() => {
    const map = new Map<string, any>();
    (teams || []).forEach((t: any) => map.set(t.id, t));
    return map;
  }, [teams]);

  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    (users || []).forEach((u: any) => map.set(u.id, u));
    return map;
  }, [users]);

  // Get related data
  const department = equipment ? departmentMap.get(equipment.department_id) : null;
  const team = equipment ? teamMap.get(equipment.maintenance_team_id) : null;
  
  // Get technician for this team
  const technician = useMemo(() => {
    if (!equipment || !technicians || !users) return null;
    const teamTechnicians = technicians.filter((t: any) => 
      t.team_id === equipment.maintenance_team_id && t.is_active === true
    );
    if (teamTechnicians.length === 0) return null;
    const firstTech = teamTechnicians[0];
    return userMap.get(firstTech.user_id) || null;
  }, [equipment, technicians, users, userMap]);

  const handleEdit = () => {
    router.push(`/dashboard/equipment/${equipmentId}/edit`);
    onClose();
  };

  const getStatusVariant = (status: string): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'neutral' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'scrapped':
        return 'error';
      default:
        return 'neutral';
    }
  };

  if (equipmentLoading || !equipment) {
    return (
      <Modal isOpen={true} onClose={onClose} size="lg">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={equipment.name}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleEdit}>
            Edit Equipment
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-start">
          <Badge variant={getStatusVariant(equipment.status)} size="md">
            {equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
          </Badge>
        </div>

        {/* Basic Information */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <h3 className="text-sm font-medium text-neutral-100 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-500 mb-1">Serial Number</p>
              <p className="text-sm text-neutral-100 font-mono">{equipment.serial_number}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Category</p>
              <p className="text-sm text-neutral-100">{equipment.category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Location</p>
              <p className="text-sm text-neutral-100">{equipment.location}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Department</p>
              <p className="text-sm text-neutral-100">{department?.name || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Purchase & Warranty */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <h3 className="text-sm font-medium text-neutral-100 mb-4">Purchase & Warranty</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-500 mb-1">Purchase Date</p>
              <p className="text-sm text-neutral-100">
                {equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Warranty Expiry</p>
              <p className="text-sm text-neutral-100">
                {equipment.warranty_expiry ? (
                  <>
                    {new Date(equipment.warranty_expiry).toLocaleDateString()}
                    {new Date(equipment.warranty_expiry) < new Date() && (
                      <span className="ml-2 text-xs text-red-400">(Expired)</span>
                    )}
                  </>
                ) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Assignment */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
          <h3 className="text-sm font-medium text-neutral-100 mb-4">Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-500 mb-1">Assigned Employee</p>
              <p className="text-sm text-neutral-100">{equipment.assigned_employee || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Maintenance Team</p>
              <p className="text-sm text-neutral-100">{team?.name || 'N/A'}</p>
              {team?.specialization && (
                <p className="text-xs text-neutral-500 mt-1">{team.specialization}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Assigned Technician</p>
              <p className="text-sm text-neutral-100">{technician?.name || 'Unassigned'}</p>
              {technician?.email && (
                <p className="text-xs text-neutral-500 mt-1">{technician.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

