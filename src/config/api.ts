const ORDERS_BASE = 'https://functions.poehali.dev/bb30d9f0-aad2-4e73-a102-04fb8211f7ae';
const TARIFFS_BASE = 'https://functions.poehali.dev/e23d53dd-f58b-49c6-a1a9-a061650d1533';
const AUTH_BASE = 'https://functions.poehali.dev/dee3e5d3-4d65-42a4-9f03-07733fae849e';

export const API_URLS = {
  orders: ORDERS_BASE,
  rideshares: `${ORDERS_BASE}?resource=rideshares`,
  paymentSettings: `${ORDERS_BASE}?resource=payment_settings`,
  tariffs: TARIFFS_BASE,
  fleet: 'https://functions.poehali.dev/cbf23917-dd96-4252-96bd-d85969ab5d2b',
  auth: `${AUTH_BASE}?resource=admin`,
  statuses: 'https://functions.poehali.dev/b59cb5c9-4937-4c43-b5ad-a535c69620cf',

  // News — через tariffs функцию (исправлено)
  news: `${TARIFFS_BASE}?resource=news`,

  // Users & Drivers — через auth функцию
  users: `${AUTH_BASE}?resource=users`,
  drivers: `${AUTH_BASE}?resource=drivers`,

  // Reviews, Settings, Balance — через auth функцию
  reviews: `${AUTH_BASE}?resource=reviews`,
  settings: `${AUTH_BASE}?resource=settings`,
  balance: `${AUTH_BASE}?resource=balance`,

  // Services — через tariffs
  services: `${TARIFFS_BASE}?resource=services`,

  // Transfer types & Car classes — через tariffs
  transferTypes: `${TARIFFS_BASE}?resource=transfer_types`,
  carClasses: `${TARIFFS_BASE}?resource=car_classes`,
};
