import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { CardProps } from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import { fNumber, fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';

interface Props extends CardProps {
   title: string;
   total: number;
   icon: string;
   color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
   currency?: boolean;
}

export function AnalyticsWidgetSummary({
   title,
   total,
   icon,
   color = 'primary',
   currency = false,
   sx,
   ...other
}: Props) {
   return (
      <Card
         sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3,
            ...sx,
         }}
         {...other}
      >
         <Box>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
               {title}
            </Typography>

            <Typography variant="h3">{currency ? fCurrency(total) : fNumber(total)}</Typography>
         </Box>

         <Avatar
            sx={{
               width: 56,
               height: 56,
               bgcolor: `${color}.main`,
               color: 'white',
            }}
         >
            <Iconify icon={icon} width={28} />
         </Avatar>
      </Card>
   );
}
