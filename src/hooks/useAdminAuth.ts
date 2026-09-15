import { useEffect, useState } from 'react';

/** Session check + PIN login/logout for the admin dashboard. */
export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin/auth', { cache: 'no-store' });
        const data = (await response.json()) as { authenticated?: boolean };
        if (active) setIsAuthenticated(data.authenticated === true);
      } catch (error) {
        if (active) console.error('Sesi admin gagal diverifikasi:', error);
      } finally {
        if (active) setIsCheckingAuth(false);
      }
    };

    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        alert('PIN Akses Ditolak!');
        setPinInput('');
      }
    } catch (error) {
      console.error('Login admin gagal:', error);
      alert('Kesalahan sistem saat memverifikasi PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  const logout = () => {
    void fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isCheckingAuth, isVerifying, pinInput, setPinInput, login, logout };
}
