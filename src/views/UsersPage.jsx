'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';
import { DataGrid } from '@mui/x-data-grid';

import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import PageHeader from '../components/PageHeader';

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const STATUS_COLOR = { active: 'success', blocked: 'error' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [acting, setActing] = useState(null);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = useCallback(async (user) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    setActing(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
        setToast({
          open: true,
          msg: `${user.full_name || 'User'} ${newStatus === 'blocked' ? 'blocked' : 'unblocked'}.`,
          severity: newStatus === 'blocked' ? 'warning' : 'success',
        });
      } else {
        const body = await res.json().catch(() => ({}));
        setToast({ open: true, msg: body.error || 'Action failed. Try again.', severity: 'error' });
      }
    } finally {
      setActing(null);
    }
  }, []);

  const rows = useMemo(() =>
    users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone_number?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchStatus;
    }),
    [users, search, statusFilter]
  );

  const columns = [
    {
      field: 'full_name',
      headerName: 'User',
      flex: 1,
      minWidth: 240,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: '100%' }}>
          <Avatar src={row.avatar_url || undefined} sx={{ bgcolor: 'secondary.main', width: 38, height: 38, fontSize: 14 }}>
            {initials(row.full_name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{row.full_name || '—'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{row.email}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'phone_number',
      headerName: 'Phone',
      width: 160,
      valueFormatter: (v) => v || '—',
    },
    {
      field: 'created_at',
      headerName: 'Joined',
      width: 130,
      valueFormatter: (v) => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Chip
            size="small"
            label={value === 'blocked' ? 'Blocked' : 'Active'}
            color={STATUS_COLOR[value] || 'default'}
            variant="filled"
          />
        </Box>
      ),
    },
    {
      field: '_action',
      headerName: 'Action',
      width: 140,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Button
            size="small"
            variant={row.status === 'blocked' ? 'contained' : 'outlined'}
            color={row.status === 'blocked' ? 'success' : 'error'}
            startIcon={row.status === 'blocked' ? <CheckCircleIcon /> : <BlockIcon />}
            disabled={acting === row.id}
            onClick={(e) => { e.stopPropagation(); toggleStatus(row); }}
          >
            {acting === row.id
              ? <CircularProgress size={16} color="inherit" />
              : row.status === 'blocked' ? 'Unblock' : 'Block'}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle={loading ? 'Loading…' : `${users.length} registered customer${users.length !== 1 ? 's' : ''}`}
      />

      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
          />
          <TextField
            select size="small" label="Status"
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="blocked">Blocked</MenuItem>
          </TextField>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            autoHeight
            rowHeight={68}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
            pageSizeOptions={[15, 30, 50]}
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9', py: 1 },
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
            }}
          />
        )}
      </Card>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))} sx={{ width: '100%' }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
