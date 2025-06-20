import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Container,
  Stack,
  Paper,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import { Engineering, Google, Error as ErrorIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';

export default function LoginMUI() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F5F7FA 0%, #E3F2FD 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={4} alignItems="center">
          {/* Logo and Title */}
          <Stack spacing={2} alignItems="center">
            <Paper
              elevation={0}
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'primary.main',
                color: 'white',
              }}
            >
              <Engineering sx={{ fontSize: 40 }} />
            </Paper>
            
            <Typography 
              variant="h3" 
              component="h1" 
              fontWeight={700}
              textAlign="center"
              sx={{ 
                fontSize: { xs: '2rem', sm: '2.5rem' },
                color: 'text.primary'
              }}
            >
              Civil Engineering Reports
            </Typography>
            
            <Typography 
              variant="body1" 
              color="text.secondary"
              textAlign="center"
            >
              Professional report generation system
            </Typography>
          </Stack>

          {/* Login Card */}
          <Card 
            sx={{ 
              width: '100%',
              maxWidth: 440,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Stack spacing={3}>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sign in with your account to access your reports
                  </Typography>
                </Box>

                {errorMessage && (
                  <Alert 
                    severity="error" 
                    icon={<ErrorIcon />}
                    sx={{ 
                      '& .MuiAlert-message': { 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 0.5 
                      } 
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      Access Denied
                    </Typography>
                    <Typography variant="body2">
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
                    py: 1.5,
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    backgroundColor: '#4285F4',
                    '&:hover': {
                      backgroundColor: '#357AE8',
                      transform: 'translateY(-1px)',
                    },
                  }}
                  aria-label="Continue with Google"
                >
                  Continue with Google
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
                      sx={{ width: 24, height: 24 }}
                    >
                      <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                    </Box>
                  }
                  sx={{
                    py: 1.5,
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    backgroundColor: '#212121',
                    '&:hover': {
                      backgroundColor: '#424242',
                      transform: 'translateY(-1px)',
                    },
                  }}
                  aria-label="Continue with Microsoft"
                >
                  Continue with Microsoft
                </Button>

                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  textAlign="center"
                  sx={{ mt: 2 }}
                >
                  By signing in, you agree to our terms of service and privacy policy
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* Features Section */}
          <Box sx={{ mt: 4, maxWidth: 600 }}>
            <Stack spacing={2}>
              {[
                { icon: '✓', text: 'Generate professional engineering reports' },
                { icon: '✓', text: 'Secure cloud storage with Google Drive' },
                { icon: '✓', text: 'AI-powered content enhancement' },
              ].map((feature, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    opacity: 0.8,
                  }}
                >
                  <Typography 
                    sx={{ 
                      color: 'success.main', 
                      fontWeight: 600,
                      mr: 2,
                      fontSize: '1.25rem'
                    }}
                  >
                    {feature.icon}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}