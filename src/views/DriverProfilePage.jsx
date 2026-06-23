'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import StatusChip, { currency } from '../components/StatusChip';

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function DriverProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [rider, setRider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [ridersRes, ordersRes] = await Promise.all([
          fetch('/api/riders'),
          fetch('/api/orders'),
        ]);
        const [ridersData, ordersData] = await Promise.all([
          ridersRes.json(),
          ordersRes.json(),
        ]);
        if (active) {
          const found = (ridersRes.ok ? ridersData : []).find((r) => r.id === id);
          setRider(found || null);
          setOrders((ordersRes.ok ? ordersData : []).filter((o) => o.rider?.id === id));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>;
  }

  if (!rider) {
    return (
      <Box>
        <Typography variant="h6">Driver not found.</Typography>
        <Button onClick={() => router.push('/drivers')} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to drivers
        </Button>
      </Box>
    );
  }

  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const totalEarnings = deliveredOrders.reduce((s, o) => s + (Number(o.price) || 0), 0);
  const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href="/drivers" underline="hover" color="inherit">Drivers</Link>
        <Typography color="text.primary">{rider.full_name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontSize: 32, mx: 'auto', mb: 2 }}>
                {initials(rider.full_name)}
              </Avatar>
              <Typography variant="h6">{rider.full_name}</Typography>
              <StatusChip status={rider.status} />
              <Divider sx={{ my: 2 }} />
              <List dense sx={{ textAlign: 'left' }}>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><PhoneIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={rider.phone_number || '—'} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><EmailIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={rider.email || '—'} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><TwoWheelerIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={[rider.vehicle_brand, rider.vehicle_model].filter(Boolean).join(' ') || '—'} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><BadgeIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={rider.vehicle_plate || '—'} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><CalendarMonthIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={`Joined ${fmtDate(rider.created_at)}`} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Total orders</Typography>
                <Typography variant="h5">{orders.length}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Delivered</Typography>
                <Typography variant="h5">{deliveredOrders.length}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Total earnings</Typography>
                <Typography variant="h5">{currency(totalEarnings)}</Typography>
              </CardContent></Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader title="Recent orders" subheader={`${orders.length} total`} />
                <CardContent sx={{ pt: 0 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                        <TableCell>Customer</TableCell>
                        <TableCell>Pickup</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.slice(0, 20).map((o) => (
                        <TableRow key={o.id} hover>
                          <TableCell>{o.user?.full_name || '—'}</TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" noWrap>{o.pickup_address || '—'}</Typography>
                          </TableCell>
                          <TableCell align="right">{currency(o.price)}</TableCell>
                          <TableCell align="right"><StatusChip status={o.status} /></TableCell>
                        </TableRow>
                      ))}
                      {orders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>No orders yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
