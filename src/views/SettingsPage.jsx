'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';

import SaveIcon from '@mui/icons-material/Save';

import PageHeader from '../components/PageHeader';
import { currency } from '../components/StatusChip';

const SIZES = [5, 10, 15, 20];
const EXAMPLE_KM = 5;

export default function SettingsPage() {
  // Keyed by size: { [size]: { base_price, per_km_price } }.
  const [pricing, setPricing] = useState({});
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setPricingLoading(true);
      try {
        const res = await fetch('/api/settings/pricing');
        const data = await res.json();
        if (active && res.ok) {
          const next = {};
          for (const row of data.sizes || []) {
            next[row.size] = { base_price: row.base_price, per_km_price: row.per_km_price };
          }
          setPricing(next);
        }
      } finally {
        if (active) setPricingLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const updatePricing = (size, key) => (e) =>
    setPricing((p) => ({ ...p, [size]: { ...p[size], [key]: e.target.value } }));

  const savePricing = async () => {
    setPricingSaving(true);
    try {
      const res = await fetch('/api/settings/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sizes: SIZES.map((size) => ({
            size,
            base_price: Number(pricing[size]?.base_price),
            per_km_price: Number(pricing[size]?.per_km_price),
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const next = {};
        for (const row of data.sizes || []) {
          next[row.size] = { base_price: row.base_price, per_km_price: row.per_km_price };
        }
        setPricing(next);
        setToast('Pricing saved — riders and users will see the new fares immediately.');
      } else {
        setToast(data.error || 'Failed to save pricing.');
      }
    } finally {
      setPricingSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Live per-package-size pricing controls."
        action={
          <Button
            variant="contained"
            startIcon={pricingSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={savePricing}
            disabled={pricingLoading || pricingSaving}
          >
            Save changes
          </Button>
        }
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ maxWidth: { md: 980 } }}>
            <CardHeader
              title="Package pricing"
              subheader="Set a fare for each package size. Applies instantly across the admin panel, rider app and user app. Fare = base + per-km × distance (set per-km to 0 for a flat fare)."
            />
            <CardContent>
              {pricingLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <Grid container spacing={2.5}>
                  {SIZES.map((size) => {
                    const row = pricing[size] || {};
                    const example = Number(row.base_price || 0) + Number(row.per_km_price || 0) * EXAMPLE_KM;
                    return (
                      <Grid key={size} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                          <Stack spacing={2}>
                            <Typography variant="subtitle1" fontWeight={700}>
                              Size {size}
                            </Typography>
                            <TextField
                              label="Base price"
                              type="number"
                              size="small"
                              value={row.base_price ?? ''}
                              onChange={updatePricing(size, 'base_price')}
                              InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                            />
                            <TextField
                              label="Per-km price"
                              type="number"
                              size="small"
                              value={row.per_km_price ?? ''}
                              onChange={updatePricing(size, 'per_km_price')}
                              InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                            />
                            <Divider />
                            <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                A {EXAMPLE_KM} km trip costs
                              </Typography>
                              <Typography variant="h6">{currency(example)}</Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
