'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { DataGrid } from '@mui/x-data-grid';

import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import PageHeader from '../components/PageHeader';

function initials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin' };

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  // row action menu
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  // add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', name: '', password: '', role: 'admin' });
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  // reset-password dialog
  const [pwTarget, setPwTarget] = useState(null);
  const [pwValue, setPwValue] = useState('');
  const [pwError, setPwError] = useState('');

  const showToast = (msg, severity = 'success') => setToast({ open: true, msg, severity });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admins');
      const data = await res.json();
      if (res.ok) setAdmins(data);
      else showToast(data.error || 'Failed to load admins.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
    (async () => {
      const res = await fetch('/api/me');
      if (res.ok) setMe(await res.json());
    })();
  }, [fetchAdmins]);

  const openMenu = (e, row) => { setMenuAnchor(e.currentTarget); setMenuRow(row); };
  const closeMenu = () => { setMenuAnchor(null); setMenuRow(null); };

  const patchAdmin = async (row, body, successMsg) => {
    closeMenu();
    const res = await fetch(`/api/admins/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAdmins((prev) => prev.map((a) => (a.id === row.id ? data : a)));
      showToast(successMsg);
    } else {
      showToast(data.error || 'Action failed.', 'error');
    }
  };

  const submitAdd = async () => {
    setAddError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAddOpen(false);
        setAddForm({ email: '', name: '', password: '', role: 'admin' });
        showToast(`Admin "${data.name}" created.`);
        fetchAdmins();
      } else {
        setAddError(data.error || 'Could not create admin.');
      }
    } finally {
      setSaving(false);
    }
  };

  const submitResetPassword = async () => {
    setPwError('');
    if (pwValue.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admins/${pwTarget.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: pwValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPwTarget(null);
        setPwValue('');
        showToast(`Password reset for ${pwTarget.email}.`);
      } else {
        setPwError(data.error || 'Could not reset password.');
      }
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Admin',
      flex: 1,
      minWidth: 240,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: '100%', py: 0.75, overflow: 'hidden' }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38, fontSize: 14, flexShrink: 0 }}>
            {initials(row.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{row.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{row.email}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Chip size="small" label={ROLE_LABEL[value] || value} color={value === 'super_admin' ? 'primary' : 'default'} />
        </Box>
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Chip size="small" label={value ? 'Active' : 'Inactive'} color={value ? 'success' : 'default'} variant={value ? 'filled' : 'outlined'} />
        </Box>
      ),
    },
    { field: 'last_login_at', headerName: 'Last login', width: 170, valueFormatter: fmtDateTime },
    { field: 'created_at', headerName: 'Created', width: 130, valueFormatter: fmtDate },
    {
      field: '_action',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <IconButton size="small" onClick={(e) => openMenu(e, row)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const isSelf = menuRow && me && menuRow.id === me.id;

  return (
    <Box>
      <PageHeader
        title="Admins"
        subtitle={loading ? 'Loading…' : `${admins.length} admin account${admins.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setAddError(''); setAddOpen(true); }}>
            Add admin
          </Button>
        }
      />

      <Card sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <DataGrid
            rows={admins}
            columns={columns}
            getRowId={(r) => r.id}
            autoHeight
            getRowHeight={() => 'auto'}
            getEstimatedRowHeight={() => 68}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
            pageSizeOptions={[15, 30, 50]}
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #f1f5f9', py: 1, display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
            }}
          />
        )}
      </Card>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem onClick={() => { setPwTarget(menuRow); setPwValue(''); setPwError(''); closeMenu(); }}>
          Reset password
        </MenuItem>
        <MenuItem
          disabled={isSelf}
          onClick={() => patchAdmin(
            menuRow,
            { role: menuRow.role === 'super_admin' ? 'admin' : 'super_admin' },
            'Role updated.',
          )}
        >
          {menuRow?.role === 'super_admin' ? 'Make Admin' : 'Make Super Admin'}
        </MenuItem>
        <MenuItem
          disabled={isSelf}
          onClick={() => patchAdmin(
            menuRow,
            { is_active: !menuRow.is_active },
            menuRow?.is_active ? 'Admin deactivated.' : 'Admin reactivated.',
          )}
        >
          {menuRow?.is_active ? 'Deactivate' : 'Reactivate'}
        </MenuItem>
      </Menu>

      {/* Add admin */}
      <Dialog open={addOpen} onClose={() => !saving && setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add admin</DialogTitle>
        <DialogContent>
          {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
          <TextField
            fullWidth label="Full name" sx={{ mt: 1, mb: 2 }}
            value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            fullWidth type="email" label="Email" autoComplete="off" sx={{ mb: 2 }}
            value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField
            fullWidth type="password" label="Temporary password" autoComplete="new-password" sx={{ mb: 2 }}
            value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
            helperText="At least 8 characters"
          />
          <TextField
            select fullWidth label="Role"
            value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="super_admin">Super Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained" onClick={submitAdd}
            disabled={saving || !addForm.name || !addForm.email || !addForm.password}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset password */}
      <Dialog open={!!pwTarget} onClose={() => !saving && setPwTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset password</DialogTitle>
        <DialogContent>
          {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set a new password for <strong>{pwTarget?.email}</strong>.
          </Typography>
          <TextField
            fullWidth type="password" label="New password" autoComplete="new-password"
            value={pwValue} onChange={(e) => setPwValue(e.target.value)}
            helperText="At least 8 characters"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPwTarget(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={submitResetPassword} disabled={saving || !pwValue}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Reset'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))} sx={{ width: '100%' }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
