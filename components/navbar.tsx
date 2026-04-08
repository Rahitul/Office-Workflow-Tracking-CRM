'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavBar() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/user/dashboard', label: 'Dashboard' },
    { href: '/user/forms', label: 'Forms' },
    { href: '/user/activity', label: 'Activity' },
    { href: '/user/kpi', label: 'KPI' },
    { href: '/user/profile', label: 'Profile' },
  ];

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold">
              IOM Daily
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm hover:text-blue-200 transition-colors',
                    pathname === item.href && 'text-blue-200 font-medium'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}