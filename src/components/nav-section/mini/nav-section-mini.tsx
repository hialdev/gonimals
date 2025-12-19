'use client';

import type { NavGroupProps, NavSectionProps } from '../types';

import { mergeClasses } from 'minimal-shared/utils';

import { useTheme } from '@mui/material/styles';

import { NavList } from './nav-list';
import { Nav, NavUl, NavLi } from '../components';
import { navSectionClasses, navSectionCssVars } from '../styles';

// ----------------------------------------------------------------------

export function NavSectionMini({
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

   const cssVars = { ...navSectionCssVars.mini(theme), ...overridesVars };

   return (
      <Nav
         className={mergeClasses([navSectionClasses.mini, className])}
         sx={[{ ...cssVars }, ...(Array.isArray(sx) ? sx : [sx])]}
         {...other}
      >
         <NavUl sx={{ flex: '1 1 auto', gap: 'var(--nav-item-gap)' }}>
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
         <NavUl sx={{ gap: 'var(--nav-item-gap)' }}>
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
