export type Profile = {
  id: string;
  updated_at: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  chat_preferences: {
    language: string;
    model: string;
    temperature: number;
  };
  chat_history_enabled: boolean;
  max_history_length: number;
  created_at: string;
};

export type Chat = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  is_archived: boolean;
};

export type ChatMessage = {
  id: string;
  chat_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at: string;
}; 