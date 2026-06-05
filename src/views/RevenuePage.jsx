'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PaidIcon from '@mui/icons-material/Paid';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ShowChartIcon from '@mui/icons-material/ShowChart';

import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { currency } from '../components/StatusChip';
import { revenueByService, revenueByZone, revenueByMonth } from '../data/dummyData';

const COLORS = ['#4f46e5', '#0ea5e9', '#16a34a', '#f59e0b', '#dc2626'];

export default function RevenuePage() {
  const totalRevenue = revenueByService.reduce((s, r) => s + r.value, 0);
  const totalOrders = revenueByMonth.at(-1).orders;
  const avgOrder = totalRevenue / (totalOrders || 1);

  return (
    <Box>
      <PageHeader title="Revenue" subtitle="Breakdown by service type and zone with growth indicators." />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="Total revenue (MTD)"
            value={currency(totalRevenue)}
            trend={9.8}
            icon={<PaidIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="Orders this month"
            value={totalOrders.toLocaleString()}
            trend={5.3}
            icon={<ReceiptLongIcon />}
            color="secondary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="Avg order value"
            value={currency(avgOrder)}
            trend={2.1}
            icon={<ShowChartIcon />}
            color="success.main"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Revenue by service type" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByService}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {revenueByService.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => currency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Monthly revenue vs orders" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByMonth} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f6" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v) => currency(v)} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title="Revenue by zone" subheader="With month-over-month growth" />
            <CardContent sx={{ pt: 0 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                    <TableCell>Zone</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Growth</TableCell>
                    <TableCell align="right">Share</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenueByZone.map((z) => {
                    const up = z.growth >= 0;
                    return (
                      <TableRow key={z.zone} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{z.zone}</TableCell>
                        <TableCell align="right">{currency(z.revenue)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                            {up ? (
                              <TrendingUpIcon fontSize="small" color="success" />
                            ) : (
                              <TrendingDownIcon fontSize="small" color="error" />
                            )}
                            <Typography
                              variant="body2"
                              sx={{ color: up ? 'success.main' : 'error.main', fontWeight: 600 }}
                            >
                              {up ? '+' : ''}
                              {z.growth}%
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          {((z.revenue / revenueByZone.reduce((s, x) => s + x.revenue, 0)) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
