import { Link } from '@inertiajs/react';

import {
  Box,
  Container,
  Typography,
  Stack,
} from '@mui/material';

export default function AuthSimpleLayout({ children, title, description }) {
  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="background.default"
      p={{ xs: 3, md: 5 }}
    >
      <Container maxWidth="xs">
        <Stack spacing={4}>
          <Stack spacing={2} alignItems="center">
            <Link
              href={route('home')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width={36}
                height={36}
                borderRadius={1}
              >
                {/* <AppLogoIcon
                  className="size-9 fill-current text-[var(--foreground)] dark:text-white"
                  style={{ width: 36, height: 36 }}
                /> */}
              </Box>
              <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                {title}
              </span>
            </Link>

            <Box textAlign="center">
              <Typography variant="h5" component="h1" fontWeight={500}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Stack>

          {children}
        </Stack>
      </Container>
    </Box>
  );
}
