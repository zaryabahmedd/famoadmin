'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid } from '@mui/x-data-grid';

import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import PlaceIcon from '@mui/icons-material/Place';
import FlagIcon from '@mui/icons-material/Flag';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ScaleIcon from '@mui/icons-material/Scale';
import PaidIcon from '@mui/icons-material/Paid';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PhoneIcon from '@mui/icons-material/Phone';
import NotesIcon from '@mui/icons-material/Notes';

import PageHeader from '../components/PageHeader';
import StatusChip, { currency } from '../components/StatusChip';

const TABS = [
  { value: 'active', label: 'Active', statuses: ['searching', 'accepted', 'picked_up'] },
  { value: 'scheduled', label: 'Scheduled', statuses: [] },
  { value: 'completed', label: 'Completed', statuses: ['delivered'] },
  { value: 'cancelled', label: 'Canceled', statuses: ['cancelled'] },
];

function fmtDate(v) {
  return v ? new Date(v).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 0.5 }}>
      <Box sx={{ color: 'text.disabled', mt: 0.25 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>{value}</Typography>
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

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (res.ok) setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const activeTab = TABS.find((t) => t.value === tab);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return orders
      .filter((o) => activeTab.statuses.includes(o.status))
      .filter((o) => {
        if (!q) return true;
        return (
          o.id?.toLowerCase().includes(q) ||
          o.user?.full_name?.toLowerCase().includes(q) ||
          o.rider?.full_name?.toLowerCase().includes(q) ||
          o.recipient_name?.toLowerCase().includes(q) ||
          o.pickup_address?.toLowerCase().includes(q) ||
          o.dropoff_address?.toLowerCase().includes(q)
        );
      });
  }, [orders, activeTab, search]);

  const columns = [
    {
      field: 'id',
      headerName: 'Order',
      width: 120,
      valueFormatter: (v) => v ? `#${v.slice(0, 8)}` : '—',
    },
    {
      field: 'customer',
      headerName: 'Customer',
      flex: 1,
      minWidth: 170,
      valueGetter: (_, row) => row.user?.full_name || '—',
      renderCell: ({ row }) => (
        <Box sx={{ minWidth: 0, py: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{row.user?.full_name || '—'}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{row.user?.phone_number || row.user?.email || ''}</Typography>
        </Box>
      ),
    },
    {
      field: 'rider',
      headerName: 'Rider',
      flex: 1,
      minWidth: 160,
      valueGetter: (_, row) => row.rider?.full_name || '—',
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', minWidth: 0 }}>
          <Typography variant="body2" noWrap color={row.rider?.full_name ? 'text.primary' : 'text.disabled'}>
            {row.rider?.full_name || 'Unassigned'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'route',
      headerName: 'Route',
      flex: 1.4,
      minWidth: 240,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ minWidth: 0, py: 0.75, overflow: 'hidden' }}>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>From </Box>
            {row.pickup_address || '—'}
          </Typography>
          <Typography variant="caption" noWrap sx={{ display: 'block' }}>
            <Box component="span" sx={{ color: 'error.main', fontWeight: 700 }}>To </Box>
            {row.dropoff_address || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 110,
      valueFormatter: (v) => v != null ? currency(v) : '—',
    },
    {
      field: 'created_at',
      headerName: 'Placed',
      width: 130,
      valueFormatter: (v) => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 170,
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
          <Tooltip title="View order">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDrawer(row); }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="All Orders"
        subtitle={loading ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''} total`}
      />

      <Card sx={{ p: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          {TABS.map((t) => (
            <Tab
              key={t.value}
              value={t.value}
              label={`${t.label} (${orders.filter((o) => t.statuses.includes(o.status)).length})`}
            />
          ))}
        </Tabs>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search by order id, customer, rider, recipient or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
          />
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : tab === 'scheduled' ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 8 }}>
            <EventBusyIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography color="text.secondary">No scheduled orders yet.</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ maxWidth: 360, textAlign: 'center' }}>
              Scheduling deliveries for a future date isn&apos;t supported by the app yet — once it is, those orders will appear here.
            </Typography>
          </Stack>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            autoHeight
            getRowHeight={() => 'auto'}
            getEstimatedRowHeight={() => 64}
            disableRowSelectionOnClick
            onRowClick={({ row }) => setDrawer(row)}
            initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
            pageSizeOptions={[15, 30, 50]}
            sx={{
              border: 0,
              cursor: 'pointer',
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
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                  Order #{drawer.id?.slice(0, 8)}
                </Typography>
                <StatusChip status={drawer.status} />
              </Box>
              <IconButton onClick={() => setDrawer(null)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Scrollable body */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, pb: 3 }}>

              <SectionLabel>Customer</SectionLabel>
              <InfoRow icon={<PersonIcon fontSize="small" />} label="Name" value={drawer.user?.full_name} />
              <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={drawer.user?.phone_number} />
              <InfoRow icon={<Box />} label="Email" value={drawer.user?.email} />

              <SectionLabel>Rider</SectionLabel>
              {drawer.rider?.full_name ? (
                <>
                  <InfoRow icon={<TwoWheelerIcon fontSize="small" />} label="Name" value={drawer.rider?.full_name} />
                  <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={drawer.rider?.phone_number} />
                  <InfoRow icon={<Box />} label="Vehicle" value={[drawer.rider?.vehicle_type, drawer.rider?.vehicle_plate].filter(Boolean).join(' · ')} />
                </>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ py: 0.5 }}>No rider assigned yet</Typography>
              )}

              <SectionLabel>Route</SectionLabel>
              <InfoRow icon={<PlaceIcon fontSize="small" sx={{ color: 'success.main' }} />} label="Pickup" value={drawer.pickup_address} />
              <InfoRow icon={<Box />} label="Pickup notes" value={drawer.pickup_notes} />
              <InfoRow icon={<FlagIcon fontSize="small" sx={{ color: 'error.main' }} />} label="Drop-off" value={drawer.dropoff_address} />
              <InfoRow icon={<Box />} label="Drop-off notes" value={drawer.dropoff_notes} />

              <SectionLabel>Sender / Recipient</SectionLabel>
              <InfoRow icon={<PersonIcon fontSize="small" />} label="Sender" value={[drawer.sender_name, drawer.sender_phone].filter(Boolean).join(' · ')} />
              <InfoRow icon={<PersonIcon fontSize="small" />} label="Recipient" value={[drawer.recipient_name, drawer.recipient_phone].filter(Boolean).join(' · ')} />

              <SectionLabel>Package</SectionLabel>
              <InfoRow icon={<Inventory2Icon fontSize="small" />} label="Category" value={drawer.package_category} />
              <InfoRow icon={<Box />} label="Description" value={drawer.package_description} />
              <InfoRow icon={<Box />} label="Size" value={drawer.package_size} />
              <InfoRow icon={<ScaleIcon fontSize="small" />} label="Weight" value={drawer.weight != null ? `${drawer.weight} kg` : undefined} />
              <InfoRow icon={<NotesIcon fontSize="small" />} label="Special instructions" value={drawer.special_instructions} />

              <SectionLabel>Order info</SectionLabel>
              <InfoRow icon={<PaidIcon fontSize="small" />} label="Price" value={drawer.price != null ? currency(drawer.price) : undefined} />
              <InfoRow icon={<Box />} label="Placed" value={fmtDate(drawer.created_at)} />
              <InfoRow icon={<Box />} label="Accepted" value={fmtDate(drawer.accepted_at)} />
              <InfoRow icon={<Box />} label="Last updated" value={fmtDate(drawer.updated_at)} />

              <Divider sx={{ mt: 3 }} />
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
