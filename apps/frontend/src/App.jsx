import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes/AppRoutes';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  // Vyntra is a dark-first product — lock the dark token set.
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster theme="dark" position="top-right" richColors closeButton />
    </BrowserRouter>
  );
}
