'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import EventModal from './EventModal';
import EventDetail from './EventDetail';
import { Plus, Lock, Globe, Pencil, Trash2 } from 'lucide-react';
import { parseDate, formatDateVN, formatTimeVN } from '@/lib/datetime';
import LocationBadge from './LocationBadge';
import { useSeen } from '@/lib/use-seen';

type Visibility = 'private' | 'public';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  location_url?: string;
  visibility: Visibility;
  created_by_user_id: number;
  created_by_name: string;
  created_at: string;
}

export default function EventList({ token }: { token: string | null }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tab, setTab] = useState<Visibility>('private');
  const { badge, markSeen } = useSeen('event');

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    title: string,
    description: string,
    eventDate: string,
    location: string,
    visibility: Visibility,
    locationUrl: string
  ) => {
    try {
      if (editing) {
        const response = await fetch(`/api/events/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, description, eventDate, location, locationUrl, visibility }),
        });
        if (response.ok) {
          setTab(visibility);
          await fetchEvents();
        }
      } else {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, description, eventDate, location, locationUrl, visibility }),
        });
        const data = await response.json();
        if (data.event) {
          setEvents((prev) => [...prev, data.event]);
          setTab(visibility);
        }
      }
      closeModal();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Xóa sự kiện "${event.title}"?`)) return;
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (event: Event) => {
    setEditing(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const isUpcoming = (eventDate: string): boolean => {
    const d = parseDate(eventDate);
    return d ? d > new Date() : false;
  };

  /** Sự kiện quá 7 ngày kể từ ngày tạo thì không cho sửa (nhưng vẫn xóa được) */
  const isEditLocked = (event: Event): boolean => {
    const created = parseDate(event.created_at);
    if (!created) return false;
    return Date.now() - created.getTime() > 7 * 24 * 60 * 60 * 1000;
  };

  if (selectedEvent) {
    return (
      <EventDetail
        event={selectedEvent}
        token={token}
        onBack={() => setSelectedEvent(null)}
        onEdit={
          !isEditLocked(selectedEvent)
            ? () => { setSelectedEvent(null); openEdit(selectedEvent); }
            : undefined
        }
        onDelete={async () => {
          await handleDelete(selectedEvent);
          setSelectedEvent(null);
        }}
      />
    );
  }

  const visibleEvents = events.filter((e) => e.visibility === tab);
  const upcomingEvents = visibleEvents.filter((e) => isUpcoming(e.event_date));
  const pastEvents = visibleEvents.filter((e) => !isUpcoming(e.event_date));

  const tabs: { key: Visibility; label: string; icon: typeof Lock }[] = [
    { key: 'private', label: 'Riêng tư', icon: Lock },
    { key: 'public', label: 'Công khai', icon: Globe },
  ];

  const renderCard = (event: Event, past: boolean) => (
    <div
      key={event.id}
      className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-4 transform hover:-translate-y-1 ${
        past ? 'border-gray-300' : 'border-rose-400'
      }`}
    >
      <div
        onClick={() => { setSelectedEvent(event); markSeen(event.id); }}
        className={`h-20 flex items-center justify-center relative overflow-hidden cursor-pointer ${
          past ? 'bg-gradient-to-r from-gray-100 to-gray-50' : 'bg-gradient-to-r from-rose-200 via-pink-100 to-rose-100'
        }`}
      >
        <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
          {past ? '📸' : '🎉'}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h4
              onClick={() => { setSelectedEvent(event); markSeen(event.id); }}
              className={`text-lg font-bold cursor-pointer line-clamp-1 ${
                past ? 'text-gray-700' : 'bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent'
              }`}
            >
              {event.title}
            </h4>
            {(() => {
              const b = badge(event.id, event.created_at);
              if (!b) return null;
              return (
                <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${b === 'new' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'}`}>
                  {b === 'new' ? 'Mới' : 'Chưa xem'}
                </span>
              );
            })()}
          </div>
          <div className="flex gap-1 shrink-0">
            {!isEditLocked(event) && (
              <button
                onClick={() => openEdit(event)}
                aria-label="Sửa sự kiện"
                className="grid place-items-center w-8 h-8 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              >
                <Pencil size={16} />
              </button>
            )}
            <button
              onClick={() => handleDelete(event)}
              aria-label="Xóa sự kiện"
              className="grid place-items-center w-8 h-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {event.description && (
          <p className="text-gray-500 mt-2 line-clamp-2 text-sm">{event.description}</p>
        )}
        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <p className={past ? '' : 'font-semibold text-rose-600'}>
            📅 {formatDateVN(event.event_date, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
          {!past && <p>🕐 {formatTimeVN(event.event_date)}</p>}
          {(event.location || event.location_url) && (
            <div className="flex items-center gap-1">
              <span>📍</span>
              <LocationBadge
                locationName={event.location}
                locationUrl={event.location_url}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
          🎉 Sự Kiện
        </h2>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          Tạo Sự Kiện
        </Button>
      </div>

      {/* Private / Public tabs */}
      <div className="flex gap-2 mb-8">
        {tabs.map(({ key, label, icon: Icon }) => {
          const count = events.filter((e) => e.visibility === key).length;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-cute text-sm font-semibold border-2 transition-all ${
                tab === key
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-md'
                  : 'bg-white/70 text-gray-600 border-rose-100 hover:border-rose-300 hover:text-rose-600'
              }`}
            >
              <Icon size={16} />
              {label}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  tab === key ? 'bg-white/25' : 'bg-rose-50 text-rose-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-dashed border-rose-200 transform transition-all hover:bg-white/80">
          <div className="text-6xl mb-4">✨</div>
          <p className="text-gray-600 mb-6 text-lg">
            {tab === 'private' ? 'Chưa có sự kiện riêng tư nào' : 'Chưa có sự kiện công khai nào'}
          </p>
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            🎊 Tạo Sự Kiện Đầu Tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="text-4xl">📅</span>
              <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                Sự Kiện Sắp Tới
              </span>
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 italic">Chưa có sự kiện sắp tới</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingEvents.map((event) => renderCard(event, false))}
              </div>
            )}
          </div>

          {pastEvents.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-600 mb-6 flex items-center gap-3 opacity-70">
                <span className="text-3xl">💭</span>
                Sự Kiện Đã Qua
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pastEvents.map((event) => renderCard(event, true))}
              </div>
            </div>
          )}
        </div>
      )}

      <EventModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initial={
          editing
            ? {
                title: editing.title,
                description: editing.description || '',
                event_date: editing.event_date,
                location: editing.location || '',
                location_url: editing.location_url || '',
                visibility: editing.visibility,
              }
            : null
        }
      />
    </div>
  );
}
