function resource(data)
{
  if (typeof data !== 'object') {
    data = {};
  }

  return {
    namespace: data.namespace || null,
    project: data.project || null,
    type: data.type || null,
    id: data.id || null
  };
}
module.exports.resource = resource;

function options(data)
{
  if (typeof data !== 'object') {
    data = {};
  }

  return {
    username: data.username || "me",
    filters: data.filters || null,
    json: data.json || false,
    data: data.data || null,
    dataJson: data.dataJson || null,
    debug: false
  };
}
module.exports.options = options;

function data(data)
{
  if (typeof data !== 'object') {
    data = {};
  }

  var _data = {
    title: data.title || null,
    description: data.description || null,
    labels: data.labels || null
  };

  for(var key in data) {
    _data[key] = data[key];
  }

  return data;
}
module.exports.data = data;