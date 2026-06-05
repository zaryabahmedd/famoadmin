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
import PlaceIcon from '@mui/icons-material/Place';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import StatusChip, { currency } from '../components/StatusChip';
import { customers, orders } from '../data/dummyData';

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const navigate = (href) => router.push(href);
  const user = customers.find((c) => c.id === id);

  if (!user) {
    return (
      <Box>
        <Typography variant="h6">Customer not found.</Typography>
        <Button onClick={() => navigate('/users')} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to users
        </Button>
      </Box>
    );
  }

  const userOrders = orders.filter((o) => o.customerId === user.id);

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={NextLink} href="/users" underline="hover" color="inherit">
          Users
        </Link>
        <Typography color="text.primary">{user.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{ width: 88, height: 88, bgcolor: 'secondary.main', fontSize: 32, mx: 'auto', mb: 2 }}
              >
                {user.avatar}
              </Avatar>
              <Typography variant="h6">{user.name}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.id}
              </Typography>
              <StatusChip status={user.status} />
              <Divider sx={{ my: 2 }} />
              <List dense sx={{ textAlign: 'left' }}>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><PhoneIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={user.phone} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><EmailIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={user.email} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><PlaceIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={`${user.zone} zone`} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}><CalendarMonthIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary={`Joined ${user.joinedOn}`} />
                </ListItem>
              </List>
              <Button
                fullWidth
                variant="contained"
                color={user.status === 'suspended' ? 'success' : 'error'}
                sx={{ mt: 1 }}
              >
                {user.status === 'suspended' ? 'Reactivate account' : 'Suspend account'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Lifetime orders</Typography>
                <Typography variant="h5">{user.orders}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Total spend</Typography>
                <Typography variant="h5">{currency(user.totalSpend)}</Typography>
              </CardContent></Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card><CardContent>
                <Typography variant="caption" color="text.secondary">Avg order value</Typography>
                <Typography variant="h5">
                  {currency(user.orders ? user.totalSpend / user.orders : 0)}
                </Typography>
              </CardContent></Card>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader title="Order history" subheader={`${userOrders.length} recent orders`} />
                <CardContent sx={{ pt: 0 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                        <TableCell>Order</TableCell>
                        <TableCell>Driver</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userOrders.map((o) => (
                        <TableRow key={o.id} hover>
                          <TableCell>{o.id}</TableCell>
                          <TableCell>{o.driver || '—'}</TableCell>
                          <TableCell>{o.service}</TableCell>
                          <TableCell align="right">{currency(o.amount)}</TableCell>
                          <TableCell align="right"><StatusChip status={o.status} /></TableCell>
                        </TableRow>
                      ))}
                      {userOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                            No orders yet.
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
