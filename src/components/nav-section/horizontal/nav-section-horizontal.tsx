'use client';

import type { NavGroupProps, NavSectionProps } from '../types';

import { mergeClasses } from 'minimal-shared/utils';

import { useTheme } from '@mui/material/styles';

import { NavList } from './nav-list';
import { Scrollbar } from '../../scrollbar';
import { Nav, NavUl, NavLi } from '../components';
import { navSectionClasses, navSectionCssVars } from '../styles';

// ----------------------------------------------------------------------

export function NavSectionHorizontal({
   sx,
   data,
   render,
   className,
   slotProps,
   checkPermissions,
   enabledRootRedirect,
   cssVars: overridesVars,
   ...other
}: NavSectionProps) {
   const theme = useTheme();

   const cssVars = { ...navSectionCssVars.horizontal(theme), ...overridesVars };

   return (
      <Scrollbar
         sx={{ height: 1 }}
         slotProps={{ contentSx: { height: 1, display: 'flex', alignItems: 'center' } }}
      >
         <Nav
            className={mergeClasses([navSectionClasses.horizontal, className])}
            sx={[
               () => ({
                  ...cssVars,
                  height: 1,
                  mx: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 'var(--nav-height)',
               }),
               ...(Array.isArray(sx) ? sx : [sx]),
            ]}
            {...other}
         >
            <NavUl sx={{ flexDirection: 'row', gap: 'var(--nav-item-gap)' }}>
               {data.map((group) => (
                  <Group
                     key={group.subheader ?? group.items[0].title}
                     render={render}
                     cssVars={cssVars}
                     items={group.items}
                     slotProps={slotProps}
                     requiredPermissions={group.requiredPermissions}
                     checkPermissions={checkPermissions}
                     enabledRootRedirect={enabledRootRedirect}
                  />
               ))}
            </NavUl>
         </Nav>
      </Scrollbar>
   );
}

// ----------------------------------------------------------------------

import useAuthStore from 'src/stores/auth';

// ----------------------------------------------------------------------

function Group({
   items,
   render,
   cssVars,
   slotProps,
   checkPermissions,
   requiredPermissions,
   enabledRootRedirect,
}: NavGroupProps) {
   const authStore = useAuthStore();
   const { user } = authStore;
   const userPermissions = user?.permissions;

   const hasPermission =
      !requiredPermissions ||
      requiredPermissions.length === 0 ||
      (!!userPermissions && requiredPermissions.some((perm) => userPermissions.includes(perm)));

   if (!hasPermission) {
      return null;
   }

   return (
      <NavLi>
         <NavUl sx={{ flexDirection: 'row', gap: 'var(--nav-item-gap)' }}>
            {items.map((list) => (
               <NavList
                  key={list.title}
                  depth={1}
                  data={list}
                  render={render}
                  cssVars={cssVars}
                  slotProps={slotProps}
                  checkPermissions={checkPermissions}
                  enabledRootRedirect={enabledRootRedirect}
               />
            ))}
         </NavUl>
      </NavLi>
   );
}
