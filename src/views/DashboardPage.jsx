'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import PeopleIcon from '@mui/icons-material/People';
import PaidIcon from '@mui/icons-material/Paid';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CircleIcon from '@mui/icons-material/Circle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PercentIcon from '@mui/icons-material/Percent';

import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusChip, { currency } from '../components/StatusChip';
import {
  orders,
  drivers,
  customers,
  revenueByMonth,
  revenueByZone,
} from '../data/dummyData';

const PLATFORM_CUT = 0.10; // Famo keeps 10% of every completed delivery

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function DashboardPage() {
  const router = useRouter();
  const navigate = (href) => router.push(href);

  /* ── rider earnings, derived from delivered orders ── */
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [earningsLoading, setEarningsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setEarningsLoading(true);
      try {
        const res = await fetch('/api/orders?status=delivered');
        const data = await res.json();
        if (active && res.ok) setDeliveredOrders(data);
      } finally {
        if (active) setEarningsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

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

  const activeOrders = orders.filter((o) => ['assigned', 'in_transit'].includes(o.status));
  const unassigned = orders.filter((o) => o.status === 'unassigned');
  const onlineDrivers = drivers.filter((d) => d.online);
  const pendingDocs = drivers.filter((d) => d.status === 'docs_pending');
  const blocked = drivers.filter((d) => d.status === 'blocked');
  const revenueToday = orders
    .filter((o) => o.status === 'delivered')
    .reduce((s, o) => s + o.amount, 0);

  const attention = [
    ...unassigned.map((o) => ({
      id: o.id,
      color: 'error.main',
      title: `${o.id} unassigned in ${o.zone}`,
      detail: `${o.service} · ${currency(o.amount)}`,
      action: () => navigate('/orders'),
      cta: 'Assign',
    })),
    ...pendingDocs.map((d) => ({
      id: d.id,
      color: 'warning.main',
      title: `${d.name} awaiting document review`,
      detail: 'Cannot go active until docs pass',
      action: () => navigate('/drivers'),
      cta: 'Review',
    })),
    ...blocked.map((d) => ({
      id: d.id,
      color: 'error.main',
      title: `${d.name} is blocked`,
      detail: 'Rejected document on file',
      action: () => navigate('/drivers'),
      cta: 'Open',
    })),
  ];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Key stats at a glance, live fleet snapshot, and urgent actions."
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Active orders"
            value={activeOrders.length}
            trend={8.2}
            icon={<ReceiptLongIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Drivers online"
            value={`${onlineDrivers.length}/${drivers.length}`}
            trend={3.5}
            icon={<TwoWheelerIcon />}
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Registered users"
            value={customers.length.toLocaleString()}
            trend={12.1}
            icon={<PeopleIcon />}
            color="secondary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Revenue today"
            value={currency(revenueToday)}
            trend={-2.4}
            icon={<PaidIcon />}
            color="warning.main"
          />
        </Grid>

        {/* Revenue trend */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Revenue trend" subheader="Last 6 months" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueByMonth} margin={{ left: -10, right: 10 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f6" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v) => currency(v)} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Live fleet snapshot */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Live fleet snapshot" subheader="Drivers currently online" />
            <CardContent sx={{ pt: 0 }}>
              <List dense>
                {onlineDrivers.map((d) => (
                  <ListItem
                    key={d.id}
                    secondaryAction={<StatusChip status="online" />}
                    sx={{ px: 0 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>{d.avatar}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={d.name}
                      secondary={`${d.zone} · ${d.vehicle.split('·')[0].trim()}`}
                    />
                  </ListItem>
                ))}
                {onlineDrivers.length === 0 && (
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No drivers online right now.
                  </Typography>
                )}
              </List>
              <Button fullWidth variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/drivers')}>
                View all drivers
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Attention needed */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <WarningAmberIcon />
                </Avatar>
              }
              title="Attention needed"
              subheader={`${attention.length} items require action`}
            />
            <CardContent sx={{ pt: 0 }}>
              <Stack divider={<Divider flexItem />} spacing={1.5}>
                {attention.map((a) => (
                  <Box
                    key={a.id + a.title}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                  >
                    <CircleIcon sx={{ fontSize: 12, color: a.color }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {a.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {a.detail}
                      </Typography>
                    </Box>
                    <Button size="small" variant="text" onClick={a.action}>
                      {a.cta}
                    </Button>
                  </Box>
                ))}
                {attention.length === 0 && (
                  <Typography color="text.secondary">All clear — nothing needs attention.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue by zone */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Revenue by zone" subheader="This month" />
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueByZone} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f6" />
                  <XAxis dataKey="zone" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v) => currency(v)} />
                  <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Rider earnings */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 1, mb: -0.5 }}>
            Rider Earnings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Based on completed (delivered) orders. Famo retains a 10% platform fee — riders keep the remaining 90%.
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard
            title="Overall rider earnings (gross)"
            value={earningsLoading ? '…' : currency(overallGross)}
            icon={<AccountBalanceWalletIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StatCard
            title="Overall after 10% platform fee (net)"
            value={earningsLoading ? '…' : currency(overallNet)}
            icon={<PercentIcon />}
            color="success.main"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title="Earnings by rider"
              subheader={earningsLoading ? 'Loading…' : `${riderEarnings.length} rider${riderEarnings.length !== 1 ? 's' : ''} with completed orders`}
            />
            <CardContent sx={{ pt: 0 }}>
              {earningsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
              ) : riderEarnings.length === 0 ? (
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
                      <TableCell align="right">
                        {riderEarnings.reduce((s, r) => s + r.completedOrders, 0).toLocaleString()}
                      </TableCell>
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
