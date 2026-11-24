import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { MemberLayout } from '@/components/layouts/MemberLayout';
import { StaffLayout } from '@/components/layouts/StaffLayout';

import { HomePage } from '@/features/opac/HomePage';
import { AuthPage } from '@/features/auth/AuthPage';
import { MemberDashboardPage } from '@/features/members/MemberDashboardPage';
import { StaffDashboardPage } from '@/features/dashboard/StaffDashboardPage';
import { CirculationDeskPage } from '@/features/circulation/CirculationDeskPage';
import { StaffApprovalQueuePage } from '@/features/members/StaffApprovalQueuePage';
import { StaffMembersPage } from '@/features/members/StaffMembersPage';
import { CatalogManagementPage } from '@/features/books/CatalogManagementPage';
import { InventoryStocktakePage } from '@/features/inventory/InventoryStocktakePage';
import { MissingBooksPage } from '@/features/inventory/MissingBooksPage';
import { ShelfAuditSecurityPage } from '@/features/audit/ShelfAuditSecurityPage';
import { ReportsCenterPage } from '@/features/reports/ReportsCenterPage';
import { IssuedBooksPage } from '@/features/circulation/IssuedBooksPage';
import { OverdueFinesPage } from '@/features/circulation/OverdueFinesPage';
import { ReservationsPage } from '@/features/circulation/ReservationsPage';
import { SuspendedMembersPage } from '@/features/members/SuspendedMembersPage';
import { PolicySettingsPage } from '@/features/settings/PolicySettingsPage';

import { ErrorBoundaryPage } from '@/components/common/ErrorBoundaryPage';
import { NotFoundPage } from '@/components/common/NotFoundPage';

const router = createBrowserRouter([
  // 1. Public OPAC Surface
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
  // 2. Unified Auth Hub Surface
  {
    path: '/',
    element: <AuthLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { path: 'login', element: <AuthPage /> },
      { path: 'register', element: <AuthPage /> },
    ],
  },
  // 3. Member Portal Surface
  {
    path: '/account',
    element: <MemberLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, element: <MemberDashboardPage /> },
      { path: 'loans', element: <MemberDashboardPage /> },
      { path: 'holds', element: <MemberDashboardPage /> },
      { path: 'fines', element: <MemberDashboardPage /> },
      { path: 'profile', element: <MemberDashboardPage /> },
    ],
  },
  // 4. Staff Console Surface
  {
    path: '/staff',
    element: <StaffLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, element: <StaffDashboardPage /> },
      { path: 'circulation', element: <CirculationDeskPage /> },
      { path: 'issued-books', element: <IssuedBooksPage /> },
      { path: 'reservations', element: <ReservationsPage /> },
      { path: 'fines', element: <OverdueFinesPage /> },
      { path: 'suspended', element: <SuspendedMembersPage /> },
      { path: 'catalog', element: <CatalogManagementPage /> },
      { path: 'members', element: <StaffMembersPage /> },
      { path: 'requests', element: <StaffMembersPage /> },
      { path: 'inventory', element: <InventoryStocktakePage /> },
      { path: 'missing-books', element: <MissingBooksPage /> },
      { path: 'audit', element: <ShelfAuditSecurityPage /> },
      { path: 'reports', element: <ReportsCenterPage /> },
      { path: 'settings', element: <PolicySettingsPage /> },
    ],
  },
  // Global 404 Catch-All
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
