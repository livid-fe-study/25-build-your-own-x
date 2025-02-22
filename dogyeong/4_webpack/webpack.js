import fs from 'node:fs'
import path from 'node:path'
import babel from '@babel/core'
import babylon from 'babylon'

let ID = -1
const dependencyArray = []
const fileNameToIdIndex = []

function getDependencies(fileName) {
  const contents = fs.readFileSync(fileName, { encoding: 'utf-8' })
  const deps = []
  for (const line of contents.split('\n')) {
    if (line.includes('import')) {
      let filePath = line.split('from')[1]
      filePath = filePath.replace(';', '').trim()
      filePath = filePath.replace(/'/g, '').trim()
      deps.push(path.resolve(fileName, '../', filePath))
    }
  }
  return deps
}

function buildDependencyArray(fileName) {
  const dependencies = getDependencies(fileName)
  const code = transpile(fileName)
  ID = ++ID
  dependencyArray.push({
    id: ID,
    fileName: fileName,
    dependencies: dependencies,
    code,
  })
  fileNameToIdIndex.push(fileName)
  for (const dep of dependencies) {
    buildDependencyArray(dep)
  }
}

function transpile(fileName) {
  let inputCode = fs.readFileSync(fileName, { encoding: 'utf-8' })
  
  for (const line of inputCode.split('\n')) {
    if (line.startsWith('import')) {
      let filePath = line.split('from')[1].replace(/['";]/g, '').trim()
      const absolutePath = path.resolve(fileName, '../', filePath)
      const newLine = line.replace(filePath, absolutePath)
      inputCode = inputCode.replace(line, newLine)
    }
  }
  
  const { code } = babel.transformSync(inputCode, {
    presets: [
      '@babel/preset-react',
      [
        '@babel/preset-env',
        {
          targets: 'last 1 chrome version',
          modules: 'cjs',
        },
      ],
    ],
  })
  return code
}

function generateRuntimeCode() {
  let metadata = ''
  let fileToId = ''
  dependencyArray.forEach((obj) => {
    metadata += `${obj.id}:function(exports){${obj.code}},`
  })
  fileNameToIdIndex.forEach((file, index) => {
    fileToId += `\'${file}\':\'${index}\',`
  })
  return `(function(metadata,fileToIdMapping){
        window.require = function require(fileName){
            const id = fileToIdMapping[fileName];
            const f = metadata[id];
            let expObject = {};
            f(expObject);
            return expObject;
        }
        const mainFunction = metadata['0'];
        mainFunction();
    })({${metadata}},{${fileToId}})`
}

buildDependencyArray(
  path.resolve(import.meta.dirname, '../3_tanstack-query/main.jsx'),
)
fs.writeFileSync('./bundle.js', generateRuntimeCode(), { encoding: 'utf-8' })
