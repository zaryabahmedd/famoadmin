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

export default function SettingsPage() {
  const [pricing, setPricing] = useState({ base_price: '', per_km_price: '' });
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
        if (active && res.ok) setPricing({ base_price: data.base_price, per_km_price: data.per_km_price });
      } finally {
        if (active) setPricingLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const updatePricing = (key) => (e) =>
    setPricing((p) => ({ ...p, [key]: e.target.value }));

  const savePricing = async () => {
    setPricingSaving(true);
    try {
      const res = await fetch('/api/settings/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_price: Number(pricing.base_price),
          per_km_price: Number(pricing.per_km_price),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPricing({ base_price: data.base_price, per_km_price: data.per_km_price });
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
        subtitle="Live pricing controls."
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ maxWidth: { md: 480 } }}>
            <CardHeader
              title="Pricing controls"
              subheader="Applies instantly across the admin panel, rider app and user app"
            />
            <CardContent>
              {pricingLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <Stack spacing={2.5}>
                  <TextField
                    label="Base price"
                    type="number"
                    value={pricing.base_price}
                    onChange={updatePricing('base_price')}
                    InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                  />
                  <TextField
                    label="Per-km price"
                    type="number"
                    value={pricing.per_km_price}
                    onChange={updatePricing('per_km_price')}
                    InputProps={{ startAdornment: <InputAdornment position="start">₦</InputAdornment> }}
                  />
                  <Divider />
                  <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Example: a 5 km trip costs
                    </Typography>
                    <Typography variant="h6">
                      {currency(Number(pricing.base_price || 0) + Number(pricing.per_km_price || 0) * 5)}
                    </Typography>
                  </Box>
                </Stack>
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
