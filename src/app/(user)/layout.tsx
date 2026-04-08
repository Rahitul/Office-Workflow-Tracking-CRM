'use client';

import { ReactNode } from 'react';
import { NavBar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
      <Footer />
    </>
  );
}