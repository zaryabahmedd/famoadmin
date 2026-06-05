'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Snackbar from '@mui/material/Snackbar';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DoneAllIcon from '@mui/icons-material/DoneAll';

import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusChip, { currency } from '../components/StatusChip';
import { payouts as seedPayouts } from '../data/dummyData';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState(seedPayouts);
  const [toast, setToast] = useState('');

  const pending = payouts.filter((p) => p.status === 'pending');
  const pendingTotal = pending.reduce((s, p) => s + p.net, 0);
  const totalCommission = payouts.reduce((s, p) => s + p.commission, 0);

  const processOne = (id) => {
    setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'processed' } : p)));
    setToast('Payout processed.');
  };

  const processAll = () => {
    setPayouts((prev) => prev.map((p) => ({ ...p, status: 'processed' })));
    setToast(`Processed ${pending.length} payouts (${currency(pendingTotal)}).`);
  };

  return (
    <Box>
      <PageHeader
        title="Driver payouts"
        subtitle="Individual payout queue with commission deducted."
        action={
          <Button
            variant="contained"
            startIcon={<DoneAllIcon />}
            disabled={pending.length === 0}
            onClick={processAll}
          >
            Process all ({pending.length})
          </Button>
        }
      />

      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="Pending payout total"
            value={currency(pendingTotal)}
            icon={<AccountBalanceWalletIcon />}
            color="warning.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="Drivers in queue"
            value={pending.length}
            icon={<AccountBalanceWalletIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="Commission collected"
            value={currency(totalCommission)}
            icon={<AccountBalanceWalletIcon />}
            color="success.main"
          />
        </Grid>
      </Grid>

      <Card sx={{ mt: 1.5 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700 } }}>
                  <TableCell>Driver</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Deliveries</TableCell>
                  <TableCell align="right">Gross</TableCell>
                  <TableCell align="right">Commission</TableCell>
                  <TableCell align="right">Net payout</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 13 }}>
                          {p.driver.split(' ').map((n) => n[0]).join('')}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {p.driver}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{p.period}</TableCell>
                    <TableCell align="right">{p.deliveries}</TableCell>
                    <TableCell align="right">{currency(p.gross)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      -{currency(p.commission)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {currency(p.net)}
                    </TableCell>
                    <TableCell align="center">
                      <StatusChip status={p.status} />
                    </TableCell>
                    <TableCell align="right">
                      {p.status === 'pending' ? (
                        <Button size="small" variant="contained" onClick={() => processOne(p.id)}>
                          Process
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Paid
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Snackbar
        open={!!toast}
        autoHideDuration={2500}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
