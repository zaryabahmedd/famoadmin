'use client';

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
import Rating from '@mui/material/Rating';
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

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import BadgeIcon from '@mui/icons-material/Badge';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DescriptionIcon from '@mui/icons-material/Description';

import StatusChip, { currency } from '../components/StatusChip';
import { drivers, orders } from '../data/dummyData';

export default function DriverProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const navigate = (href) => router.push(href);
  const driver = drivers.find((d) => d.id === id);

  if (!driver) {
    return (
      <Box>
        <Typography variant="h6">Driver not found.</Typography>
        <Button onClick={() => navigate('/drivers')} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to drivers
        </Button>
      </Box>
    );
  }

  const driverOrders = orders.filter((o) => o.driverId === driver.id);
  const allDocsApproved = driver.docs.every((d) => d.status === 'approved');

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href="/drivers" underline="hover" color="inherit">
          Drivers
        </Link>
        <Typography color="text.primary">{driver.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={2.5}>
        {/* Profile card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontSize: 32, mx: 'auto', mb: 2 }}
              >
                {driver.avatar}
              </Avatar>
              <Typography variant="h6">{driver.name}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {driver.id}
              </Typography>
              <StatusChip status={driver.status} />
              {driver.rating > 0 && (
                <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 2 }}>
                  <Rating value={driver.rating} precision={0.1} readOnly size="small" />
                  <Typography variant="body2">{driver.rating}</Typography>
                </Stack>
              )}
              <Divider sx={{ my: 2 }} />
              <List dense sx={{ textAlign: 'left' }}>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><PhoneIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={driver.phone} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><EmailIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={driver.email} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><TwoWheelerIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={driver.vehicle} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><BadgeIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={`Plate ${driver.plate}`} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><PlaceIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={`${driver.zone} zone`} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><CalendarMonthIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={`Joined ${driver.joinedOn}`} />
                </ListItem>
              </List>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button fullWidth variant="outlined" onClick={() => navigate('/approvals')}>
                  Documents
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color={driver.status === 'blocked' ? 'success' : 'error'}
                >
                  {driver.status === 'blocked' ? 'Unblock' : 'Block'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Deliveries</Typography>
                <Typography variant="h5">{driver.deliveries}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">This month</Typography>
                <Typography variant="h5">{currency(driver.earningsMonth)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Rating</Typography>
                <Typography variant="h5">{driver.rating || '—'}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Docs</Typography>
                <Typography variant="h5" color={allDocsApproved ? 'success.main' : 'warning.main'}>
                  {driver.docs.filter((d) => d.status === 'approved').length}/{driver.docs.length}
                </Typography>
              </CardContent></Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader title="Submitted documents" subheader="Uploaded by the driver" />
                <CardContent sx={{ pt: 0 }}>
                  <List>
                    {driver.docs.map((doc) => (
                      <ListItem
                        key={doc.type}
                        secondaryAction={<StatusChip status={doc.status} />}
                        sx={{ borderBottom: '1px solid #f1f5f9' }}
                      >
                        <ListItemIcon><DescriptionIcon /></ListItemIcon>
                        <ListItemText primary={doc.type} secondary={`Uploaded ${doc.uploaded}`} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader title="Recent jobs" subheader={`${driverOrders.length} total`} />
                <CardContent sx={{ pt: 0 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                        <TableCell>Order</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {driverOrders.map((o) => (
                        <TableRow key={o.id} hover>
                          <TableCell>{o.id}</TableCell>
                          <TableCell>{o.customer}</TableCell>
                          <TableCell>{o.service}</TableCell>
                          <TableCell align="right">{currency(o.amount)}</TableCell>
                          <TableCell align="right"><StatusChip status={o.status} /></TableCell>
                        </TableRow>
                      ))}
                      {driverOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                            No jobs yet.
                          </TableCell>
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
