export interface Area {
  id: string;
  userId: string;
  nome: string;
  cultura: string | null;
  ha: number | null;
  irrigacaoUsa: boolean;
  status: string;
  progresso: number;
  createdAt: string;
  geo?: { lat: number; lng: number } | null;
}
