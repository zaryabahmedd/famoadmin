'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import PeopleIcon from '@mui/icons-material/People';
import PaidIcon from '@mui/icons-material/Paid';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PercentIcon from '@mui/icons-material/Percent';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { currency } from '../components/StatusChip';

const PLATFORM_CUT = 0.10;

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function shortCurrency(val) {
  if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `₦${(val / 1_000).toFixed(0)}K`;
  return currency(val);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: '#1e293b', color: '#fff', px: 1.5, py: 1, borderRadius: 1.5, fontSize: 13 }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.65)', display: 'block' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{currency(payload[0].value)}</Typography>
    </Box>
  );
};

export default function DashboardPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [ordersRes, ridersRes, usersRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/riders'),
          fetch('/api/users'),
        ]);
        const [ordersData, ridersData, usersData] = await Promise.all([
          ordersRes.json(),
          ridersRes.json(),
          usersRes.json(),
        ]);
        if (active) {
          setOrders(ordersRes.ok ? ordersData : []);
          setRiders(ridersRes.ok ? ridersData : []);
          setUsers(usersRes.ok ? usersData : []);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const activeOrders = orders.filter((o) => ['assigned', 'in_transit', 'accepted', 'picked_up', 'searching'].includes(o.status));
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const approvedRiders = riders.filter((r) => r.status === 'approved');
  const pendingRiders = riders.filter((r) => ['pending_verification', 'pending_approval'].includes(r.status));

  const totalRevenue = deliveredOrders.reduce((s, o) => s + (Number(o.price) || 0), 0);

  const revenueByMonth = useMemo(() => {
    const byMonth = {};
    for (const o of deliveredOrders) {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en', { month: 'short', year: '2-digit' });
      byMonth[key] = byMonth[key] || { month: label, revenue: 0 };
      byMonth[key].revenue += Number(o.price) || 0;
    }
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [deliveredOrders]);

  const riderEarnings = useMemo(() => {
    const byRider = new Map();
    for (const o of deliveredOrders) {
      if (!o.rider?.id) continue;
      const entry = byRider.get(o.rider.id) || {
        id: o.rider.id,
        name: o.rider.full_name || 'Unknown rider',
        completedOrders: 0,
        gross: 0,
      };
      entry.completedOrders += 1;
      entry.gross += Number(o.price) || 0;
      byRider.set(o.rider.id, entry);
    }
    return [...byRider.values()]
      .map((r) => ({ ...r, net: r.gross * (1 - PLATFORM_CUT) }))
      .sort((a, b) => b.gross - a.gross);
  }, [deliveredOrders]);

  const overallGross = riderEarnings.reduce((s, r) => s + r.gross, 0);
  const overallNet = overallGross * (1 - PLATFORM_CUT);

  if (loading) {
    return (
      <Box>
        <PageHeader title="Dashboard" subtitle="Loading your data..." />
        <LinearProgress sx={{ borderRadius: 2, mx: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle={`${orders.length} total orders · ${riders.length} riders · ${users.length} users`} />

      {/* ───── Stat cards ───── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard
            title="Active orders"
            value={activeOrders.length}
            icon={<ReceiptLongIcon />}
            color="primary.main"
            subtitle={`${deliveredOrders.length} delivered`}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard
            title="Approved riders"
            value={approvedRiders.length}
            icon={<TwoWheelerIcon />}
            color="success.main"
            subtitle={pendingRiders.length ? `${pendingRiders.length} pending review` : 'All riders reviewed'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard title="Registered users" value={users.length} icon={<PeopleIcon />} color="#0ea5e9" />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard title="Total revenue" value={currency(totalRevenue)} icon={<PaidIcon />} color="warning.main" />
        </Grid>
      </Grid>

      {/* ───── Revenue chart + Pending riders ───── */}
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: pendingRiders.length > 0 ? 8 : 12 }}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ px: 3, pt: 2.5, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Revenue</Typography>
                <Typography variant="caption" color="text.secondary">Monthly revenue from delivered orders</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{currency(totalRevenue)}</Typography>
            </Box>
            <CardContent sx={{ pt: 1, pb: '16px !important' }}>
              {revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueByMonth} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={shortCurrency} tick={{ fontSize: 12, fill: '#94a3b8' }} width={65} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fill="url(#revenueGrad)"
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: 'text.secondary' }}>
                  <Typography>No delivered orders yet — revenue chart will appear here.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {pendingRiders.length > 0 && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ px: 3, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Needs attention</Typography>
                <Chip label={pendingRiders.length} size="small" color="warning" sx={{ ml: 'auto', fontWeight: 700, minWidth: 28 }} />
              </Box>
              <Divider />
              <CardContent sx={{ flex: 1, overflow: 'auto', pt: 1 }}>
                <Stack spacing={0}>
                  {pendingRiders.slice(0, 6).map((r) => (
                    <Box
                      key={r.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        py: 1.25,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 0 },
                      }}
                    >
                      <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark', width: 36, height: 36, fontSize: 13, fontWeight: 700 }}>
                        {initials(r.full_name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.full_name || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.status.replace(/_/g, ' ')}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/drivers')}
                  sx={{ fontWeight: 600 }}
                >
                  Review riders
                </Button>
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ───── Rider Earnings section ───── */}
      <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 4, height: 24, borderRadius: 2, bgcolor: 'primary.main' }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Rider Earnings</Typography>
          <Typography variant="caption" color="text.secondary">
            Famo retains 10% platform fee — riders keep 90%
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard title="Total deliveries" value={deliveredOrders.length} icon={<LocalShippingIcon />} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard title="Gross earnings" value={currency(overallGross)} icon={<AccountBalanceWalletIcon />} color="#4f46e5" />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard title="Platform fee (10%)" value={currency(overallGross - overallNet)} icon={<PercentIcon />} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard title="Rider payouts" value={currency(overallNet)} icon={<PaidIcon />} color="success.main" />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Earnings by rider</Typography>
              <Typography variant="caption" color="text.secondary">
                {riderEarnings.length} rider{riderEarnings.length !== 1 ? 's' : ''} with completed orders
              </Typography>
            </Box>
            <CardContent sx={{ pt: 0, pb: '16px !important' }}>
              {riderEarnings.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1 }}>
                  <TwoWheelerIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                  <Typography color="text.secondary">No completed orders yet — rider earnings will appear here.</Typography>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Rider</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Orders</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Gross</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Net (90%)</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '.05em', width: 140 }}>Share</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {riderEarnings.map((r, i) => {
                        const pct = overallGross > 0 ? (r.gross / overallGross) * 100 : 0;
                        return (
                          <TableRow
                            key={r.id}
                            sx={{
                              '&:last-child td': { borderBottom: 0 },
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <TableCell>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{
                                  bgcolor: ['primary.main', 'success.main', '#0ea5e9', 'warning.main', 'error.main'][i % 5],
                                  width: 36, height: 36, fontSize: 13, fontWeight: 700,
                                }}>
                                  {initials(r.name)}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.name}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.completedOrders.toLocaleString()}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{currency(r.gross)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>{currency(r.net)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <LinearProgress
                                  variant="determinate"
                                  value={pct}
                                  sx={{
                                    flex: 1,
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: '#f1f5f9',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      bgcolor: ['primary.main', 'success.main', '#0ea5e9', 'warning.main', 'error.main'][i % 5],
                                    },
                                  }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 34, textAlign: 'right' }}>
                                  {pct.toFixed(0)}%
                                </Typography>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableBody>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {riderEarnings.reduce((s, r) => s + r.completedOrders, 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{currency(overallGross)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{currency(overallNet)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
