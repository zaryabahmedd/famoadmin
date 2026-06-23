'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { currency } from '../components/StatusChip';

const PLATFORM_CUT = 0.10;

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

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
        <PageHeader title="Dashboard" subtitle="Loading…" />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Key stats at a glance."
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Active orders" value={activeOrders.length} icon={<ReceiptLongIcon />} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Approved riders" value={approvedRiders.length} icon={<TwoWheelerIcon />} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Registered users" value={users.length} icon={<PeopleIcon />} color="secondary.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Total revenue" value={currency(totalRevenue)} icon={<PaidIcon />} color="warning.main" />
        </Grid>

        {revenueByMonth.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardHeader title="Revenue by month" subheader="Based on delivered orders" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByMonth} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f6" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => currency(v)} />
                    <Tooltip formatter={(v) => currency(v)} />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {pendingRiders.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardHeader
                title="Riders awaiting review"
                subheader={`${pendingRiders.length} rider${pendingRiders.length !== 1 ? 's' : ''} need attention`}
              />
              <CardContent sx={{ pt: 0 }}>
                <Stack divider={<Divider flexItem />} spacing={1}>
                  {pendingRiders.slice(0, 5).map((r) => (
                    <Stack key={r.id} direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ bgcolor: 'warning.main', width: 34, height: 34, fontSize: 13 }}>{initials(r.full_name)}</Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.full_name || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.status.replace(/_/g, ' ')}</Typography>
                      </Box>
                      <Button size="small" variant="text" onClick={() => router.push('/drivers')}>Review</Button>
                    </Stack>
                  ))}
                </Stack>
                {pendingRiders.length > 5 && (
                  <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => router.push('/drivers')}>
                    View all {pendingRiders.length} pending riders
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 1, mb: -0.5 }}>Rider Earnings</Typography>
          <Typography variant="body2" color="text.secondary">
            Based on completed (delivered) orders. Famo retains a 10% platform fee — riders keep the remaining 90%.
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard title="Overall rider earnings (gross)" value={currency(overallGross)} icon={<AccountBalanceWalletIcon />} color="primary.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard title="Overall after 10% platform fee (net)" value={currency(overallNet)} icon={<PercentIcon />} color="success.main" />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title="Earnings by rider"
              subheader={`${riderEarnings.length} rider${riderEarnings.length !== 1 ? 's' : ''} with completed orders`}
            />
            <CardContent sx={{ pt: 0 }}>
              {riderEarnings.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1 }}>
                  <TwoWheelerIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                  <Typography color="text.secondary">No completed orders yet — rider earnings will appear here.</Typography>
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                      <TableCell>Rider</TableCell>
                      <TableCell align="right">Completed orders</TableCell>
                      <TableCell align="right">Gross earnings</TableCell>
                      <TableCell align="right">Net earnings (after 10%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {riderEarnings.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: 13, fontWeight: 700 }}>
                              {initials(r.name)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.name}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{r.completedOrders.toLocaleString()}</TableCell>
                        <TableCell align="right">{currency(r.gross)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{currency(r.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableBody>
                    <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' } }}>
                      <TableCell>Overall</TableCell>
                      <TableCell align="right">{riderEarnings.reduce((s, r) => s + r.completedOrders, 0).toLocaleString()}</TableCell>
                      <TableCell align="right">{currency(overallGross)}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>{currency(overallNet)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
