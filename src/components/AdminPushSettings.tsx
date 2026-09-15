"use client";

import { useEffect, useState } from 'react';

function base64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function arrayBufferToBase64(value: ArrayBuffer) {
  const bytes = new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hasMatchingVapidKey(subscription: PushSubscription, publicKey: string) {
  const applicationServerKey = subscription.options.applicationServerKey;
  if (!applicationServerKey) return true;
  return arrayBufferToBase64(applicationServerKey) === publicKey.replace(/=+$/, '');
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (error.name === 'NotAllowedError') return 'Izin notifikasi ditolak. Izinkan notifikasi untuk localhost lalu coba lagi.';
  if (error.name === 'InvalidStateError') return 'Service Worker belum siap. Refresh halaman admin lalu coba lagi.';
  if (error.message === 'Error retrieving push subscription.') {
    return 'Subscription browser bermasalah. Hapus data situs localhost atau refresh halaman, lalu aktifkan lagi.';
  }
  return error.message || fallback;
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) throw new Error('Service Worker tidak tersedia di browser ini.');
  return navigator.serviceWorker.ready;
}

export default function AdminPushSettings() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
      if (active) setSupported(true);
      try {
        const registration = await getRegistration();
        const subscription = await registration.pushManager.getSubscription();
        if (active) setEnabled(Boolean(subscription));
      } catch (error) {
        console.error('Subscription push gagal dibaca di browser:', error);
        if (active) setMessage(getErrorMessage(error, 'Subscription push gagal dibaca di browser.'));
      }
    };
    void check();
    return () => {
      active = false;
    };
  }, []);

  const enable = async () => {
    setBusy(true);
    setMessage('');
    try {
      if (!supported) throw new Error('Browser ini belum mendukung Web Push.');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Izin notifikasi belum diberikan.');
      const keyResponse = await fetch('/api/push/public-key', { cache: 'no-store' });
      const keyData = (await keyResponse.json()) as { publicKey?: string; error?: string };
      if (!keyResponse.ok || !keyData.publicKey) throw new Error(keyData.error || 'VAPID belum dikonfigurasi.');
      const registration = await getRegistration();
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        if (!hasMatchingVapidKey(existingSubscription, keyData.publicKey)) {
          const removeResponse = await fetch('/api/admin/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existingSubscription.toJSON()),
          });
          const removeResult = (await removeResponse.json().catch(() => null)) as { error?: string } | null;
          if (!removeResponse.ok) throw new Error(removeResult?.error || 'Subscription lama gagal dihapus.');
          await existingSubscription.unsubscribe();
        } else {
          const existingResponse = await fetch('/api/admin/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existingSubscription.toJSON()),
          });
          const existingResult = (await existingResponse.json().catch(() => null)) as { error?: string } | null;
          if (!existingResponse.ok) throw new Error(existingResult?.error || 'Subscription gagal disimpan.');
          setEnabled(true);
          setMessage('Notifikasi pesanan aktif di perangkat ini.');
          return;
        }
      }
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToUint8Array(keyData.publicKey) });
      const response = await fetch('/api/admin/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Subscription gagal disimpan.');
      setEnabled(true);
      setMessage('Notifikasi pesanan aktif di perangkat ini.');
    } catch (error) {
      console.error('Notifikasi pesanan gagal diaktifkan:', error);
      setMessage(getErrorMessage(error, 'Notifikasi gagal diaktifkan.'));
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const registration = await getRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch('/api/admin/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) });
        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(result?.error || 'Subscription gagal dihapus.');
        }
        await subscription.unsubscribe();
      }
      setEnabled(false);
      setMessage('Notifikasi pesanan dimatikan di perangkat ini.');
    } catch (error) {
      console.error('Notifikasi pesanan gagal dimatikan:', error);
      setMessage(getErrorMessage(error, 'Notifikasi gagal dimatikan.'));
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return <p className="text-xs text-gray-500">Browser ini belum mendukung Web Push.</p>;
  return <div className="flex flex-wrap items-center gap-3"><button onClick={() => void (enabled ? disable() : enable())} disabled={busy} className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-50 ${enabled ? 'bg-gray-700 hover:bg-gray-800' : 'bg-blue-600 hover:bg-blue-700'}`}>{busy ? 'Memproses...' : enabled ? 'Matikan Notifikasi' : 'Aktifkan Notifikasi Pesanan'}</button>{message && <span className="text-xs font-medium text-gray-600">{message}</span>}</div>;
}