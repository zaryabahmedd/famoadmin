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
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid } from '@mui/x-data-grid';

import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import VerifiedIcon from '@mui/icons-material/Verified';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending_verification', label: 'Pending Verification' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'blocked', label: 'Blocked' },
];

const DOC_KEYS = [
  { key: 'license_front', label: 'License — Front' },
  { key: 'license_back', label: 'License — Back' },
  { key: 'selfie', label: 'Selfie' },
  { key: 'selfie_with_license', label: 'Selfie + License' },
];

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 0.5 }}>
      <Box sx={{ color: 'text.disabled', mt: 0.25 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
      </Box>
    </Stack>
  );
}

function SectionLabel({ children }) {
  return (
    <Typography
      variant="overline"
      color="text.secondary"
      sx={{ fontWeight: 700, letterSpacing: 0.8, display: 'block', mt: 2.5, mb: 1 }}
    >
      {children}
    </Typography>
  );
}

export default function DriversPage() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawer, setDrawer] = useState(null);
  const [docUrls, setDocUrls] = useState({});
  const [docLoading, setDocLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [acting, setActing] = useState(null);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  /* ── fetch all riders ── */
  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/riders');
      const data = await res.json();
      if (res.ok) setRiders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  /* ── open drawer + load signed URLs ── */
  const openDrawer = useCallback(async (rider) => {
    setDrawer(rider);
    if (!docUrls[rider.id]) {
      setDocLoading(true);
      try {
        const res = await fetch(`/api/riders/${rider.id}/signed-urls`);
        const urls = await res.json();
        if (res.ok) setDocUrls((prev) => ({ ...prev, [rider.id]: urls }));
      } finally {
        setDocLoading(false);
      }
    }
  }, [docUrls]);

  /* ── update rider status ── */
  const updateStatus = useCallback(async (riderId, status) => {
    setActing(riderId);
    try {
      const res = await fetch(`/api/riders/${riderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRiders((prev) => prev.map((r) => r.id === riderId ? { ...r, status } : r));
        setDrawer((prev) => prev?.id === riderId ? { ...prev, status } : prev);
        const labels = { approved: 'Rider approved ✓', rejected: 'Rider rejected', blocked: 'Rider blocked' };
        setToast({ open: true, msg: labels[status] || `Status set to ${status}`, severity: status === 'approved' ? 'success' : 'warning' });
      } else {
        setToast({ open: true, msg: 'Action failed. Try again.', severity: 'error' });
      }
    } finally {
      setActing(null);
    }
  }, []);

  /* ── filtered rows ── */
  const rows = useMemo(() =>
    riders.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        r.full_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone_number?.toLowerCase().includes(q) ||
        r.vehicle_plate?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    }),
    [riders, search, statusFilter]
  );

  /* ── DataGrid columns ── */
  const columns = [
    {
      field: 'full_name',
      headerName: 'Rider',
      flex: 1,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: '100%', py: 0.75, overflow: 'hidden' }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            {initials(row.full_name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{row.full_name || '—'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{row.email}</Typography>
          </Box>
        </Stack>
      ),
    },
    { field: 'phone_number', headerName: 'Phone', width: 148, valueFormatter: (v) => v || '—' },
    {
      field: 'vehicle_type',
      headerName: 'Vehicle',
      width: 150,
      renderCell: ({ row }) => (
        <Typography variant="body2" noWrap>
          {[row.vehicle_type, row.vehicle_plate].filter(Boolean).join(' · ') || '—'}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Joined',
      width: 115,
      valueFormatter: (v) => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 185,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <StatusChip status={value} />
        </Box>
      ),
    },
    {
      field: '_view',
      headerName: '',
      width: 52,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Tooltip title="View profile">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openDrawer(row); }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  /* ── drawer content ── */
  const currentUrls = drawer ? (docUrls[drawer.id] || {}) : {};
  const isActing = acting === drawer?.id;

  const ActionButtons = () => {
    const s = drawer?.status;
    return (
      <Stack spacing={1.5} sx={{ mt: 3 }}>
        <Divider />
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Actions</Typography>
        <Stack direction="row" spacing={1.5}>
          {s !== 'approved' && (
            <Button
              variant="contained" color="success" fullWidth
              startIcon={isActing ? null : <CheckCircleIcon />}
              disabled={isActing}
              onClick={() => updateStatus(drawer.id, 'approved')}
            >
              {isActing ? <CircularProgress size={18} color="inherit" /> : 'Approve'}
            </Button>
          )}
          {s !== 'rejected' && s !== 'blocked' && (
            <Button
              variant="outlined" color="error" fullWidth
              startIcon={<CancelIcon />}
              disabled={isActing}
              onClick={() => updateStatus(drawer.id, 'rejected')}
            >
              Reject
            </Button>
          )}
          {s === 'approved' && (
            <Button
              variant="outlined" color="error" fullWidth
              startIcon={<BlockIcon />}
              disabled={isActing}
              onClick={() => updateStatus(drawer.id, 'blocked')}
            >
              Block
            </Button>
          )}
          {(s === 'rejected' || s === 'blocked') && (
            <Button
              variant="outlined" color="warning" fullWidth
              startIcon={<CheckCircleIcon />}
              disabled={isActing}
              onClick={() => updateStatus(drawer.id, 'approved')}
            >
              Reinstate
            </Button>
          )}
        </Stack>
      </Stack>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Riders"
        subtitle={loading ? 'Loading…' : `${riders.length} rider${riders.length !== 1 ? 's' : ''} total`}
      />

      <Card sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search by name, email, phone or plate…"
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
            sx={{ minWidth: 210 }}
          >
            {STATUS_FILTERS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
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
            getRowHeight={() => 'auto'}
            getEstimatedRowHeight={() => 68}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
            pageSizeOptions={[15, 30, 50]}
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9', py: 1, display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
            }}
          />
        )}
      </Card>

      {/* ── Detail Drawer ── */}
      <Drawer
        anchor="right"
        open={!!drawer}
        onClose={() => setDrawer(null)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 480 } } }}
      >
        {drawer && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontWeight: 700, fontSize: 18 }}>
                {initials(drawer.full_name)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>{drawer.full_name}</Typography>
                <StatusChip status={drawer.status} />
              </Box>
              <IconButton onClick={() => setDrawer(null)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Scrollable body */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, pb: 3 }}>

              {/* Step 1 — Account */}
              <SectionLabel>Account</SectionLabel>
              <InfoRow icon={<EmailIcon fontSize="small" />} label="Email" value={drawer.email} />
              <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={drawer.phone_number} />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5 }}>
                <VerifiedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>Verified</Typography>
                  <Chip
                    size="small"
                    label={drawer.is_verified ? 'Yes' : 'No'}
                    color={drawer.is_verified ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ mt: 0.25 }}
                  />
                </Box>
              </Stack>
              <InfoRow
                icon={<Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>Joined</Typography>}
                label="Joined"
                value={drawer.created_at ? new Date(drawer.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : undefined}
              />

              {/* Step 3 — Vehicle */}
              {(drawer.vehicle_type || drawer.vehicle_brand) && (
                <>
                  <SectionLabel>Vehicle</SectionLabel>
                  <InfoRow icon={<TwoWheelerIcon fontSize="small" />} label="Type" value={drawer.vehicle_type} />
                  <InfoRow icon={<Box />} label="Brand" value={drawer.vehicle_brand} />
                  <InfoRow icon={<Box />} label="Model" value={drawer.vehicle_model} />
                  <InfoRow icon={<Box />} label="Year" value={drawer.vehicle_year} />
                  <InfoRow icon={<Box />} label="Plate number" value={drawer.vehicle_plate} />
                </>
              )}

              {/* Step 4 — Payout */}
              {(drawer.payout_bank || drawer.payout_account_number) && (
                <>
                  <SectionLabel>Payout Details</SectionLabel>
                  <InfoRow icon={<AccountBalanceIcon fontSize="small" />} label="Bank" value={drawer.payout_bank} />
                  <InfoRow icon={<Box />} label="Account number" value={drawer.payout_account_number} />
                  {drawer.payout_bvn && (
                    <InfoRow icon={<Box />} label="BVN" value={`••••• ${drawer.payout_bvn.slice(-4)}`} />
                  )}
                </>
              )}

              {/* Step 2 — Documents */}
              <SectionLabel>Documents</SectionLabel>
              {docLoading ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {DOC_KEYS.map(({ key }) => <Skeleton key={key} variant="rounded" height={110} />)}
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {DOC_KEYS.map(({ key, label }) => (
                    <Box key={key}>
                      <Box
                        onClick={() => currentUrls[key] && setPreview({ url: currentUrls[key], label })}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          overflow: 'hidden',
                          aspectRatio: '4/3',
                          bgcolor: 'grey.50',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: currentUrls[key] ? 'pointer' : 'default',
                          transition: 'opacity 0.15s',
                          '&:hover': currentUrls[key] ? { opacity: 0.8 } : {},
                        }}
                      >
                        {currentUrls[key] ? (
                          <Box
                            component="img"
                            src={currentUrls[key]}
                            alt={label}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <Stack alignItems="center" spacing={0.5}>
                            <ImageNotSupportedIcon sx={{ color: 'text.disabled', fontSize: 28 }} />
                            <Typography variant="caption" color="text.disabled">Not uploaded</Typography>
                          </Stack>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Actions */}
              <ActionButtons />
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Full-size image preview */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#111' }}>
          <IconButton
            onClick={() => setPreview(null)}
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', zIndex: 10, '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          {preview && (
            <>
              <Box
                component="img"
                src={preview.url}
                alt={preview.label}
                sx={{ display: 'block', width: '100%', maxHeight: '82vh', objectFit: 'contain' }}
              />
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.6)', py: 1 }}>
                {preview.label}
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>

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
