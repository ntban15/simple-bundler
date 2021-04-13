const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

let globalId = 0;

function parseModule(filename) {
  const fileContent = fs.readFileSync(filename, { encoding: "utf-8" });

  const ast = parser.parse(fileContent, { sourceType: "module" });

  const dependencies = [];

  traverse(ast, {
    ImportDeclaration: function (path) {
      const dependency = path.node.source.value;
      dependencies.push(dependency);
    },
  });

  const { code } = babel.transformSync(fileContent, {
    presets: ["@babel/preset-env"],
  });

  return {
    id: globalId++,
    filename,
    dependencies,
    code,
  };
}

function generateGraph(entryfile) {
  const mainModule = parseModule(entryfile);

  const moduleQueue = [mainModule];

  for (const module of moduleQueue) {
    module.mapping = {};
    const moduleDir = path.dirname(module.filename);

    module.dependencies.forEach(function (dependency) {
      const dependencyPath = path.join(moduleDir, dependency);
      const dependencyModule = parseModule(dependencyPath);

      module.mapping[dependency] = dependencyModule.id;

      moduleQueue.push(dependencyModule);
    });
  }

  return moduleQueue;
}

function bundle(entryfile) {
  let modules = "";

  const graph = generateGraph(entryfile);

  graph.forEach(function (module) {
    modules += `${module.id}: [
      function(require, module, exports) {
        ${module.code}
      },
      ${JSON.stringify(module.mapping)}
    ],`;
  });

  return `
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id];

        function scopedRequire(relativePath) {
          return require(mapping[relativePath]);
        }

        const moduleObj = { exports: {} };

        fn(scopedRequire, moduleObj, moduleObj.exports);

        return moduleObj.exports;
      }

      require(0);
    })({${modules}});
  `;
}

console.log(bundle(path.join(process.cwd(), "./example/index.js")));
