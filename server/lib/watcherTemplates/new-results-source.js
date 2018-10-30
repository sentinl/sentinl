({
  dashboard: {
    order: 0
  },
  search: (client, searchParams) => client.search(searchParams.defaultRequest),
  condition: response => !!response.hits.total
});
