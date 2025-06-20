import { 
  Box, 
  Container,
  Typography, 
  Button, 
  Stack,
  Link,
  useTheme,
} from '@mui/material';
import { Google } from '@mui/icons-material';

export default function LoginTurboTax() {
  const theme = useTheme();
  
  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid #E8EAED',
          backgroundColor: '#FFFFFF',
          py: 2,
          px: 3,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography 
              variant="h5" 
              fontWeight={600}
              sx={{ color: '#0070BA' }}
            >
              Engineering Reports
            </Typography>
            <Link
              href="#"
              underline="hover"
              sx={{ 
                color: '#0070BA',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Need help?
            </Link>
          </Stack>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
        }}
      >
        <Container maxWidth="sm">
          <Stack spacing={5} alignItems="center">
            {/* Title Section */}
            <Box textAlign="center">
              <Typography 
                variant="h3" 
                component="h1" 
                fontWeight={500}
                gutterBottom
                sx={{ color: '#2C3E50' }}
              >
                Let's get your reports
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ color: '#5E6C84' }}
              >
                Sign in to access your engineering reports and create new ones
              </Typography>
            </Box>

            {/* Sign In Box */}
            <Box
              sx={{
                width: '100%',
                maxWidth: 400,
                p: 4,
                borderRadius: 2,
                backgroundColor: '#F8F9FA',
                border: '1px solid #E8EAED',
              }}
            >
              <Stack spacing={3}>
                <Typography 
                  variant="h6" 
                  fontWeight={500}
                  textAlign="center"
                  sx={{ color: '#2C3E50' }}
                >
                  Sign in to continue
                </Typography>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleGoogleLogin}
                  startIcon={<Google />}
                  sx={{
                    py: 1.75,
                    fontSize: '1rem',
                    fontWeight: 500,
                    backgroundColor: '#0070BA',
                    '&:hover': {
                      backgroundColor: '#005A94',
                    },
                  }}
                  aria-label="Sign in with Google"
                >
                  Sign in with Google
                </Button>

                <Box textAlign="center">
                  <Typography 
                    variant="caption" 
                    sx={{ color: '#6B778C' }}
                  >
                    We'll use your Google account to securely save your reports
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Security Notice */}
            <Stack spacing={2} sx={{ maxWidth: 400, width: '100%' }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: '#00AA3B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  ✓
                </Box>
                <Typography variant="body2" sx={{ color: '#5E6C84' }}>
                  Your data is encrypted and secure
                </Typography>
              </Box>

              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: '#00AA3B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  ✓
                </Box>
                <Typography variant="body2" sx={{ color: '#5E6C84' }}>
                  Generate professional reports in minutes
                </Typography>
              </Box>

              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: '#00AA3B',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  ✓
                </Box>
                <Typography variant="body2" sx={{ color: '#5E6C84' }}>
                  AI-powered content enhancement available
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: '1px solid #E8EAED',
          backgroundColor: '#F8F9FA',
          py: 3,
          px: 3,
        }}
      >
        <Container maxWidth="lg">
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <Typography variant="caption" sx={{ color: '#6B778C' }}>
              © 2024 Engineering Reports
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B778C' }}>
              •
            </Typography>
            <Link
              href="#"
              underline="hover"
              sx={{ 
                color: '#6B778C',
                fontSize: '0.75rem',
              }}
            >
              Privacy Policy
            </Link>
            <Typography variant="caption" sx={{ color: '#6B778C' }}>
              •
            </Typography>
            <Link
              href="#"
              underline="hover"
              sx={{ 
                color: '#6B778C',
                fontSize: '0.75rem',
              }}
            >
              Terms of Service
            </Link>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}