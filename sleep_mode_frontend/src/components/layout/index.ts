export { DashboardLayout, DashboardPageLayout } from './DashboardLayout';
export { Sidebar } from './Sidebar';
export { Header } from './Header';

// Layout types
export interface LayoutProps {
  children: React.ReactNode;
}

export interface PageLayoutProps extends LayoutProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
} 