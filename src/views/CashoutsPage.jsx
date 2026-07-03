'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';

import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import PaidIcon from '@mui/icons-material/Paid';

import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusChip, { currency } from '../components/StatusChip';

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function CashoutsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [confirm, setConfirm] = useState(null); // { row, action: 'approve' | 'reject' }
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { severity, message }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cashouts');
      const data = await res.json();
      if (res.ok) setRows(data);
      else setToast({ severity: 'error', message: data.error || 'Failed to load cash-out requests.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  }), [rows]);

  const pendingTotal = useMemo(
    () => rows.filter((r) => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0),
    [rows]
  );
  const paidTotal = useMemo(
    () => rows.filter((r) => r.status === 'approved').reduce((s, r) => s + Number(r.amount), 0),
    [rows]
  );

  const visible = tab === 'all' ? rows : rows.filter((r) => r.status === tab);

  const openConfirm = (row, action) => { setReason(''); setConfirm({ row, action }); };

  const submitDecision = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/cashouts/${confirm.row.id}/${confirm.action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: confirm.action === 'reject' ? JSON.stringify({ reason }) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setToast({
          severity: 'success',
          message: confirm.action === 'approve'
            ? `Payout of ${currency(confirm.row.amount)} to ${confirm.row.rider_name} approved.`
            : `Request from ${confirm.row.rider_name} rejected.`,
        });
        setConfirm(null);
        await load();
      } else {
        setToast({ severity: 'error', message: data.error || 'Action failed.' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Cash-Out Requests"
        subtitle="Driver payout requests. Transfer the funds manually, then approve — approval deducts the amount from the driver's balance and starts their 7-day waiting period."
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="Pending requests"
            value={loading ? '…' : counts.pending.toLocaleString()}
            icon={<HourglassTopIcon />}
            color="warning.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="Pending amount"
            value={loading ? '…' : currency(pendingTotal)}
            icon={<AccountBalanceWalletIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title="Total paid out"
            value={loading ? '…' : currency(paidTotal)}
            icon={<PaidIcon />}
            color="success.main"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title="Requests"
              subheader={loading ? 'Loading…' : `${rows.length} total`}
              action={
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 40 }}>
                  <Tab value="pending" label={`Pending (${counts.pending})`} sx={{ minHeight: 40 }} />
                  <Tab value="approved" label={`Approved (${counts.approved})`} sx={{ minHeight: 40 }} />
                  <Tab value="rejected" label={`Rejected (${counts.rejected})`} sx={{ minHeight: 40 }} />
                  <Tab value="all" label="All" sx={{ minHeight: 40 }} />
                </Tabs>
              }
            />
            <CardContent sx={{ pt: 0, overflowX: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
              ) : visible.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1 }}>
                  <AccountBalanceWalletIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                  <Typography color="text.secondary">
                    {tab === 'pending' ? 'No pending cash-out requests.' : 'No requests in this category.'}
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap' } }}>
                      <TableCell>Driver</TableCell>
                      <TableCell align="right">Requested</TableCell>
                      <TableCell align="right">Available balance</TableCell>
                      <TableCell>Bank details</TableCell>
                      <TableCell>Requested at</TableCell>
                      <TableCell>Last payout</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visible.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: 13, fontWeight: 700 }}>
                              {initials(r.rider_name)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{r.rider_name}</Typography>
                              {r.rider_phone && (
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                  {r.rider_phone}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{currency(r.amount)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={`Balance when requested: ${currency(r.available_at_request)}`}>
                            <span>{currency(r.available_balance)}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {r.payout_bank || r.payout_account_number ? (
                            <Box>
                              <Typography variant="body2" noWrap>{r.payout_bank || '—'}</Typography>
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                {r.payout_account_number || ''}
                              </Typography>
                            </Box>
                          ) : '—'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDateTime(r.requested_at)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDateTime(r.last_payout_at)}</TableCell>
                        <TableCell>
                          <StatusChip status={r.status} />
                          {r.status === 'rejected' && r.reject_reason && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {r.reject_reason}
                            </Typography>
                          )}
                          {r.status !== 'pending' && r.decided_by && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              by {r.decided_by} · {fmtDateTime(r.decided_at)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          {r.status === 'pending' ? (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => openConfirm(r, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => openConfirm(r, 'reject')}
                              >
                                Reject
                              </Button>
                            </Stack>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={!!confirm} onClose={() => !busy && setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirm?.action === 'approve' ? 'Approve payout' : 'Reject request'}
        </DialogTitle>
        <DialogContent>
          {confirm?.action === 'approve' ? (
            <DialogContentText>
              Confirm that you have already transferred <strong>{currency(confirm?.row.amount)}</strong> to{' '}
              <strong>{confirm?.row.rider_name}</strong>
              {confirm?.row.payout_bank ? ` (${confirm.row.payout_bank} · ${confirm.row.payout_account_number || ''})` : ''}.
              Approving deducts this amount from their available earnings and starts their 7-day waiting period.
              This cannot be undone.
            </DialogContentText>
          ) : (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Reject the {currency(confirm?.row.amount)} request from <strong>{confirm?.row.rider_name}</strong>?
                Their earnings will remain unchanged and they can submit a new request.
              </DialogContentText>
              <TextField
                fullWidth
                label="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                minRows={2}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)} disabled={busy}>Cancel</Button>
          <Button
            variant="contained"
            color={confirm?.action === 'approve' ? 'success' : 'error'}
            onClick={submitDecision}
            disabled={busy}
          >
            {busy ? <CircularProgress size={18} color="inherit" /> : (confirm?.action === 'approve' ? 'Approve payout' : 'Reject')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? <Alert severity={toast.severity} onClose={() => setToast(null)}>{toast.message}</Alert> : null}
      </Snackbar>
    </Box>
  );
}
