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
  useMediaQuery
} from '@mui/material';
import { Engineering, Google } from '@mui/icons-material';

export default function LoginMUI() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
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
                    Sign in with your Google account to access your reports
                  </Typography>
                </Box>

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