export const dateToTimestamp = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  return Math.floor(date.getTime() / 1000);
};
