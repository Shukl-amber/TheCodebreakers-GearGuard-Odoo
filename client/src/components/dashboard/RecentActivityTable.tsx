'use client';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/dashboard/StatusBadge';
import type { RequestStage } from '@/types/requests';

interface MaintenanceRequest {
  id: string;
  subject: string;
  equipment_name: string;
  technician_name: string;
  stage: RequestStage;
  created_at: string;
}

export default function RecentActivityTable({ requests }: { requests: MaintenanceRequest[] }) {
  const router = useRouter();

  return (
    <table className="w-full text-sm">
      <thead className="bg-neutral-900/50 text-neutral-400 border-b border-neutral-800">
        <tr>
          <Th>Subject</Th>
          <Th>Equipment</Th>
          <Th>Stage</Th>
          <Th>Technician</Th>
          <Th>Created</Th>
        </tr>
      </thead>
      <tbody>
        {requests.map((r) => (
          <tr 
            key={r.id} 
            className="border-b border-neutral-800/50 hover:bg-neutral-800/30 cursor-pointer transition-all duration-200 group"
            onClick={() => router.push(`/dashboard/requests/${r.id}/edit`)}
          >
            <Td>
              <div className="text-blue-400 group-hover:text-blue-300 font-medium transition-colors">
                {r.subject}
              </div>
            </Td>
            <Td className="text-neutral-300">{r.equipment_name}</Td>
            <Td>
              <StatusBadge stage={r.stage} />
            </Td>
            <Td className="text-neutral-300">{r.technician_name}</Td>
            <Td className="text-neutral-400">{format(new Date(r.created_at), 'yyyy-MM-dd HH:mm')}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-6 py-4 align-top">{children}</td>;
}

