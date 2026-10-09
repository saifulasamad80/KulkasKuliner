"use client";

import { MUSIC_MOODS, type MusicMood } from "@/lib/slideshow-music";

type SlideshowMusicPickerProps = {
  value: MusicMood | null;
  onChange: (value: MusicMood | null) => void;
  disabled?: boolean;
  accent?: "amber" | "purple";
};

const ACCENT = {
  amber: "border-amber-600 bg-amber-50 ring-4 ring-amber-100",
  purple: "border-purple-600 bg-purple-50 ring-4 ring-purple-100",
};

/** Pilihan musik latar instrumental untuk video slideshow (buatan sendiri, bebas hak cipta). */
export default function SlideshowMusicPicker({ value, onChange, disabled = false, accent = "amber" }: SlideshowMusicPickerProps) {
  const options: Array<{ id: MusicMood | null; label: string; description: string }> = [
    ...MUSIC_MOODS,
    { id: null, label: "🔇 Tanpa musik", description: "Video hening" },
  ];

  return (
    <div role="radiogroup" aria-label="Musik latar video" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id ?? "none"}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={`min-h-14 rounded-xl border-2 p-2.5 text-left transition disabled:opacity-50 ${selected ? ACCENT[accent] : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <span className="block text-sm font-black text-gray-900">{option.label}</span>
            <span className="mt-0.5 block text-xs text-gray-600">{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}

type VideoFormatBadgeProps = {
  whatsappReady: boolean;
  hasAudio: boolean;
  videoCodec: string;
};

const CODEC_LABEL: Record<string, string> = {
  avc: "H.264",
  hevc: "H.265",
  vp9: "VP9",
  vp8: "VP8",
  av1: "AV1",
};

/** Info format hasil video, biar admin tahu sebelum upload ke Status WA. */
export function VideoFormatBadge({ whatsappReady, hasAudio, videoCodec }: VideoFormatBadgeProps) {
  const codec = CODEC_LABEL[videoCodec] ?? videoCodec;
  if (whatsappReady) {
    return (
      <p className="mt-3 rounded-lg border border-green-300 bg-green-50 p-2.5 text-sm font-bold text-green-800">
        ✓ MP4 {codec}{hasAudio ? " + musik AAC" : " (tanpa musik)"} — siap diunggah ke Status WA
      </p>
    );
  }
  return (
    <p className="mt-3 rounded-lg border border-red-300 bg-red-50 p-2.5 text-sm font-bold text-red-800">
      ⚠️ Format {codec} — WhatsApp kemungkinan menolak video ini. Bikin ulang dari Chrome terbaru di HP Android, atau Safari di iPhone.
    </p>
  );
}
