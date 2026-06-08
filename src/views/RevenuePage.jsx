'use client';

import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PercentIcon from '@mui/icons-material/Percent';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';

import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { currency } from '../components/StatusChip';

const PLATFORM_CUT = 0.10; // Famo keeps 10% of every completed delivery

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function RevenuePage() {
  /* ── real rider earnings, derived from delivered orders ── */
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
        phone: o.rider.phone_number,
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

  return (
    <Box>
      <PageHeader title="Revenue" subtitle="Rider earnings breakdown, based on real completed-delivery data." />

      <Grid container spacing={2.5}>
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
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.name}</Typography>
                              {r.phone && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{r.phone}</Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{r.completedOrders.toLocaleString()}</TableCell>
                        <TableCell align="right">{currency(r.gross)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{currency(r.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {riderEarnings.length > 0 && (
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
                  )}
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
