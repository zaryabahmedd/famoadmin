'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

import PageHeader from '../components/PageHeader';

const TAB_MAP = ['pending', 'approved', 'rejected'];

// Drivers and customers live in separate tables; `type` picks which one the API reads.
const AUDIENCES = [
  { value: 'rider', label: 'Drivers', noun: 'driver' },
  { value: 'user', label: 'Customers', noun: 'customer' },
];

function DiffField({ label, current, requested }) {
  const changed = requested != null && requested !== current;
  return (
    <Box sx={{ py: 0.75 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
        <Typography
          variant="body2"
          sx={{
            color: changed ? 'text.secondary' : 'text.primary',
            textDecoration: changed ? 'line-through' : 'none',
            wordBreak: 'break-word',
          }}
        >
          {current || '—'}
        </Typography>
        {changed && (
          <>
            <ArrowRightAltIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', wordBreak: 'break-word' }}>
              {requested}
            </Typography>
          </>
        )}
      </Stack>
    </Box>
  );
}

function AvatarDiff({ currentUrl, requestedUrl }) {
  const changed = requestedUrl != null && requestedUrl !== currentUrl;
  if (!changed) return null;
  return (
    <Box sx={{ py: 0.75 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Avatar
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.5 }}>
        <Avatar src={currentUrl || undefined} sx={{ width: 48, height: 48, opacity: 0.5, border: '2px solid', borderColor: 'divider' }} />
        <ArrowRightAltIcon fontSize="small" color="primary" />
        <Avatar src={requestedUrl || undefined} sx={{ width: 48, height: 48, border: '2px solid', borderColor: 'primary.main' }} />
      </Stack>
    </Box>
  );
}

function RequestCard({ req, isPending, onApprove, onReject, acting }) {
  const user = req.owner;
  const requestedAt = new Date(req.requested_at).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={user?.avatar_url || undefined} sx={{ width: 48, height: 48, bgcolor: 'secondary.main' }}>
              {(user?.full_name || '?')[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{user?.full_name || '—'}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={req.status} color={req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : 'error'} />
            <Typography variant="caption" color="text.secondary">{requestedAt}</Typography>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.8, mb: 1, display: 'block' }}>
          Requested changes
        </Typography>

        <Stack spacing={0.5}>
          <DiffField label="Full name" current={user?.full_name} requested={req.full_name} />
          <DiffField label="Phone" current={user?.phone_number} requested={req.phone_number} />
          <AvatarDiff currentUrl={user?.avatar_url} requestedUrl={req.avatar_url} />
        </Stack>

        {req.status === 'rejected' && req.rejection_reason && (
          <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>
            <strong>Rejection reason:</strong> {req.rejection_reason}
          </Alert>
        )}

        {req.reviewed_at && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            Reviewed {new Date(req.reviewed_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {req.reviewed_by ? ` by ${req.reviewed_by}` : ''}
          </Typography>
        )}

        {isPending && (
          <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              disabled={!!acting}
              onClick={() => onApprove(req.id)}
            >
              {acting === req.id ? <CircularProgress size={18} color="inherit" /> : 'Approve'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              disabled={!!acting}
              onClick={() => onReject(req.id)}
            >
              Reject
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfileApprovalsPage() {
  const [tab, setTab] = useState(0);
  const [audience, setAudience] = useState('rider');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');

  const status = TAB_MAP[tab];
  const noun = AUDIENCES.find((a) => a.value === audience)?.noun || '';

  const fetchRequests = useCallback(async (s, type) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile-approvals?status=${s}&type=${type}`);
      const data = await res.json();
      setRequests(res.ok && Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(status, audience); }, [status, audience, fetchRequests]);

  const handleApprove = useCallback(async (id) => {
    setActing(id);
    try {
      const res = await fetch(`/api/profile-approvals/${id}/approve?type=${audience}`, { method: 'POST' });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setToast({ open: true, msg: 'Profile change approved.', severity: 'success' });
      } else {
        const body = await res.json().catch(() => ({}));
        setToast({ open: true, msg: body.error || 'Approve failed.', severity: 'error' });
      }
    } finally {
      setActing(null);
    }
  }, [audience]);

  const openRejectDialog = useCallback((id) => {
    setRejectDialog({ open: true, id });
    setRejectReason('');
  }, []);

  const handleReject = useCallback(async () => {
    const { id } = rejectDialog;
    if (!rejectReason.trim()) return;
    setActing(id);
    setRejectDialog({ open: false, id: null });
    try {
      const res = await fetch(`/api/profile-approvals/${id}/reject?type=${audience}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setToast({ open: true, msg: 'Profile change rejected.', severity: 'warning' });
      } else {
        const body = await res.json().catch(() => ({}));
        setToast({ open: true, msg: body.error || 'Reject failed.', severity: 'error' });
      }
    } finally {
      setActing(null);
    }
  }, [rejectDialog, rejectReason, audience]);

  return (
    <Box>
      <PageHeader
        title="Profile Approvals"
        subtitle={loading ? 'Loading…' : `${requests.length} ${status} ${noun} request${requests.length !== 1 ? 's' : ''}`}
      />

      <ToggleButtonGroup
        exclusive
        size="small"
        value={audience}
        onChange={(_, v) => { if (v) setAudience(v); }}
        sx={{ mb: 2 }}
      >
        {AUDIENCES.map((a) => (
          <ToggleButton key={a.value} value={a.value} sx={{ px: 2.5, textTransform: 'none', fontWeight: 600 }}>
            {a.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : requests.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">No {status} {noun} requests.</Typography>
        </Card>
      ) : (
        requests.map((req) => (
          <RequestCard
            key={req.id}
            req={req}
            isPending={status === 'pending'}
            onApprove={handleApprove}
            onReject={openRejectDialog}
            acting={acting}
          />
        ))
      )}

      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, id: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Reject profile change</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" color="error" disabled={!rejectReason.trim()} onClick={handleReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))} sx={{ width: '100%' }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
