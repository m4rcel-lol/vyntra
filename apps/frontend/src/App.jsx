import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppRoutes } from '@/routes/AppRoutes';
import { Toaster } from '@/components/ui/sonner';

const router = createBrowserRouter([
  {
    path: '*',
    element: <AppRoutes />,
  },
]);

export default function App() {
  // Vyntra is a dark-first product — lock the dark token set.
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster theme="dark" position="top-right" richColors closeButton />
    </>
  );
}
