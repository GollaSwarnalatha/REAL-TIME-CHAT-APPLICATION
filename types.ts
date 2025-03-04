export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp?: string;
}

export interface User {
  id: string;
  name: string;
  online: boolean;
}