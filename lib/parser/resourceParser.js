var defaults = require('../defaults');
var split = require('../utils').split;

function parse(argv, aliases, data)
{
  var resource = defaults.resource();
  var _resource = argv._[1] || '';
  _resource.trim();

// resolve aliases
  for(var alias in aliases) {
    if (_resource.indexOf(alias + '/') === 0) {
      _resource = _resource.replace(alias, aliases[alias]);
      continue;
    }
  }

  _resource = split(_resource, '/', 4);



  if (_resource.length > 1) {
    _resource.forEach(function(part, i) {
      if (part.trim() === '') {
        console.error('invalid resource path');
        process.exit(1);
      }
    });
  }

// normalize resource
  resource.namespace = data.namespace ? data.namespace : (_resource.length >= 2) ? _resource[0] : null;
  resource.project = data.project ? data.project : (_resource.length >= 3) ? _resource[1] : null;
  resource.type = data.type ? data.type : (_resource.length >= 3) ?
      _resource[2] : (_resource.length === 1) ? _resource[0] : _resource[1]
  ;
  resource.id = data.id ? data.id : _resource[3] || null;

  if (resource.type.length > 0 && resource.type.substr(-1,1) !== 's') {
    resource.type += 's';
  }

  return resource;
}
module.exports = parse;