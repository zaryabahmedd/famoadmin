'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
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
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ScaleIcon from '@mui/icons-material/Scale';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PhoneIcon from '@mui/icons-material/Phone';
import NotesIcon from '@mui/icons-material/Notes';
import EmailIcon from '@mui/icons-material/Email';
import CategoryIcon from '@mui/icons-material/Category';
import StraightenIcon from '@mui/icons-material/Straighten';
import DescriptionIcon from '@mui/icons-material/Description';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import CallMadeIcon from '@mui/icons-material/CallMade';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UpdateIcon from '@mui/icons-material/Update';

import PageHeader from '../components/PageHeader';
import StatusChip, { currency } from '../components/StatusChip';
import { orderCode, normalizeTrackingCode } from '../lib/orderCode';

const TABS = [
  { value: 'active', label: 'Active', statuses: ['searching', 'accepted', 'picked_up'] },
  { value: 'scheduled', label: 'Scheduled', statuses: [] },
  { value: 'completed', label: 'Completed', statuses: ['delivered'] },
  { value: 'cancelled', label: 'Canceled', statuses: ['cancelled'] },
];

function fmtDate(v) {
  return v ? new Date(v).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

/* Section heading with a small icon — a lightweight label, not a nested card. */
function SectionLabel({ icon, children }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
      <Box sx={{ display: 'flex', color: 'primary.main' }}>{icon}</Box>
      <Typography
        variant="caption"
        sx={{ fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: 'text.secondary' }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

/* A single label/value line with a leading icon. Hidden when value is empty. */
function Field({ icon, label, value, strong, color }) {
  if (value == null || value === '') return null;
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 0.65 }}>
      <Box sx={{ color: 'text.disabled', mt: '2px', display: 'flex' }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>{label}</Typography>
        <Typography
          variant="body2"
          component="div"
          sx={{ fontWeight: strong ? 700 : 500, wordBreak: 'break-word', color: color || 'text.primary', lineHeight: 1.4 }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

/* A tappable phone number rendered as a tel: link. */
function PhoneLink({ phone }) {
  if (!phone) return null;
  return (
    <Box
      component="a"
      href={`tel:${phone}`}
      sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
    >
      {phone}
    </Box>
  );
}

/* Name + tappable phone, used for sender / recipient. */
function Contact({ kind, icon, name, phone }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.disabled', mb: 0.5 }}>
        <Box sx={{ display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.4 }}>{kind}</Typography>
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{name || '—'}</Typography>
      {phone && (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
          <PhoneIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
          <Typography variant="caption" component="div"><PhoneLink phone={phone} /></Typography>
        </Stack>
      )}
    </Box>
  );
}

/* Pickup → drop-off as a connected timeline. */
function RouteStop({ color, kind, address, notes, isLast }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="stretch">
      <Stack alignItems="center" sx={{ width: 14 }}>
        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, mt: '3px', flexShrink: 0, boxShadow: `0 0 0 3px ${color}22` }} />
        {!isLast && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5, minHeight: 16 }} />}
      </Stack>
      <Box sx={{ pb: isLast ? 0 : 2, minWidth: 0, flex: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color, letterSpacing: 0.4, display: 'block' }}>{kind}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word', lineHeight: 1.4 }}>{address || '—'}</Typography>
        {notes && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontStyle: 'italic', wordBreak: 'break-word' }}>
            “{notes}”
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState(null);
  const [trackToast, setTrackToast] = useState({ open: false, msg: '' });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  /* ── resolve a ?track=FAMO-XXXXX deep link once orders are loaded ── */
  useEffect(() => {
    const code = searchParams.get('track');
    if (!code || loading || orders.length === 0) return;

    const suffix = normalizeTrackingCode(code);
    const match = orders.find(
      (o) => o.id.replace(/-/g, '').slice(-5).toLowerCase() === suffix
    );

    if (match) {
      const matchTab = TABS.find((t) => t.statuses.includes(match.status));
      if (matchTab) setTab(matchTab.value);
      setDrawer(match);
    } else {
      setTrackToast({ open: true, msg: `No order matches tracking number FAMO-${suffix.toUpperCase()}` });
    }

    // clear the query param so the lookup doesn't re-trigger on every render
    router.replace(pathname);
  }, [searchParams, loading, orders, router, pathname]);

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
      width: 130,
      valueFormatter: (v) => v ? orderCode(v) : '—',
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
        PaperProps={{ sx: { width: { xs: '100vw', sm: 440, md: 480 }, maxWidth: '100vw' } }}
      >
        {drawer && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="flex-start" spacing={2}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.8, lineHeight: 1 }}>
                    Order
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }} noWrap>
                    {orderCode(drawer.id)}
                  </Typography>
                  <Box sx={{ mt: 1 }}><StatusChip status={drawer.status} /></Box>
                </Box>
                <IconButton onClick={() => setDrawer(null)} size="small">
                  <CloseIcon />
                </IconButton>
              </Stack>

              {/* Price + placed date highlight */}
              <Box
                sx={{
                  mt: 2,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                }}
              >
                <Box sx={{ p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Price</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: 'success.main', lineHeight: 1.2 }}>
                    {drawer.price != null ? currency(drawer.price) : '—'}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderLeft: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Placed</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4, mt: 0.5 }}>
                    {fmtDate(drawer.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Scrollable body — flat sections separated by dividers */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5 }}>

              <SectionLabel icon={<PersonIcon fontSize="small" />}>Customer</SectionLabel>
              <Field icon={<PersonIcon fontSize="small" />} label="Name" value={drawer.user?.full_name} strong />
              <Field icon={<PhoneIcon fontSize="small" />} label="Phone" value={<PhoneLink phone={drawer.user?.phone_number} />} />
              <Field icon={<EmailIcon fontSize="small" />} label="Email" value={drawer.user?.email} />

              <Divider sx={{ my: 2.5 }} />

              <SectionLabel icon={<TwoWheelerIcon fontSize="small" />}>Rider</SectionLabel>
              {drawer.rider?.full_name ? (
                <>
                  <Field icon={<PersonIcon fontSize="small" />} label="Name" value={drawer.rider?.full_name} strong />
                  <Field icon={<PhoneIcon fontSize="small" />} label="Phone" value={<PhoneLink phone={drawer.rider?.phone_number} />} />
                  <Field icon={<TwoWheelerIcon fontSize="small" />} label="Vehicle" value={[drawer.rider?.vehicle_type, drawer.rider?.vehicle_plate].filter(Boolean).join(' · ')} />
                </>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.5, color: 'text.disabled' }}>
                  <EventBusyIcon fontSize="small" />
                  <Typography variant="body2">No rider assigned yet</Typography>
                </Stack>
              )}

              <Divider sx={{ my: 2.5 }} />

              <SectionLabel icon={<PlaceIcon fontSize="small" />}>Route</SectionLabel>
              <RouteStop color="#16a34a" kind="PICKUP" address={drawer.pickup_address} notes={drawer.pickup_notes} />
              <RouteStop color="#dc2626" kind="DROP-OFF" address={drawer.dropoff_address} notes={drawer.dropoff_notes} isLast />

              {(drawer.sender_name || drawer.sender_phone || drawer.recipient_name || drawer.recipient_phone) && (
                <>
                  <Divider sx={{ my: 2.5 }} />
                  <SectionLabel icon={<PersonIcon fontSize="small" />}>Sender / Recipient</SectionLabel>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
                  >
                    <Contact kind="SENDER" icon={<CallMadeIcon sx={{ fontSize: 14 }} />} name={drawer.sender_name} phone={drawer.sender_phone} />
                    <Contact kind="RECIPIENT" icon={<CallReceivedIcon sx={{ fontSize: 14 }} />} name={drawer.recipient_name} phone={drawer.recipient_phone} />
                  </Stack>
                </>
              )}

              <Divider sx={{ my: 2.5 }} />

              <SectionLabel icon={<Inventory2Icon fontSize="small" />}>Package</SectionLabel>
              <Field icon={<CategoryIcon fontSize="small" />} label="Category" value={drawer.package_category} />
              <Field icon={<DescriptionIcon fontSize="small" />} label="Description" value={drawer.package_description} />
              <Field icon={<StraightenIcon fontSize="small" />} label="Size" value={drawer.package_size} />
              <Field icon={<ScaleIcon fontSize="small" />} label="Weight" value={drawer.weight != null ? `${drawer.weight} kg` : undefined} />
              <Field icon={<NotesIcon fontSize="small" />} label="Special instructions" value={drawer.special_instructions} />

              <Divider sx={{ my: 2.5 }} />

              <SectionLabel icon={<AccessTimeIcon fontSize="small" />}>Timeline</SectionLabel>
              <Field icon={<AccessTimeIcon fontSize="small" />} label="Placed" value={fmtDate(drawer.created_at)} />
              <Field icon={<CheckCircleIcon fontSize="small" />} label="Accepted" value={drawer.accepted_at ? fmtDate(drawer.accepted_at) : undefined} />
              <Field icon={<UpdateIcon fontSize="small" />} label="Last updated" value={fmtDate(drawer.updated_at)} />
            </Box>
          </Box>
        )}
      </Drawer>

      <Snackbar
        open={trackToast.open}
        autoHideDuration={4500}
        onClose={() => setTrackToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" variant="filled" onClose={() => setTrackToast((t) => ({ ...t, open: false }))} sx={{ width: '100%' }}>
          {trackToast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
