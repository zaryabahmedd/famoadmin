import Chip from '@mui/material/Chip';

// Maps a status string to a MUI Chip with the right color + label.
const STATUS_MAP = {
  // order / delivery statuses
  pending: { color: 'default', label: 'Pending' },
  assigned: { color: 'info', label: 'Assigned' },
  in_transit: { color: 'secondary', label: 'In transit' },
  delivered: { color: 'success', label: 'Delivered' },
  cancelled: { color: 'error', label: 'Cancelled' },
  unassigned: { color: 'warning', label: 'Unassigned' },
  searching: { color: 'warning', label: 'Searching for rider' },
  accepted: { color: 'info', label: 'Accepted' },
  picked_up: { color: 'secondary', label: 'Picked up' },
  // driver/rider statuses
  active: { color: 'success', label: 'Active' },
  docs_pending: { color: 'warning', label: 'Docs pending' },
  blocked: { color: 'error', label: 'Blocked' },
  pending_verification: { color: 'default', label: 'Pending Verification' },
  pending_approval: { color: 'warning', label: 'Pending Approval' },
  approved: { color: 'success', label: 'Approved' },
  rejected: { color: 'error', label: 'Rejected' },
  blocked: { color: 'error', label: 'Blocked' },
  // generic
  suspended: { color: 'error', label: 'Suspended' },
  processed: { color: 'success', label: 'Processed' },
  // assignment
  online: { color: 'success', label: 'Online' },
  offline: { color: 'default', label: 'Offline' },
};

export default function StatusChip({ status, size = 'small' }) {
  const cfg = STATUS_MAP[status] || { color: 'default', label: status };
  return <Chip size={size} color={cfg.color} label={cfg.label} variant="filled" />;
}

export function statusColor(status) {
  return (STATUS_MAP[status] || { color: 'default' }).color;
}

export const currency = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
