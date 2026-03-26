import '../css/app.css';
import React from 'react';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { SnackbarProvider } from 'notistack';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import {
  finalizeNavigationTrace,
  markNavigation,
  scheduleNextPaint,
  useRenderProfiler,
} from './lib/navigationProfiler';
import theme from '../theme'; // 👈 import your theme
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './echo';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const renderAdminLayout = (page) => <Layout>{page}</Layout>;

function NavigationRuntime({ children }) {
  useRenderProfiler('InertiaAppRoot');

  React.useEffect(() => {
    const stopStart = router.on('start', (event) => {
      markNavigation('inertia_visit_start', {
        url: event.detail.visit.url?.toString?.() || String(event.detail.visit.url || ''),
        method: event.detail.visit.method,
      });
    });

    const stopSuccess = router.on('success', (event) => {
      const pageUrl = event.detail.page?.url || '';
      markNavigation('inertia_navigate_success', {
        component: event.detail.page?.component,
        url: pageUrl,
      });
    });

    const stopFinish = router.on('finish', (event) => {
      markNavigation('inertia_visit_finish', {
        completed: event.detail.visit.completed,
        interrupted: event.detail.visit.interrupted,
      });
    });

    const stopError = router.on('error', (event) => {
      markNavigation('inertia_visit_error', {
        errors: Object.keys(event.detail.errors || {}),
      });
    });

    return () => {
      stopStart();
      stopSuccess();
      stopFinish();
      stopError();
    };
  }, []);

  return children;
}

function withPageProfiler(Page, name) {
  const ProfiledPage = function ProfiledPage(pageProps) {
    useRenderProfiler(`Page:${name}`, () => ({
      page: name,
      url: typeof window !== 'undefined' ? window.location.pathname : '',
    }));

    React.useEffect(() => {
      markNavigation('page_effects_complete', {
        page: name,
      });
      scheduleNextPaint('next_paint_ready', { page: name }, () => {
        finalizeNavigationTrace({
          page: name,
          url: typeof window !== 'undefined' ? window.location.pathname : '',
        });
      });
    }, []);

    return <Page {...pageProps} />;
  };

  ProfiledPage.layout = Page.layout;
  return ProfiledPage;
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[AppError]', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[UnhandledPromiseRejection]', event.reason);
  });
}

// createInertiaApp({
//   title: (title) => `${title} - ${appName}`,
//   resolve: (name) =>
//     resolvePageComponent(`./pages/${name}.jsx`, import.meta.glob('./pages/**/*.jsx')),
//   setup({ el, App, props }) {
//     const root = createRoot(el);

//     root.render(
//       <ThemeProvider theme={theme}>
//         <CssBaseline /> {/* resets default browser styling */}
//         <SnackbarProvider maxSnack={8}>
//           <App {...props} />
//         </SnackbarProvider>
//       </ThemeProvider>
//     );
//   },
//   progress: {
//     color: '#4B5563',
//   },
// });

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.jsx`,
      import.meta.glob('./pages/**/*.jsx')
    ).then((module) => {
      const Page = module.default;
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAdminInventoryPath = pathname === '/admin/inventory' || pathname.startsWith('/admin/inventory/');

      // Shared inventory pages are reused in POS and Admin. Force the Admin shell on
      // admin inventory routes so those pages cannot bypass the sidebar/topbar.
      if (isAdminInventoryPath) {
        Page.layout = renderAdminLayout;
        return withPageProfiler(Page, name);
      }

      Page.layout = Page.layout || renderAdminLayout;
      return withPageProfiler(Page, name);
    });
  },

  // resolve: async (name) => {
  //   const page = await resolvePageComponent(
  //     `./pages/${name}.jsx`,
  //     import.meta.glob('./pages/**/*.jsx')
  //   );

  //   const Page = page.default;

  //   // 1️⃣ If layout is explicitly set to null → do NOT wrap
  //   if (Page.layout === null) {
  //     return Page;
  //   }

  //   // 2️⃣ If page already has custom layout (like POSLayout) → use it
  //   if (Page.layout) {
  //     return Page;
  //   }

  //   // 3️⃣ Otherwise → apply default Admin Layout
  //   Page.layout = (page) => <Layout>{page}</Layout>;

  //   return Page;
  // },
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={8}>
          <NavigationRuntime>
            <App {...props} />
          </NavigationRuntime>
        </SnackbarProvider>
      </ThemeProvider>
    );
  },
  progress: {
    color: '#063455',
  },
});
