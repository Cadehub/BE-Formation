import { Formation } from '../types';

export const parseFormationDate = (date?: string | null) => {
  if (!date) return null;
  const parsed = new Date(`${date}T23:59:59`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isFormationExpired = (formation?: Pick<Formation, 'end_date'> | null) => {
  if (!formation?.end_date) return false;
  const endDate = parseFormationDate(formation.end_date);
  if (!endDate) return false;

  return endDate.getTime() < Date.now();
};

export const isFormationActive = (formation?: Pick<Formation, 'is_active' | 'end_date'> | null) => {
  if (!formation) return false;
  if (formation.is_active === false) return false;
  return !isFormationExpired(formation);
};
