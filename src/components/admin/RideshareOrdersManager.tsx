import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const RIDESHARES_ADMIN_URL = 'https://functions.poehali.dev/bb30d9f0-aad2-4e73-a102-04fb8211f7ae?resource=rideshares';

interface Rideshare {
  id: number;
  route_from: string;
  route_to: string;
  departure_datetime: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  car_class: string;
  driver_name?: string;
  driver_phone?: string;
  notes?: string;
  status: string;
  created_by_name?: string;
  created_by_phone?: string;
  created_by_user_id?: number;
  expires_at?: string;
  rideshare_driver_id?: number;
  created_at?: string;
}

interface Booking {
  id: number;
  passenger_name: string;
  passenger_phone: string;
  seats_count: number;
  status: string;
  created_at: string;
}

interface EditForm {
  status: string;
  seats_available: string;
  price_per_seat: string;
  notes: string;
  expires_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
  active:    { label: 'Активна',    className: 'bg-green-100 text-green-800 border-green-200',  icon: 'CheckCircle' },
  cancelled: { label: 'Отменена',   className: 'bg-red-100 text-red-800 border-red-200',        icon: 'XCircle' },
  completed: { label: 'Завершена',  className: 'bg-gray-100 text-gray-700 border-gray-200',     icon: 'CheckCheck' },
};

const BOOKING_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed:  { label: 'Подтверждено', className: 'bg-green-100 text-green-800' },
  cancelled:  { label: 'Отменено',     className: 'bg-red-100 text-red-800' },
  pending:    { label: 'Ожидает',      className: 'bg-yellow-100 text-yellow-800' },
};

function formatDate(dt?: string): string {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dt;
  }
}

function formatDateOnly(dt?: string): string {
  if (!dt) return '—';
  try {
    return new Date(dt).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return dt;
  }
}

function toDatetimeLocal(dt?: string): string {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

const RideshareOrdersManager = () => {
  const { toast } = useToast();

  const [rideshares, setRideshares] = useState<Rideshare[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Record<number, Booking[] | null>>({});
  const [bookingsLoading, setBookingsLoading] = useState<Record<number, boolean>>({});

  const [editRide, setEditRide] = useState<Rideshare | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    status: 'active',
    seats_available: '',
    price_per_seat: '',
    notes: '',
    expires_at: '',
  });
  const [saving, setSaving] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRideshares = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${RIDESHARES_ADMIN_URL}&admin=true`);
      const data = await res.json();
      setRideshares(data.rideshares || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить поездки', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRideshares();
  }, [fetchRideshares]);

  const fetchBookings = async (rideId: number) => {
    if (bookings[rideId] !== undefined) return;
    setBookingsLoading(prev => ({ ...prev, [rideId]: true }));
    try {
      const res = await fetch(`${RIDESHARES_ADMIN_URL}&action=bookings_admin&rideshare_id=${rideId}`);
      const data = await res.json();
      setBookings(prev => ({ ...prev, [rideId]: data.bookings || [] }));
    } catch {
      setBookings(prev => ({ ...prev, [rideId]: [] }));
    } finally {
      setBookingsLoading(prev => ({ ...prev, [rideId]: false }));
    }
  };

  const toggleExpand = (rideId: number) => {
    if (expandedId === rideId) {
      setExpandedId(null);
    } else {
      setExpandedId(rideId);
      fetchBookings(rideId);
    }
  };

  const openEdit = (ride: Rideshare) => {
    setEditRide(ride);
    setEditForm({
      status: ride.status,
      seats_available: String(ride.seats_available),
      price_per_seat: String(ride.price_per_seat),
      notes: ride.notes || '',
      expires_at: toDatetimeLocal(ride.expires_at),
    });
  };

  const handleSave = async () => {
    if (!editRide) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        id: editRide.id,
        status: editForm.status,
        seats_available: Number(editForm.seats_available),
        price_per_seat: Number(editForm.price_per_seat),
        notes: editForm.notes,
      };
      if (editForm.expires_at) {
        body.expires_at = editForm.expires_at;
      }
      const res = await fetch(RIDESHARES_ADMIN_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('HTTP error');
      toast({ title: 'Сохранено', description: 'Поездка обновлена' });
      setEditRide(null);
      fetchRideshares();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (ride: Rideshare, newStatus: string) => {
    try {
      await fetch(RIDESHARES_ADMIN_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ride.id, status: newStatus }),
      });
      toast({ title: 'Статус обновлён' });
      fetchRideshares();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось изменить статус', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${RIDESHARES_ADMIN_URL}&id=${deleteConfirmId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('HTTP error');
      toast({ title: 'Удалено', description: 'Поездка удалена' });
      setDeleteConfirmId(null);
      setBookings(prev => { const next = { ...prev }; delete next[deleteConfirmId]; return next; });
      if (expandedId === deleteConfirmId) setExpandedId(null);
      fetchRideshares();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = rideshares.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      r.route_from.toLowerCase().includes(q) ||
      r.route_to.toLowerCase().includes(q) ||
      (r.created_by_name || '').toLowerCase().includes(q) ||
      (r.created_by_phone || '').includes(q);
    return matchStatus && matchSearch;
  });

  const stats = {
    total: rideshares.length,
    active: rideshares.filter(r => r.status === 'active').length,
    cancelled: rideshares.filter(r => r.status === 'cancelled').length,
    completed: rideshares.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Всего поездок</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-gray-500 mt-1">Активных</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.cancelled}</div>
            <div className="text-xs text-gray-500 mt-1">Отменено</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-500">{stats.completed}</div>
            <div className="text-xs text-gray-500 mt-1">Завершено</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Поиск по маршруту или автору..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="cancelled">Отменённые</SelectItem>
                <SelectItem value="completed">Завершённые</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchRideshares} disabled={loading}>
              <Icon name="RefreshCw" size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Icon name="Loader2" className="animate-spin mr-2" size={20} />
          Загрузка поездок...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
          <Icon name="Car" size={40} className="text-gray-200" />
          <span className="text-sm">Поездки не найдены</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ride => {
            const statusCfg = STATUS_CONFIG[ride.status] || STATUS_CONFIG.cancelled;
            const isExpanded = expandedId === ride.id;
            const rideBookings = bookings[ride.id];
            const bookingLoading = bookingsLoading[ride.id];

            return (
              <Card key={ride.id} className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  {/* Header row */}
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">#{ride.id}</span>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.className}`}>
                            <Icon name={statusCfg.icon} size={11} />
                            {statusCfg.label}
                          </span>
                        </div>
                        {/* Route */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-800">
                          <Icon name="MapPin" size={14} className="text-blue-500 shrink-0" />
                          <span className="font-medium truncate">{ride.route_from}</span>
                          <Icon name="ArrowRight" size={13} className="text-gray-400 shrink-0" />
                          <span className="font-medium truncate">{ride.route_to}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Icon name="Calendar" size={13} className="text-gray-400" />
                        <span>{formatDate(ride.departure_datetime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="Users" size={13} className="text-gray-400" />
                        <span>
                          {ride.seats_available} / {ride.seats_total} мест
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="Banknote" size={13} className="text-gray-400" />
                        <span>{Number(ride.price_per_seat).toLocaleString('ru-RU')} ₽/место</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="Car" size={13} className="text-gray-400" />
                        <span>{ride.car_class || '—'}</span>
                      </div>
                      {ride.created_by_name && (
                        <div className="flex items-center gap-1.5 col-span-2">
                          <Icon name="User" size={13} className="text-gray-400" />
                          <span>{ride.created_by_name}</span>
                          {ride.created_by_phone && (
                            <span className="text-gray-400">· {ride.created_by_phone}</span>
                          )}
                        </div>
                      )}
                      {ride.expires_at && (
                        <div className="flex items-center gap-1.5 col-span-2">
                          <Icon name="Clock" size={13} className="text-orange-400" />
                          <span className="text-orange-600">Истекает: {formatDate(ride.expires_at)}</span>
                        </div>
                      )}
                      {ride.notes && (
                        <div className="flex items-start gap-1.5 col-span-2">
                          <Icon name="MessageSquare" size={13} className="text-gray-400 mt-0.5" />
                          <span className="text-gray-500 italic">{ride.notes}</span>
                        </div>
                      )}
                      {ride.created_at && (
                        <div className="flex items-center gap-1.5 col-span-2 text-gray-400">
                          <Icon name="CalendarPlus" size={13} />
                          <span>Создана: {formatDateOnly(ride.created_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => openEdit(ride)}
                      >
                        <Icon name="Pencil" size={13} className="mr-1" />
                        Редактировать
                      </Button>

                      {ride.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                          onClick={() => handleQuickStatus(ride, 'cancelled')}
                        >
                          <Icon name="XCircle" size={13} className="mr-1" />
                          Отменить
                        </Button>
                      )}
                      {ride.status === 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleQuickStatus(ride, 'active')}
                        >
                          <Icon name="CheckCircle" size={13} className="mr-1" />
                          Активировать
                        </Button>
                      )}
                      {ride.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-gray-600 border-gray-200 hover:bg-gray-50"
                          onClick={() => handleQuickStatus(ride, 'completed')}
                        >
                          <Icon name="CheckCheck" size={13} className="mr-1" />
                          Завершить
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => toggleExpand(ride.id)}
                      >
                        <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={13} className="mr-1" />
                        Брони
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 ml-auto"
                        onClick={() => setDeleteConfirmId(ride.id)}
                      >
                        <Icon name="Trash2" size={13} />
                      </Button>
                    </div>
                  </div>

                  {/* Bookings panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
                        <Icon name="Users" size={13} />
                        Бронирования
                      </div>
                      {bookingLoading ? (
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <Icon name="Loader2" size={14} className="animate-spin" />
                          Загружается...
                        </div>
                      ) : !rideBookings || rideBookings.length === 0 ? (
                        <p className="text-xs text-gray-400">Бронирований нет</p>
                      ) : (
                        <div className="space-y-2">
                          {rideBookings.map(b => {
                            const bCfg = BOOKING_STATUS_CONFIG[b.status] || BOOKING_STATUS_CONFIG.pending;
                            return (
                              <div key={b.id} className="bg-white rounded-lg p-3 text-xs flex items-center justify-between gap-2 shadow-sm">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-800">{b.passenger_name}</div>
                                  <div className="text-gray-500">{b.passenger_phone} · {b.seats_count} {b.seats_count === 1 ? 'место' : 'места'}</div>
                                  <div className="text-gray-400 mt-0.5">{formatDateOnly(b.created_at)}</div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${bCfg.className}`}>
                                  {bCfg.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editRide} onOpenChange={open => { if (!open) setEditRide(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать поездку #{editRide?.id}</DialogTitle>
          </DialogHeader>
          {editRide && (
            <div className="space-y-4 pt-2">
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <div className="font-medium">{editRide.route_from} → {editRide.route_to}</div>
                <div className="text-xs text-gray-400 mt-0.5">{formatDate(editRide.departure_datetime)}</div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Статус</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активна</SelectItem>
                    <SelectItem value="cancelled">Отменена</SelectItem>
                    <SelectItem value="completed">Завершена</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Свободных мест</Label>
                  <Input
                    type="number"
                    min={0}
                    max={editRide.seats_total}
                    value={editForm.seats_available}
                    onChange={e => setEditForm(f => ({ ...f, seats_available: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Цена за место (₽)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.price_per_seat}
                    onChange={e => setEditForm(f => ({ ...f, price_per_seat: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Истекает в</Label>
                <Input
                  type="datetime-local"
                  value={editForm.expires_at}
                  onChange={e => setEditForm(f => ({ ...f, expires_at: e.target.value }))}
                />
                <p className="text-xs text-gray-400">Оставьте пустым, чтобы не менять</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Примечания</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Комментарий к поездке..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditRide(null)}>
                  Отмена
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <><Icon name="Loader2" size={14} className="animate-spin mr-1" />Сохранение...</>
                  ) : (
                    <><Icon name="Save" size={14} className="mr-1" />Сохранить</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={open => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить поездку?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-600">
              Поездка #{deleteConfirmId} будет удалена безвозвратно вместе со всеми бронированиями.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}>
                Отмена
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <><Icon name="Loader2" size={14} className="animate-spin mr-1" />Удаление...</>
                ) : (
                  <><Icon name="Trash2" size={14} className="mr-1" />Удалить</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RideshareOrdersManager;
