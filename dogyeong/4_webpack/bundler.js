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
  const inputCode = fs.readFileSync(fileName, { encoding: 'utf-8' })
  const { code } = babel.transformSync(inputCode, {
    presets: [
      [
        '@babel/preset-react',
        {
          name: '@babel/preset-env',
          options: {
            target: 'last 1 chrome version',
          },
        },
      ],
    ],
  })
  return code
}

function generateRuntimeCode() {
  let metadata = ''
  const fileToId = ''

  dependencyArray.forEach((dependency, index) => {
    metadata += `${dependency.id}: {`
  })
}

buildDependencyArray(path.resolve(import.meta.dirname, '../3_tanstack-query/main.jsx'))
console.debug(dependencyArray)
