'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import { DataGrid } from '@mui/x-data-grid';

import PageHeader from '../components/PageHeader';
import { currency } from '../components/StatusChip';

const TAB_FILTERS = ['', 'rider', 'user', 'profile', 'pricing', 'admin'];

const ACTION_META = {
  'rider.approved': { label: 'Approved rider', color: 'success' },
  'rider.rejected': { label: 'Rejected rider', color: 'error' },
  'rider.blocked': { label: 'Blocked rider', color: 'error' },
  'rider.status_changed': { label: 'Changed rider status', color: 'default' },
  'user.blocked': { label: 'Blocked user', color: 'error' },
  'user.unblocked': { label: 'Unblocked user', color: 'success' },
  'profile.approved': { label: 'Approved profile change', color: 'success' },
  'profile.rejected': { label: 'Rejected profile change', color: 'error' },
  'pricing.updated': { label: 'Updated pricing', color: 'warning' },
  'admin.created': { label: 'Created admin', color: 'info' },
  'admin.deactivated': { label: 'Deactivated admin', color: 'error' },
  'admin.reactivated': { label: 'Reactivated admin', color: 'success' },
  'admin.role_changed': { label: 'Changed admin role', color: 'info' },
  'admin.password_reset': { label: 'Reset admin password', color: 'default' },
  'admin.password_changed': { label: 'Changed own password', color: 'default' },
};

function describeDetails(action, details) {
  if (!details) return '';
  if (action === 'pricing.updated') {
    const { from, to } = details;
    // New shape: arrays of { size, base_price, per_km_price }. Older entries
    // used a single { base_price, per_km_price } object — handle both.
    const fmtOne = (p) => `${currency(p.base_price)} + ${currency(p.per_km_price)}/km`;
    const fmtSide = (side) => {
      if (!side) return '—';
      if (Array.isArray(side)) return side.map((p) => `${p.size}: ${fmtOne(p)}`).join('  ·  ');
      return fmtOne(side);
    };
    return `${fmtSide(from)}  →  ${fmtSide(to)}`;
  }
  if (action === 'admin.role_changed') {
    return `${details.from || '—'} → ${details.to || '—'}`;
  }
  if (action === 'profile.approved' && details.changes) {
    return details.changes.join('  ·  ');
  }
  const parts = [];
  if (details.to) parts.push(`→ ${details.to}`);
  if (details.reason) parts.push(`reason: ${details.reason}`);
  if (details.role) parts.push(`role: ${details.role}`);
  return parts.join('  ·  ');
}

const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AuditLogsPage() {
  const [tab, setTab] = useState(0);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const filter = TAB_FILTERS[tab];
        const res = await fetch(`/api/audit-logs${filter ? `?filter=${filter}` : ''}`);
        const data = await res.json();
        if (active && res.ok) setLogs(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [tab]);

  const columns = [
    { field: 'created_at', headerName: 'When', width: 170, valueFormatter: fmtDateTime },
    {
      field: 'actor_name',
      headerName: 'Admin',
      width: 200,
      renderCell: ({ row }) => (
        <Box sx={{ minWidth: 0, py: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{row.actor_name || '—'}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{row.actor_email}</Typography>
        </Box>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 200,
      renderCell: ({ value }) => {
        const meta = ACTION_META[value] || { label: value, color: 'default' };
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />
          </Box>
        );
      },
    },
    {
      field: 'target_label',
      headerName: 'Target',
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }) => (
        <Box sx={{ minWidth: 0, py: 0.75 }}>
          <Typography variant="body2" noWrap>{row.target_label || (row.target_type === 'pricing' ? 'Pricing settings' : '—')}</Typography>
          {row.target_type && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{row.target_type}</Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'details',
      headerName: 'Details',
      flex: 1,
      minWidth: 200,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'normal' }}>
            {describeDetails(row.action, row.details)}
          </Typography>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Audit Logs"
        subtitle="Every approval, rejection, block and configuration change — attributed and timestamped."
      />

      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 2 }}>
          <Tab label="All" />
          <Tab label="Riders" />
          <Tab label="Users" />
          <Tab label="Profile" />
          <Tab label="Pricing" />
          <Tab label="Admins" />
        </Tabs>
      </Card>

      <Card sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : logs.length === 0 ? (
          <Stack alignItems="center" sx={{ py: 8 }}>
            <Typography color="text.secondary">No log entries yet.</Typography>
          </Stack>
        ) : (
          <DataGrid
            rows={logs}
            columns={columns}
            getRowId={(r) => r.id}
            autoHeight
            getRowHeight={() => 'auto'}
            getEstimatedRowHeight={() => 64}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            pageSizeOptions={[25, 50, 100]}
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9', py: 1, display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
            }}
          />
        )}
      </Card>
    </Box>
  );
}
