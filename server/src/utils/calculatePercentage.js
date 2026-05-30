export const calculatePercentage = (present, total) => {
  if (total === 0) return 0
  return ((present / total) * 100).toFixed(2)
}
