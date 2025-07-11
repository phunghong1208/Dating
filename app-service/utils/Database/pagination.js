module.exports = {
  paginationResult(
    list_data,
    total,
    { currentPage = 0, pageSize = 500 } = {},
    { filters, sorting } = {},
  ) {
    return {
      currentPage,
      skip: pageSize * currentPage,
      limit: pageSize,
      count: list_data.length,
      total: total || list_data.length,
      list_data: list_data,
      filters: filters,
      sorting: sorting,
    };
  },
};
