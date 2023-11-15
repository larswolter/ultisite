// eslint-disable-next-line import/prefer-default-export
export const hatSort = () => {
  const sort = {};
  if (UltiSite.settings().hatSort) {
    sort[UltiSite.settings().hatSort] = 1;
  }
  sort.createdAt = 1;
  return sort;
};
