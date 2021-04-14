const moduleObjMapping = {};

function require(id) {
  if (moduleObjMapping[id]) {
    return moduleObjMapping[id].exports;
  }

  const [fn, mapping] = modules[id];

  function scopedRequire(relativePath) {
    return require(mapping[relativePath]);
  }

  const moduleObj = { exports: {} };
  moduleObjMapping[id] = moduleObj;

  fn(scopedRequire, moduleObj, moduleObj.exports);

  return moduleObj.exports;
}

require(0);
