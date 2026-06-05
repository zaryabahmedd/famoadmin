'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import EventIcon from '@mui/icons-material/Event';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import PageHeader from '../components/PageHeader';
import StatusChip, { currency } from '../components/StatusChip';
import { scheduledDeliveries } from '../data/dummyData';

export default function ScheduledPage() {
  const unassigned = scheduledDeliveries.filter((s) => s.assignment === 'unassigned').length;

  return (
    <Box>
      <PageHeader
        title="Scheduled deliveries"
        subtitle="All future bookings with assignment status."
        action={<Chip color="warning" label={`${unassigned} need a driver`} />}
      />

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8fafc', fontWeight: 700 } }}>
                <TableCell>Booking</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Zone</TableCell>
                <TableCell>Scheduled for</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scheduledDeliveries.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{s.id}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 30, height: 30, bgcolor: 'secondary.main', fontSize: 13 }}>
                        {s.customer.split(' ').map((n) => n[0]).join('')}
                      </Avatar>
                      {s.customer}
                    </Stack>
                  </TableCell>
                  <TableCell>{s.service}</TableCell>
                  <TableCell>{s.zone}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2">{s.scheduledFor}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {s.driver || (
                      <StatusChip status="unassigned" />
                    )}
                  </TableCell>
                  <TableCell align="right">{currency(s.amount)}</TableCell>
                  <TableCell align="right">
                    {s.assignment === 'unassigned' ? (
                      <Button size="small" variant="contained" startIcon={<PersonAddIcon />}>
                        Assign
                      </Button>
                    ) : (
                      <StatusChip status="assigned" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
