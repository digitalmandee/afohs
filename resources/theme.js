// import { createTheme } from '@mui/material/styles';

// const theme = createTheme({
//   typography: {
//     fontFamily: ['Inter'].join(','),
//   },
// });

// export default theme;

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: { fontWeight: 800, fontSize: '2.6rem', letterSpacing: '-0.04em', lineHeight: 1.1 },
    h2: { fontWeight: 800, fontSize: '2.1rem', letterSpacing: '-0.035em', lineHeight: 1.15 },
    h3: { fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.03em', lineHeight: 1.18 },
    h4: { fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em', lineHeight: 1.22 },
    h5: { fontWeight: 700, fontSize: '1.08rem', letterSpacing: '-0.01em' },
    h6: { fontWeight: 700, fontSize: '0.98rem' },
    body1: { fontSize: '0.96rem', lineHeight: 1.6 },
    body2: { fontSize: '0.88rem', lineHeight: 1.55 },
    button: { fontWeight: 700 },
  },

  palette: {
    primary: {
      main: '#063455',
      dark: '#04263f',
      light: '#0c67a7',
    },
    secondary: {
      main: '#0c67a7',
    },
    background: {
      default: '#f6f7fb',
      paper: '#ffffff',
    },
    divider: '#e5e7eb',
    text: {
      primary: '#1f2933',
      secondary: '#6b7280',
    },
  },

  shape: {
    borderRadius: 16,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--brand-900': '#04263f',
          '--brand-800': '#063455',
          '--brand-700': '#0c4b6e',
          '--brand-600': '#0c67a7',
          '--surface-base': '#f6f7fb',
          '--surface-card': '#ffffff',
          '--surface-muted': '#edf2f7',
          '--surface-tint': 'rgba(6,52,85,0.06)',
          '--border-soft': '#e5e7eb',
          '--border-strong': '#cfd8e3',
          '--shadow-soft': '0 16px 40px rgba(15, 23, 42, 0.08)',
          '--shadow-card': '0 10px 30px rgba(15, 23, 42, 0.06)',
        },
        body: {
          background:
            'radial-gradient(circle at top left, rgba(12,103,167,0.10), transparent 28%), radial-gradient(circle at top right, rgba(6,52,85,0.08), transparent 24%), #f6f7fb',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 14,
          paddingLeft: 18,
          paddingRight: 18,
          minHeight: 42,
        },
        contained: {
          boxShadow: '0 12px 24px rgba(6, 52, 85, 0.16)',
          background: 'linear-gradient(135deg, #063455 0%, #0c4b6e 55%, #0c67a7 100%)',
        },
        outlined: {
          borderColor: 'rgba(6, 52, 85, 0.18)',
          backgroundColor: 'rgba(255,255,255,0.72)',
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 18,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e5e7eb',
          boxShadow: 'var(--shadow-card)',
          borderRadius: 22,
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
      },
    },

    /* OUTLINED INPUT (TextField, Select, Autocomplete) */
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.88)',
          borderRadius: 14,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ced4da',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#063455',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#063455',
            borderWidth: '2.5px',
          },
        },
      },
    },

    /* STANDARD INPUT */
    MuiInput: {
      styleOverrides: {
        underline: {
          '&:after': {
            borderBottomColor: '#063455',
          },
        },
      },
    },

    /* FILLED INPUT */
    MuiFilledInput: {
      styleOverrides: {
        underline: {
          '&:after': {
            borderBottomColor: '#063455',
          },
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        input: {
          fontSize: '0.95rem',
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid #e9eef5',
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f7f9fc',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(6,52,85,0.035)',
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '14px 16px',
          borderBottom: '1px solid #eef2f7',
        },
        head: {
          fontWeight: 700,
          color: '#4b5563',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontSize: '0.72rem',
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: 999,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          textTransform: 'none',
          fontWeight: 700,
        },
      },
    },
  },
});

export default theme;
