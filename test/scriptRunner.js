const spawn = require('child-process-promise').spawn
const fsextra = require('fs-extra')
const EOL = require('os').EOL
const chai = require('chai')
const should = chai.should()

const SHE_BANG = `#!/usr/bin/env bash ${EOL}`

const fixturesFilePath = file => {
  const fullPath = `test/fixtures/${file}`
  if (fsextra.existsSync(fullPath)) {
    return fullPath
  }
  throw new Error(`file doesn't exist: ${fullPath}`)
}

const tempFilePath = file => `.testtmp/${file}`

const writeFile = (file, data, createNew = false) => {
  const options = createNew ? {} : { flag: 'a' }
  fsextra.outputFileSync(file, data, options)
}

const readFile = file => fsextra.readFileSync(file).toString().trim()

const bashFunction = (commandName, exitCode, outputLine) => {
  return `[[ \`type -t "${commandName}"\` == "alias" ]] && unalias ${commandName} ${EOL}` +
    `function ${commandName} () { ${EOL}` +
    `  ${outputLine} ${EOL}` +
    `  $( exit ${exitCode} ) ${EOL}` +
    `} ${EOL}` +
    `export -f ${commandName} ${EOL}`
}

const bashStaticFunc = (commandName, exitCode, output) => {
  return {
    output: bashFunction(commandName, exitCode, `echo "${output}"`)
  }
}

const bashDynamicFunc = (commandName, exitCode) => {
  const uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const name = `${commandName}_${uid}`
  const parametersFile = tempFilePath(`${name}.parameters`)
  const retvalFile = tempFilePath(`${name}.retval`)
  return {
    parametersFile,
    retvalFile,
    output: bashFunction(commandName, exitCode, `waitForResponse "${parametersFile}" "${retvalFile}" "$@"`)
  }
}

const bashEnvironment = (envName, envValue) => {
  return `export ${envName}="${envValue}" ${EOL}`
}

const mockWatchObject = (func, opts) => {
  return {
    func,
    parametersFile: opts.parametersFile,
    retvalFile: opts.retvalFile
  }
}

const toMockWatcher = fileWatcher => watch => {
  return fileWatcher.watchFile(watch.parametersFile)
    .then(fileContent => {
      const params = fileContent.split(/(?<!\\) /).map(param => param.replace('\\ ', ' '))
      writeFile(watch.retvalFile, watch.func(...params), true)
    })
}

const createFileWatcher = () => {
  const allFileListener = []
  const tempDir = tempFilePath('')
  fsextra.ensureDirSync(tempDir)

  const watch = fsextra.watch(tempDir, (eventType, filename) => {
    const changeFilePath = tempFilePath(filename)
    allFileListener
      .filter(listener => listener.fileName === changeFilePath)
      .forEach(listener => listener.receivedContent(readFile(listener.fileName)))
  })

  const watchFile = fileName => {
    const fileListener = { fileName }
    const watchFilePromise = new Promise((resolve, reject) => {
      fileListener.abort = reject
      fileListener.receivedContent = fileContent => {
        fileListener.abort = () => { }
        resolve(fileContent)
      }
    })
    allFileListener.push(fileListener)
    return watchFilePromise
  }

  const cleanup = () => {
    fsextra.removeSync(tempDir)
    watch.close()
    let listener
    while ((listener = allFileListener.pop()) !== undefined) {
      listener.abort()
    }
  }

  return { cleanup, watchFile }
}

const ScriptRunner = () => {
  const mockFile = tempFilePath('test.mocks', false)
  const data = {
    self: null,
    mockFile,
    cmd: 'env',
    params: ['bash', '-i', fixturesFilePath('setup-env.sh'), mockFile],
    resultFunc: null,
    mockWatches: [],
    fileWatcher: null
  }

  const setup = () => {
    data.fileWatcher = createFileWatcher()
    writeFile(data.mockFile, SHE_BANG, true)
  }

  const command = (...cmd) => {
    data.params.push(...cmd)
    return data.self
  }

  const expectOutput = expectedOutput => {
    data.resultFunc = expectedOutput instanceof Function
      ? expectedOutput
      : output => output.should.equal(expectedOutput)
    return data.self
  }

  const handleShellError = err => {
    console.log(err)
    if (err.stderr) {
      should.fail(`SCRIPT error: ${err.stderr}`)
    }
    should.fail(`RUNNER error: ${err.message}: ${err.code}`)
  }

  const execute = () => {
    const allPromises = data.mockWatches.map(toMockWatcher(data.fileWatcher))
    allPromises.push(spawn(data.cmd, data.params, { capture: ['stdin', 'stdout', 'stderr'] }))
    return Promise.all(allPromises)
      .then(result => {
        const spawnResult = result[result.length - 1]
        return data.resultFunc(spawnResult.stdout.toString().trim())
      })
      .catch(err => err instanceof chai.AssertionError
        ? should.fail(err.actual, err.expected, err.message)
        : handleShellError(err)
      )
      .finally(data.fileWatcher.cleanup)
  }

  const mockCommand = (commandName, exitCode, retval = '') => {
    const bashFuncOpts = retval instanceof Function
      ? bashDynamicFunc(commandName, exitCode)
      : bashStaticFunc(commandName, exitCode, retval)
    writeFile(data.mockFile, bashFuncOpts.output)

    if (bashFuncOpts.parametersFile) {
      data.mockWatches.push(mockWatchObject(retval, bashFuncOpts))
    }
    return data.self
  }

  const mockEnvironment = (envName, envValue) => {
    writeFile(data.mockFile, bashEnvironment(envName, envValue))
    return data.self
  }

  data.self = { command, execute, expectOutput, fixturesFilePath, mockCommand, mockEnvironment }
  setup()
  return data.self
}

module.exports = ScriptRunner
