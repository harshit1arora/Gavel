import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const DOMAIN = 'https://www.trygavel.com';

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.path.startsWith('http') ? item.path : `${DOMAIN}${item.path}`,
    })),
  });

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{jsonLd}</script>
      </Helmet>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            {i < items.length - 1 && item.path ? (
              <Link to={item.path} className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground/70">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
}
