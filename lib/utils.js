function split(string, delimiter, limit)
{
  var _parts = [];
  var parts = string.split(delimiter);

  for(var i = 0; i < parts.length; i++) {
    if (i < limit) {
      _parts.push(parts[i]);
    }
    else {
      _parts[_parts.length - 1] += parts[i];
    }

    if (i >= limit - 1 && i < parts.length - 1) {
      _parts[_parts.length - 1] += delimiter;
    }
  }

  return _parts;
}
module.exports.split = split;