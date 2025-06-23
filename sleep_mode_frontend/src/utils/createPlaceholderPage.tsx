import React from 'react';
import { DashboardPageLayout } from '../components/layout';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  icon?: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>>>;
  comingSoon?: boolean;
}

export const createPlaceholderPage = ({ 
  title, 
  subtitle, 
  icon: Icon,
  comingSoon = true 
}: PlaceholderPageProps) => {
  const PlaceholderPage: React.FC = () => {
    return (
      <DashboardPageLayout
        title={title}
        subtitle={subtitle || `${title} functionality coming soon.`}
      >
        <div className="text-center py-16">
          {Icon && (
            <div className="flex justify-center mb-6">
              <Icon className="h-16 w-16 text-gray-400" />
            </div>
          )}
          
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
            {comingSoon ? `${title} Coming Soon` : title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {comingSoon 
              ? `We're working hard to bring you ${title.toLowerCase()} functionality. Check back soon for updates!`
              : `${title} page content will be available here.`
            }
          </p>
          
          {comingSoon && (
            <div className="mt-8">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                <div className="animate-pulse w-2 h-2 bg-primary-600 rounded-full mr-2"></div>
                <span className="text-sm text-primary-700 dark:text-primary-300">
                  In Development
                </span>
              </div>
            </div>
          )}
        </div>
      </DashboardPageLayout>
    );
  };

  PlaceholderPage.displayName = `${title}Page`;
  return PlaceholderPage;
}; 