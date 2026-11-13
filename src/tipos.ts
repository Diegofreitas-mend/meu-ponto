export type BusStop = {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviews: number;
  status: 'good' | 'alert' | 'unknown';
  tags: string[];
  lines: string[];
  alerts: { id: string; title: string; message: string; createdAt: string }[];
};
