import { 
  Box, 
  Container,
  Typography, 
  Button, 
  Stack,
  Link,
  useTheme,
  Alert
} from '@mui/material';
import { Google, Error as ErrorIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';

export default function LoginTurboTax() {
  const theme = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    
    if (error === 'verification_failed' && message) {
      setErrorMessage(decodeURIComponent(message));
    }
  }, []);
  
  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleMicrosoftLogin = () => {
    window.location.href = '/auth/microsoft';
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

                {errorMessage && (
                  <Alert 
                    severity="error" 
                    icon={<ErrorIcon />}
                    sx={{ 
                      backgroundColor: '#FDF2F2',
                      borderColor: '#FECACA',
                      color: '#991B1B',
                      '& .MuiAlert-icon': {
                        color: '#DC2626'
                      }
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#991B1B' }}>
                      Access Denied
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#7F1D1D', mt: 0.5 }}>
                      {errorMessage}
                    </Typography>
                  </Alert>
                )}

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

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleMicrosoftLogin}
                  startIcon={
                    <Box 
                      component="svg" 
                      viewBox="0 0 24 24" 
                      sx={{ width: 20, height: 20 }}
                    >
                      <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                    </Box>
                  }
                  sx={{
                    py: 1.75,
                    fontSize: '1rem',
                    fontWeight: 500,
                    backgroundColor: '#212121',
                    '&:hover': {
                      backgroundColor: '#424242',
                    },
                  }}
                  aria-label="Sign in with Microsoft"
                >
                  Sign in with Microsoft
                </Button>

                <Box textAlign="center">
                  <Typography 
                    variant="caption" 
                    sx={{ color: '#6B778C' }}
                  >
                    We'll use your account to securely save your reports
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