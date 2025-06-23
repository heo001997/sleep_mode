import {
  ClockIcon,
  ChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { createPlaceholderPage } from '../utils/createPlaceholderPage';

// Actual pages
export { default as DashboardPage } from './DashboardPage';
export { default as NotFoundPage } from './NotFoundPage';
export { SleepSessionsPage } from './SleepSessionsPage';
export { default as ProfilePage } from './ProfilePage';

// Placeholder pages generated using utility
export const SleepSessionDetailPage = createPlaceholderPage({
  title: 'Sleep Session Details',
  subtitle: 'Detailed view of your sleep session',
  icon: ClockIcon,
});

export const AnalyticsPage = createPlaceholderPage({
  title: 'Analytics',
  subtitle: 'Sleep patterns and insights',
  icon: ChartBarIcon,
});

// ProfilePage now implemented as actual component

export { default as SettingsPage } from './SettingsPage';

export const HelpPage = createPlaceholderPage({
  title: 'Help & Support',
  subtitle: 'Get help and contact support',
  icon: QuestionMarkCircleIcon,
});

export const DocsPage = createPlaceholderPage({
  title: 'Documentation',
  subtitle: 'API documentation and guides',
  icon: DocumentTextIcon,
});

// Re-export for convenience
export * from './DashboardPage';
export * from './NotFoundPage';
export * from './SleepSessionsPage'; 