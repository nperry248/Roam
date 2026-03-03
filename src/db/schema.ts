export type Trip = {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  status: 'ideated' | 'planned' | 'confirmed';
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  notes: string | null;
  budget: number | null;
  created_at: string;
};

export type Photo = {
  id: string;
  user_id: string;
  trip_id: string;
  url: string;
  caption: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  trip_id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
};

export type Document = {
  id: string;
  user_id: string;
  trip_id: string;
  type: string;
  title: string;
  subtitle: string | null;
  link: string | null;
  created_at: string;
};
