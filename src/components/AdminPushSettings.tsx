"use client";

import { useCallback, useEffect, useState } from 'react';

type PushStatus = {
  vapidReady: boolean;
  vapidIssue: 'missing-public' | 'missing-private' | 'missing-subject' | 'bad-subject' | null;
  deviceCount: number;
  devices: Array<{ id: string; label: string; updatedAt: string }>;
};

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

function vapidIssueMessage(issue: PushStatus['vapidIssue']) {
  if (issue === 'missing-public') return 'Kunci publik VAPID belum diisi di server.';
  if (issue === 'missing-private') return 'Kunci privat VAPID belum diisi di server. Perangkat bisa terdaftar, tapi notifikasi nggak keirim.';
  if (issue === 'missing-subject') return 'VAPID_SUBJECT belum diisi (mailto:email atau https://domain).';
  if (issue === 'bad-subject') return 'VAPID_SUBJECT harus diawali mailto: atau https://';
  return '';
}

function getErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (error.name === 'NotAllowedError') return 'Izin notifikasi ditolak. Izinkan notifikasi di pengaturan situs/aplikasi, lalu aktifkan lagi.';
  if (error.name === 'InvalidStateError') return 'Service Worker belum siap. Tutup aplikasi, buka lagi dari ikon HP, lalu coba lagi.';
  if (error.message === 'Error retrieving push subscription.') {
    return 'Subscription browser bermasalah. Hapus data situs ini atau reinstall PWA, lalu aktifkan lagi.';
  }
  return error.message || fallback;
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) throw new Error('Service Worker tidak tersedia di browser ini.');
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (!existing) {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }
  return navigator.serviceWorker.ready;
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch('/api/admin/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  });
  const result = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(result?.error || 'Subscription gagal disimpan.');
}

export default function AdminPushSettings() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<PushStatus | null>(null);

  const refreshStatus = useCallback(async () => {
    const response = await fetch('/api/admin/push/status', { cache: 'no-store' });
    if (!response.ok) return;
    const data = (await response.json()) as PushStatus;
    setStatus(data);
  }, []);

  const syncSubscription = useCallback(async (requestPermission: boolean) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      throw new Error('Browser ini belum mendukung Web Push. Di iPhone, pasang PWA dari Safari dulu.');
    }
    if (requestPermission) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Izin notifikasi belum diberikan.');
    } else if (Notification.permission !== 'granted') {
      return false;
    }

    const keyResponse = await fetch('/api/push/public-key', { cache: 'no-store' });
    const keyData = (await keyResponse.json()) as { publicKey?: string; error?: string };
    if (!keyResponse.ok || !keyData.publicKey) throw new Error(keyData.error || 'VAPID belum dikonfigurasi.');
    const registration = await getRegistration();
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription && !hasMatchingVapidKey(existingSubscription, keyData.publicKey)) {
      await fetch('/api/admin/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existingSubscription.toJSON()),
      });
      await existingSubscription.unsubscribe();
    } else if (existingSubscription) {
      await saveSubscription(existingSubscription);
      return true;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(keyData.publicKey),
    });
    await saveSubscription(subscription);
    return true;
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
      if (active) setSupported(true);
      try {
        await refreshStatus();
        const registration = await getRegistration();
        const subscription = await registration.pushManager.getSubscription();
        if (Notification.permission === 'granted') {
          const synced = await syncSubscription(false);
          if (active) setEnabled(synced);
        } else if (active) {
          setEnabled(Boolean(subscription));
        }
        if (active) await refreshStatus();
      } catch (error) {
        console.error('Subscription push gagal dibaca di browser:', error);
        if (active) setMessage(getErrorMessage(error, 'Subscription push gagal dibaca di browser.'));
      }
    };
    void check();
    return () => {
      active = false;
    };
  }, [refreshStatus, syncSubscription]);

  const enable = async () => {
    setBusy(true);
    setMessage('');
    try {
      if (!supported) throw new Error('Browser ini belum mendukung Web Push.');
      await syncSubscription(true);
      setEnabled(true);
      await refreshStatus();
      setMessage('Notifikasi pesanan aktif di perangkat ini. Biarkan izin notifikasi nyala, termasuk di aplikasi yang terpasang di HP.');
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
        const response = await fetch('/api/admin/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });
        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(result?.error || 'Subscription gagal dihapus.');
        }
        await subscription.unsubscribe();
      }
      setEnabled(false);
      await refreshStatus();
      setMessage('Notifikasi pesanan dimatikan di perangkat ini.');
    } catch (error) {
      console.error('Notifikasi pesanan gagal dimatikan:', error);
      setMessage(getErrorMessage(error, 'Notifikasi gagal dimatikan.'));
    } finally {
      setBusy(false);
    }
  };

  if (!supported) {
    return (
      <p className="max-w-xs text-xs text-gray-500">
        Browser ini belum mendukung Web Push. Di Android pakai Chrome (pasang aplikasi ke HP). Di iPhone: Safari → Share → Add to Home Screen, lalu buka dari ikon itu.
      </p>
    );
  }

  const vapidWarning = vapidIssueMessage(status?.vapidIssue ?? null);

  return (
    <div className="flex min-w-0 max-w-md flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => void (enabled ? disable() : enable())}
          disabled={busy}
          className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-50 ${enabled ? 'bg-gray-700 hover:bg-gray-800' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {busy ? 'Memproses...' : enabled ? 'Matikan Notifikasi' : 'Aktifkan Notifikasi Pesanan'}
        </button>
        {status && (
          <span className={`text-xs font-bold ${status.vapidReady && status.deviceCount > 0 ? 'text-green-700' : 'text-amber-700'}`}>
            {status.deviceCount} perangkat terdaftar
          </span>
        )}
      </div>
      {vapidWarning && <span className="text-xs font-medium text-red-600">{vapidWarning}</span>}
      {status && status.devices.length > 0 && (
        <p className="text-[11px] leading-4 text-gray-500">
          {status.devices.map((device) => device.label).join(' · ')}
        </p>
      )}
      {message && <span className="text-xs font-medium text-gray-600">{message}</span>}
    </div>
  );
}
