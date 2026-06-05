'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ImageIcon from '@mui/icons-material/Image';

import PageHeader from '../components/PageHeader';

const DOC_KEYS = [
  { key: 'license_front', label: 'License — Front' },
  { key: 'license_back', label: 'License — Back' },
  { key: 'selfie', label: 'Selfie' },
  { key: 'selfie_with_license', label: 'Selfie with License' },
];

function initials(name) {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function ApprovalsPage() {
  const [riders, setRiders] = useState([]);
  const [docUrls, setDocUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/riders?status=pending_approval');
      const data = await res.json();
      if (res.ok) {
        setRiders(data);
        data.forEach((rider) => {
          fetch(`/api/riders/${rider.id}/signed-urls`)
            .then((r) => r.json())
            .then((urls) => setDocUrls((prev) => ({ ...prev, [rider.id]: urls })));
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  const updateStatus = async (riderId, status) => {
    setActing(riderId);
    try {
      const res = await fetch(`/api/riders/${riderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRiders((prev) => prev.filter((r) => r.id !== riderId));
        setToast({
          open: true,
          msg: `Rider ${status === 'approved' ? 'approved' : 'rejected'} successfully.`,
          severity: status === 'approved' ? 'success' : 'warning',
        });
      } else {
        setToast({ open: true, msg: 'Action failed. Please try again.', severity: 'error' });
      }
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="Rider Approvals" subtitle="Loading…" />
        <Grid container spacing={3}>
          {[1, 2].map((n) => (
            <Grid size={{ xs: 12, lg: 6 }} key={n}>
              <Skeleton variant="rounded" height={420} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Rider Approvals"
        subtitle={
          riders.length === 0
            ? 'No riders pending approval'
            : `${riders.length} rider${riders.length !== 1 ? 's' : ''} awaiting review`
        }
      />

      {riders.length === 0 ? (
        <Alert severity="success" sx={{ mt: 1 }}>
          You're all caught up — no riders pending approval.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {riders.map((rider) => {
            const urls = docUrls[rider.id];
            const urlsLoaded = !!urls;
            return (
              <Grid size={{ xs: 12, lg: 6 }} key={rider.id}>
                <Card sx={{ display: 'flex', flexDirection: 'column' }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'warning.main', width: 44, height: 44, fontWeight: 700 }}>
                        {initials(rider.full_name)}
                      </Avatar>
                    }
                    title={
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {rider.full_name}
                      </Typography>
                    }
                    subheader={
                      <Chip size="small" label="Pending Approval" color="warning" variant="outlined" sx={{ mt: 0.5 }} />
                    }
                  />

                  <CardContent sx={{ pt: 0, flex: 1 }}>
                    {/* Rider info */}
                    <Stack spacing={0.75} sx={{ mb: 2.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{rider.email || '—'}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{rider.phone_number || '—'}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TwoWheelerIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {[rider.vehicle_type, rider.vehicle_brand, rider.vehicle_model]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                          {rider.vehicle_plate ? `  ·  ${rider.vehicle_plate}` : ''}
                        </Typography>
                      </Stack>
                      {(rider.payout_bank || rider.payout_account_number) && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AccountBalanceIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {rider.payout_bank || '—'}
                            {rider.payout_account_number ? ` · ${rider.payout_account_number}` : ''}
                            {rider.payout_bvn ? ` · BVN: ${rider.payout_bvn}` : ''}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    {/* Documents */}
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1.5, fontWeight: 700 }}
                    >
                      Documents
                    </Typography>

                    <Grid container spacing={1.5}>
                      {DOC_KEYS.map(({ key, label }) => (
                        <Grid size={{ xs: 6 }} key={key}>
                          <Box
                            onClick={() => urlsLoaded && urls[key] && setPreview({ url: urls[key], label })}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 2,
                              overflow: 'hidden',
                              aspectRatio: '4/3',
                              bgcolor: 'grey.50',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: urlsLoaded && urls[key] ? 'pointer' : 'default',
                              transition: 'opacity 0.15s',
                              '&:hover': urlsLoaded && urls[key] ? { opacity: 0.8 } : {},
                            }}
                          >
                            {!urlsLoaded ? (
                              <Skeleton variant="rectangular" width="100%" height="100%" />
                            ) : urls[key] ? (
                              <Box
                                component="img"
                                src={urls[key]}
                                alt={label}
                                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                            ) : (
                              <Stack alignItems="center" spacing={0.5}>
                                <ImageIcon color="disabled" />
                                <Typography variant="caption" color="text.disabled">Not uploaded</Typography>
                              </Stack>
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
                          >
                            {label}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>

                  <Divider />
                  <CardActions sx={{ p: 2, gap: 1.5 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      disabled={acting === rider.id}
                      onClick={() => updateStatus(rider.id, 'approved')}
                      sx={{ flex: 1 }}
                    >
                      {acting === rider.id ? <CircularProgress size={18} color="inherit" /> : 'Approve'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      disabled={acting === rider.id}
                      onClick={() => updateStatus(rider.id, 'rejected')}
                      sx={{ flex: 1 }}
                    >
                      Reject
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Full-size image preview */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#000', minHeight: 300 }}>
          <IconButton
            onClick={() => setPreview(null)}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.55)',
              color: '#fff',
              zIndex: 10,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          {preview && (
            <Box
              component="img"
              src={preview.url}
              alt={preview.label}
              sx={{ display: 'block', width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
          {preview && (
            <Typography
              variant="caption"
              sx={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.7)', py: 1 }}
            >
              {preview.label}
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          sx={{ width: '100%' }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
