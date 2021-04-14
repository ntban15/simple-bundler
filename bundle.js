const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

let globalId = 0;

function createModuleParser() {
  const parsedModules = {};

  function parse(filename) {
    if (parsedModules[filename]) {
      return parsedModules[filename];
    }

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

    parsedModules[filename] = {
      id: globalId++,
      filename,
      dependencies,
      code,
    };

    return parsedModules[filename];
  }

  return parse;
}

function generateGraph(entryfile) {
  const parseModule = createModuleParser();

  const mainModule = parseModule(entryfile);

  const modulesSet = new Set([mainModule]);

  for (const module of modulesSet) {
    module.mapping = {};
    const moduleDir = path.dirname(module.filename);

    module.dependencies.forEach(function (dependency) {
      const dependencyPath = path.join(moduleDir, dependency);
      const dependencyModule = parseModule(dependencyPath);

      module.mapping[dependency] = dependencyModule.id;

      // parseModule is memoized so it is safe to add the result the Set without duplicated modules
      modulesSet.add(dependencyModule);
    });
  }

  return modulesSet;
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

  const bundleCore = fs.readFileSync("./bundle-core.js", { encoding: "utf-8" });
  const { code: transpiledBundleCore } = babel.transformSync(bundleCore, {
    presets: ["@babel/preset-env"],
  });

  return `
    (function(modules) {
      ${transpiledBundleCore}
    })({${modules}});
  `;
}

console.log(
  bundle(path.join(process.cwd(), "./example/dependency-cycle/index.js"))
);
