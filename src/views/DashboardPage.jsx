'use client';

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

export default function DashboardPage() {
  const router = useRouter();
  const navigate = (href) => router.push(href);

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
      </Grid>
    </Box>
  );
}
