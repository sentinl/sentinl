({
  dashboard: {
    order: 1,
    show: (_, mappings) => JSON.stringify(mappings).includes('{"type":"geo_point"}'),
    checkForError: dashboardQuery => {
      if (dashboardQuery.filters.find(f => f.meta.type === 'geo_bounding_box')) {
        return '';
      } else {
        return 'Dashboard must have a geo bounding box filter';
      }
    }
  },
  search: (client, searchParams) => client.search(searchParams.defaultRequest),
  condition: response => !!response.hits.total
});
