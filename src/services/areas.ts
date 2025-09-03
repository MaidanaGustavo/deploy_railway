import { Area } from '../types/area';

function key(userId: string) {
  return `rami_areas_${userId}`;
}

export function getAreas(userId: string): Area[] {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as Area[]) : [];
  } catch (e) {
    console.error('Erro ao carregar áreas:', e);
    return [];
  }
}

export function saveAreas(userId: string, areas: Area[]) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(areas));
  } catch (e) {
    console.error('Erro ao salvar áreas:', e);
  }
}

export function addArea(userId: string, area: Area) {
  const areas = getAreas(userId);
  areas.push(area);
  saveAreas(userId, areas);
}

