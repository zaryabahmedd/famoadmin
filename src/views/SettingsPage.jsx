'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';

import SaveIcon from '@mui/icons-material/Save';

import PageHeader from '../components/PageHeader';
import { defaultSettings } from '../data/dummyData';

const featureLabels = {
  liveTracking: 'Live order tracking',
  scheduledDeliveries: 'Scheduled deliveries',
  cashOnDelivery: 'Cash on delivery',
  inAppChat: 'In-app chat',
  driverRatings: 'Driver ratings',
  surgePricing: 'Surge pricing',
  promoCodes: 'Promo codes',
  autoAssignDrivers: 'Auto-assign drivers',
};

export default function SettingsPage() {
  const [pricing, setPricing] = useState({
    baseFare: defaultSettings.baseFare,
    perKmRate: defaultSettings.perKmRate,
    commissionPct: defaultSettings.commissionPct,
    minimumFare: defaultSettings.minimumFare,
  });
  const [features, setFeatures] = useState(defaultSettings.features);
  const [toast, setToast] = useState('');

  const updatePricing = (key) => (e) =>
    setPricing((p) => ({ ...p, [key]: e.target.value }));

  const toggleFeature = (key) => (e) =>
    setFeatures((f) => ({ ...f, [key]: e.target.checked }));

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Live pricing controls and feature toggles."
        action={
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => setToast('Settings saved.')}>
            Save changes
          </Button>
        }
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title="Pricing controls" subheader="Applies to all new orders" />
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  label="Base fare"
                  type="number"
                  value={pricing.baseFare}
                  onChange={updatePricing('baseFare')}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
                <TextField
                  label="Per-km rate"
                  type="number"
                  value={pricing.perKmRate}
                  onChange={updatePricing('perKmRate')}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
                <TextField
                  label="Minimum fare"
                  type="number"
                  value={pricing.minimumFare}
                  onChange={updatePricing('minimumFare')}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
                <TextField
                  label="Platform commission"
                  type="number"
                  value={pricing.commissionPct}
                  onChange={updatePricing('commissionPct')}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
                <Divider />
                <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Example: a 5 km trip costs
                  </Typography>
                  <Typography variant="h6">
                    $
                    {Math.max(
                      Number(pricing.minimumFare),
                      Number(pricing.baseFare) + Number(pricing.perKmRate) * 5
                    ).toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader title="Feature toggles" subheader="Turn major features on or off" />
            <CardContent>
              <Stack divider={<Divider flexItem />}>
                {Object.keys(features).map((key) => (
                  <FormControlLabel
                    key={key}
                    sx={{ justifyContent: 'space-between', ml: 0, py: 0.5 }}
                    labelPlacement="start"
                    control={
                      <Switch checked={features[key]} onChange={toggleFeature(key)} />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {featureLabels[key]}
                      </Typography>
                    }
                  />
                ))}
              </Stack>
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
