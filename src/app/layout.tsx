import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'AyiPM — Employee & Project Management System',
  description: 'Internal company management system replacing spreadsheets for people, attendance, leave, projects, and Kanban task delivery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <div className="app-layout">
            <Sidebar />
            <div className="main-content">
              <Navbar />
              {children}
            </div>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
