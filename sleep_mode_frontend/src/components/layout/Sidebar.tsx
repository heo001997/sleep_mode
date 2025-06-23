import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  MoonIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MoonIcon as MoonIconSolid,
  ClockIcon as ClockIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';

interface SidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>;
  iconSolid: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>;
  description?: string;
  badge?: string | number;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    description: 'Overview and quick stats',
  },
  {
    name: 'Sleep Sessions',
    href: '/sleep-sessions',
    icon: ClockIcon,
    iconSolid: ClockIconSolid,
    description: 'View and manage sleep data',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
    description: 'Sleep patterns and insights',
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: UserCircleIcon,
    iconSolid: UserCircleIconSolid,
    description: 'Account settings and preferences',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    iconSolid: Cog6ToothIconSolid,
    description: 'App configuration and sync',
  },
];

const secondaryNavigation = [
  {
    name: 'Help & Support',
    href: '/help',
    icon: QuestionMarkCircleIcon,
  },
  {
    name: 'Documentation',
    href: '/docs',
    icon: DocumentTextIcon,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, onNavigate }) => {
  const location = useLocation();

  const handleNavigation = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo and branding - Desktop only */}
      {!isMobile && (
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl mr-3">
              <MoonIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Sleep Mode
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Track • Analyze • Improve
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Primary Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Main
            </h3>
          </div>
          
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = active ? item.iconSolid : item.icon;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleNavigation}
                className={({ isActive: linkIsActive }) => {
                  const isCurrentlyActive = active || linkIsActive;
                  return `group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isCurrentlyActive
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-r-2 border-primary-600 dark:border-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`;
                }}
              >
                <Icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <span className="truncate">{item.name}</span>
                  {item.description && (
                    <p className={`text-xs mt-0.5 truncate ${
                      active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {item.description}
                    </p>
                  )}
                </div>
                {item.badge && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    active
                      ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="px-2 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Support
            </h3>
          </div>
          
          <nav className="space-y-1">
            {secondaryNavigation.map((item) => {
              const active = isActive(item.href);
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={handleNavigation}
                  className={({ isActive: linkIsActive }) => {
                    const isCurrentlyActive = active || linkIsActive;
                    return `group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isCurrentlyActive
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`;
                  }}
                >
                  <item.icon
                    className="mr-3 flex-shrink-0 h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* App Version / Footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sleep Mode Dashboard
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              v1.0.0 Beta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 