import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { muiTheme } from '@/theme/muiTheme';
import { turboTaxTheme } from '@/theme/turboTaxTheme';

export type UITheme = 'shadcn' | 'mui' | 'turbotax';

interface ThemeContextType {
  theme: UITheme;
  setTheme: (theme: UITheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: UITheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'shadcn' 
}) => {
  const [theme, setTheme] = useState<UITheme>(defaultTheme);

  const getMuiTheme = () => {
    switch (theme) {
      case 'turbotax':
        return turboTaxTheme;
      case 'mui':
        return muiTheme;
      default:
        return muiTheme; // Fallback for shadcn theme when MUI is needed
    }
  };

  const contextValue = {
    theme,
    setTheme,
  };

  // For MUI and TurboTax themes, wrap with MUI ThemeProvider
  if (theme === 'mui' || theme === 'turbotax') {
    return (
      <ThemeContext.Provider value={contextValue}>
        <MuiThemeProvider theme={getMuiTheme()}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </ThemeContext.Provider>
    );
  }

  // For shadcn theme, just provide context
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};