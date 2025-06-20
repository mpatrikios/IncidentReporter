import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { turboTaxTheme } from '@/theme/turboTaxTheme';
import { ReactNode } from 'react';

interface MuiProviderProps {
  children: ReactNode;
}

export function MuiProvider({ children }: MuiProviderProps) {
  return (
    <ThemeProvider theme={turboTaxTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}