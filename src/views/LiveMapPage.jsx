'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import PageHeader from '../components/PageHeader';
import { drivers, orders } from '../data/dummyData';

export default function LiveMapPage() {
  const onlineDrivers = drivers.filter((d) => d.online);
  const [selected, setSelected] = useState(onlineDrivers[0]?.id || null);

  // Convert lat/lng to a position within the faux map (0-100%).
  const project = (loc) => {
    const x = ((loc.lng + 74.02) / 0.05) * 100;
    const y = (1 - (loc.lat - 40.70) / 0.062) * 100;
    return {
      left: `${Math.min(92, Math.max(5, x))}%`,
      top: `${Math.min(90, Math.max(6, y))}%`,
    };
  };

  const activeOrders = orders.filter((o) => ['assigned', 'in_transit'].includes(o.status));

  return (
    <Box>
      <PageHeader
        title="Live map"
        subtitle="Real-time rider and order tracking with ETAs."
        action={<Chip color="success" label={`${onlineDrivers.length} riders live`} />}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: 1.5 }}>
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 360, md: 560 },
                  borderRadius: 3,
                  overflow: 'hidden',
                  background:
                    'linear-gradient(135deg,#eef2ff 0%,#e0f2fe 100%)',
                  backgroundSize: 'cover',
                }}
              >
                {/* faux streets */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg,#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                    opacity: 0.5,
                  }}
                />
                {/* driver markers */}
                {onlineDrivers.map((d) => {
                  const pos = project(d.location);
                  const isSel = selected === d.id;
                  return (
                    <Tooltip key={d.id} title={`${d.name} · ${d.zone}`} arrow>
                      <Box
                        onClick={() => setSelected(d.id)}
                        sx={{
                          position: 'absolute',
                          ...pos,
                          transform: 'translate(-50%,-50%)',
                          cursor: 'pointer',
                          zIndex: isSel ? 3 : 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: isSel ? 'error.main' : 'primary.main',
                            width: isSel ? 44 : 36,
                            height: isSel ? 44 : 36,
                            border: '3px solid #fff',
                            boxShadow: 3,
                            transition: 'all .15s',
                          }}
                        >
                          <TwoWheelerIcon fontSize="small" />
                        </Avatar>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ mb: 2.5 }}>
            <CardHeader title="Live riders" subheader="Tap to highlight on map" />
            <CardContent sx={{ pt: 0 }}>
              <List dense>
                {onlineDrivers.map((d) => (
                  <ListItemButton
                    key={d.id}
                    selected={selected === d.id}
                    onClick={() => setSelected(d.id)}
                    sx={{ borderRadius: 2 }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>{d.avatar}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={d.name} secondary={`${d.zone} · ${d.plate}`} />
                  </ListItemButton>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Active deliveries" subheader="With live ETAs" />
            <CardContent sx={{ pt: 0 }}>
              <List dense>
                {activeOrders.map((o) => (
                  <Box
                    key={o.id}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}
                  >
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 34, height: 34, fontSize: 13 }}>
                      {o.service[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {o.id} · {o.customer}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {o.driver} → {o.dropoff}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      icon={<AccessTimeIcon />}
                      label={o.eta}
                      color="info"
                      variant="outlined"
                    />
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
