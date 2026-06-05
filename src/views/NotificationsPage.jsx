'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import DoneIcon from '@mui/icons-material/Done';

import PageHeader from '../components/PageHeader';
import { notifications as seed } from '../data/dummyData';

const LEVELS = {
  critical: { color: 'error', icon: <ErrorIcon />, label: 'Critical' },
  warning: { color: 'warning', icon: <WarningIcon />, label: 'Warning' },
  info: { color: 'info', icon: <InfoIcon />, label: 'Info' },
};

const order = { critical: 0, warning: 1, info: 2 };

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState(seed);

  const visible = items
    .filter((n) => filter === 'all' || n.level === filter)
    .sort((a, b) => order[a.level] - order[b.level]);

  const dismiss = (id) => setItems((prev) => prev.filter((n) => n.id !== id));

  const counts = {
    critical: items.filter((n) => n.level === 'critical').length,
    warning: items.filter((n) => n.level === 'warning').length,
    info: items.filter((n) => n.level === 'info').length,
  };

  return (
    <Box>
      <PageHeader
        title="Notifications"
        subtitle="System alerts sorted by urgency."
        action={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={filter}
            onChange={(_, v) => v && setFilter(v)}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="critical">Critical ({counts.critical})</ToggleButton>
            <ToggleButton value="warning">Warning ({counts.warning})</ToggleButton>
            <ToggleButton value="info">Info ({counts.info})</ToggleButton>
          </ToggleButtonGroup>
        }
      />

      <Stack spacing={1.5}>
        {visible.map((n) => {
          const cfg = LEVELS[n.level];
          return (
            <Card
              key={n.id}
              sx={{ borderLeft: 5, borderLeftColor: `${cfg.color}.main` }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: `${cfg.color}.main` }}>{cfg.icon}</Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">{n.title}</Typography>
                      <Chip size="small" color={cfg.color} label={cfg.label} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {n.detail}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    {n.time}
                  </Typography>
                  <Tooltip title="Mark as read">
                    <IconButton size="small" onClick={() => dismiss(n.id)}>
                      <DoneIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
        {visible.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No notifications here.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
