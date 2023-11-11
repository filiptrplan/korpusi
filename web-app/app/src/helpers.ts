export const sklanjaj = (n: number, besede: string[]) => {
  if (n == 1) return besede[0];
  if (n == 2) return besede[1];
  if (n == 3 || n == 4) return besede[2];
  return besede[3];
};
