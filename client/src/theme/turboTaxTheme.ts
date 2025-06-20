import { createTheme } from '@mui/material/styles';

// TurboTax-inspired theme with their signature clean design
export const turboTaxTheme = createTheme({
  palette: {
    primary: {
      main: '#0070BA', // TurboTax signature blue
      light: '#4A9FDB',
      dark: '#004A7C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00AA3B', // TurboTax green for success/progress
      light: '#4DC670',
      dark: '#007A2A',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
    },
    warning: {
      main: '#FFA000',
      light: '#FFB333',
      dark: '#CC8000',
    },
    info: {
      main: '#0070BA',
      light: '#4A9FDB',
      dark: '#004A7C',
    },
    success: {
      main: '#00AA3B',
      light: '#4DC670',
      dark: '#007A2A',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C3E50',
      secondary: '#5E6C84',
    },
    divider: '#E8EAED',
    grey: {
      50: '#F8F9FA',
      100: '#F1F3F5',
      200: '#E8EAED',
      300: '#DFE1E6',
      400: '#C1C7D0',
      500: '#A5ADBA',
      600: '#8993A4',
      700: '#6B778C',
      800: '#505F79',
      900: '#344563',
    },
  },
  typography: {
    fontFamily: '"Avenir Next", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      color: '#2C3E50',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 500,
      lineHeight: 1.3,
      letterSpacing: '-0.005em',
      color: '#2C3E50',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#2C3E50',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#2C3E50',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#2C3E50',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#2C3E50',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      color: '#2C3E50',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#5E6C84',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 6,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.05)',
    '0 1px 3px 0 rgba(0,0,0,0.10), 0 1px 2px 0 rgba(0,0,0,0.06)',
    '0 2px 4px 0 rgba(0,0,0,0.10), 0 1px 2px 0 rgba(0,0,0,0.06)',
    '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -1px rgba(0,0,0,0.06)',
    '0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -2px rgba(0,0,0,0.05)',
    '0 20px 25px -5px rgba(0,0,0,0.10), 0 10px 10px -5px rgba(0,0,0,0.04)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '12px 28px',
          fontSize: '1rem',
          fontWeight: 500,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 'none',
            transform: 'translateY(-1px)',
          },
        },
        sizeLarge: {
          padding: '16px 36px',
          fontSize: '1.125rem',
        },
        sizeSmall: {
          padding: '8px 20px',
          fontSize: '0.875rem',
        },
        contained: {
          backgroundColor: '#0070BA',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#005A94',
          },
        },
        outlined: {
          borderColor: '#DFE1E6',
          color: '#2C3E50',
          borderWidth: '2px',
          '&:hover': {
            borderColor: '#0070BA',
            backgroundColor: '#F8F9FA',
            borderWidth: '2px',
          },
        },
        text: {
          color: '#0070BA',
          '&:hover': {
            backgroundColor: '#F1F3F5',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            fontSize: '1rem',
            '& fieldset': {
              borderColor: '#DFE1E6',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: '#C1C7D0',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0070BA',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-outlined': {
            color: '#6B778C',
            fontSize: '0.875rem',
            fontWeight: 500,
            transform: 'translate(14px, 16px) scale(1)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -6px) scale(0.75)',
              backgroundColor: '#FFFFFF',
              padding: '0 4px',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.10), 0 1px 2px 0 rgba(0,0,0,0.06)',
          border: '1px solid #E8EAED',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -1px rgba(0,0,0,0.06)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          border: '1px solid #E8EAED',
        },
        elevation0: {
          border: '1px solid #E8EAED',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          padding: 0,
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor: '#E8EAED',
          borderWidth: 2,
        },
        root: {
          '&.Mui-completed .MuiStepConnector-line': {
            borderColor: '#00AA3B',
          },
          '&.Mui-active .MuiStepConnector-line': {
            borderColor: '#0070BA',
          },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontWeight: 500,
          fontSize: '0.875rem',
          color: '#6B778C',
          '&.Mui-active': {
            fontWeight: 600,
            color: '#0070BA',
          },
          '&.Mui-completed': {
            fontWeight: 500,
            color: '#00AA3B',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid #E8EAED',
          backgroundColor: '#FFFFFF',
          color: '#2C3E50',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.875rem',
        },
        standardInfo: {
          backgroundColor: '#E3F2FD',
          color: '#0D47A1',
        },
        standardSuccess: {
          backgroundColor: '#E8F5E9',
          color: '#1B5E20',
        },
        standardWarning: {
          backgroundColor: '#FFF3E0',
          color: '#E65100',
        },
        standardError: {
          backgroundColor: '#FFEBEE',
          color: '#B71C1C',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: '#E8EAED',
        },
        bar: {
          borderRadius: 4,
          backgroundColor: '#00AA3B',
        },
      },
    },
  },
});

// Helper function for responsive values
export const responsiveValue = (mobile: any, tablet?: any, desktop?: any) => ({
  xs: mobile,
  sm: tablet ?? mobile,
  md: desktop ?? tablet ?? mobile,
});