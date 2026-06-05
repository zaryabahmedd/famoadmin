'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import { DataGrid } from '@mui/x-data-grid';

import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import PageHeader from '../components/PageHeader';
import StatusChip, { currency } from '../components/StatusChip';
import { orders, zones } from '../data/dummyData';

const statusOptions = ['all', 'unassigned', 'assigned', 'in_transit', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const router = useRouter();
  const navigate = (href) => router.push(href);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [zone, setZone] = useState('all');

  const unassignedCount = orders.filter((o) => o.status === 'unassigned').length;

  const rows = useMemo(
    () =>
      orders.filter((o) => {
        const matchSearch =
          o.id.toLowerCase().includes(search.toLowerCase()) ||
          o.customer.toLowerCase().includes(search.toLowerCase()) ||
          (o.driver || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = status === 'all' || o.status === status;
        const matchZone = zone === 'all' || o.zone === zone;
        return matchSearch && matchStatus && matchZone;
      }),
    [search, status, zone]
  );

  const columns = [
    {
      field: 'id',
      headerName: 'Order',
      width: 130,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
          <span style={{ fontWeight: 600 }}>{p.value}</span>
          {p.row.status === 'unassigned' && (
            <WarningAmberIcon color="warning" sx={{ fontSize: 16 }} />
          )}
        </Stack>
      ),
    },
    { field: 'customer', headerName: 'Customer', flex: 1, minWidth: 150 },
    {
      field: 'driver',
      headerName: 'Driver',
      flex: 1,
      minWidth: 150,
      renderCell: (p) =>
        p.value || <Chip size="small" color="warning" label="Unassigned" variant="outlined" />,
    },
    { field: 'service', headerName: 'Service', width: 110 },
    { field: 'zone', headerName: 'Zone', width: 120 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 110,
      valueFormatter: (v) => currency(v),
    },
    { field: 'eta', headerName: 'ETA', width: 110 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <StatusChip status={p.value} />
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="All orders"
        subtitle="Filterable order book across every zone and status."
        action={
          unassignedCount > 0 && (
            <Chip
              color="warning"
              icon={<WarningAmberIcon />}
              label={`${unassignedCount} unassigned`}
            />
          )
        }
      />

      <Card sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <TextField
            size="small"
            placeholder="Search order, customer, driver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {s === 'all' ? 'All statuses' : s.replace('_', ' ')}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Zone"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All zones</MenuItem>
            {zones.map((z) => (
              <MenuItem key={z} value={z}>
                {z}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          rowHeight={80}
          getRowHeight={() => 'auto'}
          disableRowSelectionOnClick
          onRowClick={(p) => navigate(`/orders/${p.row.id}`)}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25]}
          sx={{
            border: 0,
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9', py: 2 },
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
          }}
        />
      </Card>
    </Box>
  );
}
