'use client';

import type { Breakpoint } from '@mui/material/styles';
import type { FooterProps } from './footer';
import type { NavMainProps } from './nav/types';
import type { MainSectionProps, HeaderSectionProps, LayoutSectionProps } from '../core';

import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
import useAuthStore from 'src/stores/auth';

import { Logo } from 'src/components/logo';

import { Footer, HomeFooter } from './footer';
import { SignInButton } from '../components/sign-in-button';
import { SettingsButton } from '../components/settings-button';
import { MainSection, LayoutSection, HeaderSection } from '../core';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type MainLayoutProps = LayoutBaseProps & {
   layoutQuery?: Breakpoint;
   slotProps?: {
      header?: HeaderSectionProps;
      nav?: {
         data?: NavMainProps['data'];
      };
      main?: MainSectionProps;
      footer?: FooterProps;
   };
};

export function MainLayout({
   sx,
   cssVars,
   children,
   slotProps,
   layoutQuery = 'md',
}: MainLayoutProps) {
   const pathname = usePathname();

   const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

   const isHomePage = pathname === '/';

   const { user } = useAuthStore();

   const renderHeader = () => {
      const headerSlots: HeaderSectionProps['slots'] = {
         topArea: (
            <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
               This is an info Alert.
            </Alert>
         ),
         leftArea: (
            <>
               {/** @slot Logo */}
               <Logo />
            </>
         ),
         rightArea: (
            <>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                  {/** @slot Settings button */}
                  <SettingsButton />

                  {/** @slot Auth button (Dashboard or Sign In) */}
                  {user ? (
                     <Button component={RouterLink} href={paths.dashboard.root} variant="contained">
                        Dashboard
                     </Button>
                  ) : (
                     <SignInButton />
                  )}
               </Box>
            </>
         ),
      };

      return (
         <HeaderSection
            layoutQuery={layoutQuery}
            {...slotProps?.header}
            slots={{ ...headerSlots, ...slotProps?.header?.slots }}
            slotProps={slotProps?.header?.slotProps}
            sx={slotProps?.header?.sx}
         />
      );
   };

   const renderFooter = () =>
      isHomePage ? (
         <HomeFooter sx={slotProps?.footer?.sx} />
      ) : (
         <Footer sx={slotProps?.footer?.sx} layoutQuery={layoutQuery} />
      );

   const renderMain = () => <MainSection {...slotProps?.main}>{children}</MainSection>;

   return (
      <LayoutSection
         /** **************************************
          * @Header
          *************************************** */
         headerSection={renderHeader()}
         /** **************************************
          * @Footer
          *************************************** */
         footerSection={renderFooter()}
         /** **************************************
          * @Styles
          *************************************** */
         cssVars={cssVars}
         sx={sx}
      >
         {renderMain()}
      </LayoutSection>
   );
}
