'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import EventModal from './EventModal';
import EventDetail from './EventDetail';
import { Plus, Calendar } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  created_by_name: string;
  created_at: string;
}

export default function EventList({ token }: { token: string | null }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
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

  const handleCreateEvent = async (
    title: string,
    description: string,
    eventDate: string,
    location: string
  ) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, eventDate, location }),
      });
      const data = await response.json();
      if (data.event) {
        setEvents([...events, data.event]);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const isUpcoming = (eventDate: string): boolean => {
    return new Date(eventDate) > new Date();
  };

  if (selectedEvent) {
    return (
      <EventDetail
        event={selectedEvent}
        token={token}
        onBack={() => setSelectedEvent(null)}
      />
    );
  }

  const upcomingEvents = events.filter((e) => isUpcoming(e.event_date));
  const pastEvents = events.filter((e) => !isUpcoming(e.event_date));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
          🎉 Sự Kiện
        </h2>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          <Plus size={20} />
          Tạo Sự Kiện
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Upcoming Events */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-4xl">📅</span>
              <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                Sự Kiện Sắp Tới
              </span>
            </h3>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-dashed border-rose-200 transform transition-all hover:bg-white/80">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-gray-600 mb-6 text-lg">Chưa có sự kiện nào</p>
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  🎊 Tạo Sự Kiện Đầu Tiên
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingEvents.map((event, idx) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-l-4 border-rose-400 transform hover:scale-105 hover:-translate-y-1"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="h-24 bg-gradient-to-r from-rose-200 via-pink-100 to-rose-100 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="text-5xl group-hover:scale-110 transition-transform duration-300 relative z-10">
                        🎉
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="text-lg font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent group-hover:from-pink-500 group-hover:to-red-500">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-gray-600 mt-2 line-clamp-2 text-sm">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <p className="font-semibold text-rose-600">
                          📅{' '}
                          {new Date(event.event_date).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p>
                          🕐{' '}
                          {new Date(event.event_date).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {event.location && <p>📍 {event.location}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-600 mb-6 flex items-center gap-3 opacity-70">
                <span className="text-3xl">💭</span>
                Sự Kiện Đã Qua
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 hover:opacity-80 transition-opacity">
                {pastEvents.map((event, idx) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg cursor-pointer overflow-hidden border-l-4 border-gray-300 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                    style={{ animationDelay: `${(upcomingEvents.length + idx) * 100}ms` }}
                  >
                    <div className="h-20 bg-gradient-to-r from-gray-100 to-gray-50 flex items-center justify-center">
                      <div className="text-4xl">📸</div>
                    </div>
                    <div className="p-6">
                      <h4 className="text-lg font-bold text-gray-700">{event.title}</h4>
                      {event.description && (
                        <p className="text-gray-500 mt-2 line-clamp-2 text-sm">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-4 space-y-2 text-sm text-gray-500">
                        <p>
                          📅{' '}
                          {new Date(event.event_date).toLocaleDateString('vi-VN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        {event.location && <p>📍 {event.location}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <EventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateEvent}
      />
    </div>
  );
}
