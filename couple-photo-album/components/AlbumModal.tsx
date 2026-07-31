'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Lock, Globe } from 'lucide-react';
import LocationPicker from './LocationPicker';
import { clearSessionKey } from '@/lib/use-session-state';

type Visibility = 'private' | 'public';

interface AlbumInitial {
  title: string;
  description: string;
  visibility: Visibility;
  location_name?: string;
  location_url?: string;
}

interface AlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    description: string,
    visibility: Visibility,
    locationName: string,
    locationUrl: string
  ) => Promise<void> | void;
  /** If provided, the modal is in edit mode */
  initial?: AlbumInitial | null;
  /** sessionStorage prefix used to persist create-mode draft (e.g. "albums:draft") */
  draftKey?: string;
}

function readDraft(key: string, field: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  try { return sessionStorage.getItem(`${key}:${field}`) ?? fallback; } catch { return fallback; }
}

function saveDraft(key: string, field: string, value: string) {
  try { sessionStorage.setItem(`${key}:${field}`, value); } catch { /* ignore */ }
}

export default function AlbumModal({ isOpen, onClose, onSubmit, initial, draftKey }: AlbumModalProps) {
  const isEdit = !!initial;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [locationName, setLocationName] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      // Edit mode — use server values
      setTitle(initial.title ?? '');
      setDescription(initial.description ?? '');
      setVisibility(initial.visibility ?? 'private');
      setLocationName(initial.location_name ?? '');
      setLocationUrl(initial.location_url ?? '');
    } else if (draftKey) {
      // Create mode — restore draft
      setTitle(readDraft(draftKey, 'title'));
      setDescription(readDraft(draftKey, 'desc'));
      setVisibility((readDraft(draftKey, 'visibility', 'private') as Visibility) || 'private');
      setLocationName(readDraft(draftKey, 'locationName'));
      setLocationUrl(readDraft(draftKey, 'locationUrl'));
    } else {
      setTitle('');
      setDescription('');
      setVisibility('private');
      setLocationName('');
      setLocationUrl('');
    }
  }, [isOpen, initial, draftKey]);

  // Persist draft live (create mode only)
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'title', title); }, [title, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'desc', description); }, [description, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'visibility', visibility); }, [visibility, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'locationName', locationName); }, [locationName, isOpen, isEdit, draftKey]);
  useEffect(() => { if (isOpen && !isEdit && draftKey) saveDraft(draftKey, 'locationUrl', locationUrl); }, [locationUrl, isOpen, isEdit, draftKey]);

  const clearDraft = () => {
    if (!draftKey) return;
    ['title', 'desc', 'visibility', 'locationName', 'locationUrl'].forEach((f) =>
      clearSessionKey(`${draftKey}:${f}`)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(title, description, visibility, locationName, locationUrl);
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Do NOT clear draft on close — preserve for post-reload restore
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-rose-100">
        <div className="flex justify-between items-center p-6 border-b border-rose-100">
          <h2 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent font-cute">
            {isEdit ? 'Sua Album' : 'Tao Album Moi'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-rose-500 transition-colors"
            aria-label="Dong"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">
              Ten Album
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Vi du: Ky niem ngay gap nhau"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">
              Mo Ta (Tuy Chon)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-cute text-gray-700"
              placeholder="Mo ta chi tiet ve album..."
              rows={3}
            />
          </div>

          <LocationPicker
            locationName={locationName}
            locationUrl={locationUrl}
            onLocationNameChange={setLocationName}
            onLocationUrlChange={setLocationUrl}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-cute">
              Che Do Hien Thi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-center gap-2 justify-center px-4 py-3 rounded-cute border-2 text-sm font-semibold transition-all ${
                  visibility === 'private'
                    ? 'border-rose-500 bg-rose-50 text-rose-600'
                    : 'border-gray-200 text-gray-500 hover:border-rose-200'
                }`}
              >
                <Lock size={16} />
                Rieng tu
              </button>
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-center gap-2 justify-center px-4 py-3 rounded-cute border-2 text-sm font-semibold transition-all ${
                  visibility === 'public'
                    ? 'border-rose-500 bg-rose-50 text-rose-600'
                    : 'border-gray-200 text-gray-500 hover:border-rose-200'
                }`}
              >
                <Globe size={16} />
                Cong khai
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {visibility === 'private'
                ? 'Chi minh ban nhin thay album nay.'
                : 'Ca hai dua deu nhin thay trong tab Cong khai.'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-cute"
            >
              Huy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-cute shadow-lg"
            >
              {loading ? 'Dang luu...' : isEdit ? 'Luu' : 'Tao'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
