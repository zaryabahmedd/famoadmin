import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function StatCard({ title, value, icon, color = 'primary.main', subtitle }) {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow .2s, transform .2s',
        '&:hover': { boxShadow: '0 4px 24px 0 rgba(0,0,0,.06)', transform: 'translateY(-2px)' },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '.08em', lineHeight: 1 }}
            >
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: color,
              color: '#fff',
              flexShrink: 0,
              ml: 1.5,
              opacity: 0.9,
              '& .MuiSvgIcon-root': { fontSize: 22 },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
