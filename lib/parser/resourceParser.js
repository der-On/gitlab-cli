var defaults = require('../defaults');

function parse(argv, aliases)
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

  _resource = _resource.split('/', 4);



  if (_resource.length > 1) {
    _resource.forEach(function(part, i) {
      if (part.trim() === '') {
        console.error('invalid resource path');
        process.exit(1);
      }
    });
  }

// normalize resource
  resource.namespace = (_resource.length >= 2) ? _resource[0] : null;
  resource.project = (_resource.length >= 3) ? _resource[1] : null;
  resource.type = (_resource.length >= 3) ?
      (_resource[2].substr(-1,1) == 's') ? _resource[2] : _resource[2] + 's'
      : (_resource.length === 1) ? _resource[0] : _resource[1]
  ;
  resource.id = _resource[3] || null;

  return resource;
}
module.exports = parse;