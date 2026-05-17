'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastNotification() {
  return <Toaster position="top-right" toastOptions={{ duration: 3000 }} />;
}