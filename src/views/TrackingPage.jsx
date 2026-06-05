'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import { parcels } from '../data/dummyData';

export default function TrackingPage() {
  const params = useSearchParams();
  const orderParam = params.get('order');
  const initial =
    parcels.find((p) => p.orderId === orderParam)?.id || parcels[0]?.id;
  const [selectedId, setSelectedId] = useState(initial);
  const parcel = parcels.find((p) => p.id === selectedId) || parcels[0];

  return (
    <Box>
      <PageHeader
        title="Parcel tracking"
        subtitle="End-to-end delivery progress for every parcel."
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title="Parcels" subheader={`${parcels.length} tracked`} />
            <CardContent sx={{ pt: 0 }}>
              <List dense>
                {parcels.map((p) => (
                  <ListItemButton
                    key={p.id}
                    selected={p.id === selectedId}
                    onClick={() => setSelectedId(p.id)}
                    sx={{ borderRadius: 2 }}
                  >
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5, width: 34, height: 34 }}>
                      <LocalShippingIcon fontSize="small" />
                    </Avatar>
                    <ListItemText
                      primary={p.id}
                      secondary={`${p.customer} · ${p.orderId}`}
                    />
                    <StatusChip status={p.status} />
                  </ListItemButton>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader
              title={parcel.id}
              subheader={`Linked to ${parcel.orderId}`}
              action={
                <Chip
                  icon={<AccessTimeIcon />}
                  label={parcel.eta}
                  color={parcel.status === 'delivered' ? 'success' : 'info'}
                  sx={{ mt: 1, mr: 1 }}
                />
              }
            />
            <CardContent>
              <Stepper
                activeStep={parcel.currentStage}
                alternativeLabel
                sx={{ mb: 4 }}
              >
                {parcel.stages.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="overline" color="text.secondary">
                    Customer
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      {parcel.customer.split(' ').map((n) => n[0]).join('')}
                    </Avatar>
                    <Typography variant="subtitle1">{parcel.customer}</Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="overline" color="text.secondary">
                    Assigned rider
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {parcel.driver.split(' ').map((n) => n[0]).join('')}
                    </Avatar>
                    <Typography variant="subtitle1">{parcel.driver}</Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="overline" color="text.secondary">
                    Last update
                  </Typography>
                  <Typography variant="body1">{parcel.updatedAt}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
