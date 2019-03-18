const spawn = require('child-process-promise').spawn
const fsextra = require('fs-extra')
const EOL = require('os').EOL
const chai = require('chai')
const should = chai.should()

const SHE_BANG = `#!/usr/bin/env bash ${EOL}`

class UnusedFileWatchError extends Error {
  constructor (...params) {
    super(...params)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnusedFileWatchError)
    }
  }
}

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

const bashDynamicFunc = (commandName, exitCode, func) => {
  const uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const name = `${commandName}_${uid}`
  const parametersFile = tempFilePath(`${name}.parameters`)
  const retvalFile = tempFilePath(`${name}.retval`)
  return {
    func,
    originalName: commandName,
    parametersFile,
    retvalFile,
    output: bashFunction(commandName, exitCode, `wait_for_function_result "${parametersFile}" "${retvalFile}" "$@"`)
  }
}

const bashEnvironment = (envName, envValue) => {
  return `export ${envName}="${envValue}" ${EOL}`
}

const toCommandPromise = (cmd, params, fileWatcher) => spawn(cmd, params, { capture: ['stdout', 'stderr'] })
  .finally(fileWatcher.cleanup)

const toMockPromise = fileWatcher => mockOpts => {
  return fileWatcher.watchFile(mockOpts.parametersFile)
    .then(fileContent => {
      const params = fileContent.split(/(?<!\\) /).map(param => param.replace('\\ ', ' '))
      writeFile(mockOpts.retvalFile, mockOpts.func(...params), true)
    })
    .catch(err => {
      fileWatcher.cleanup()
      throw err instanceof UnusedFileWatchError
        ? new Error(`mock not used: [${mockOpts.originalName}]`)
        : err
    })
}

const createFileWatcher = () => {
  const data = {
    allFileListener: [],
    tempDir: tempFilePath(''),
    watch: null
  }

  const _addFileListener = fileListener => {
    data.allFileListener.push(fileListener)
    if (!data.watch) {
      fsextra.ensureDirSync(data.tempDir)
      data.watch = fsextra.watch(data.tempDir, (_, filename) => {
        const changeFilePath = tempFilePath(filename)
        data.allFileListener
          .filter(listener => listener.fileName === changeFilePath)
          .forEach(listener => listener.receivedContent(readFile(listener.fileName)))
      })
    }
  }

  const watchFile = fileName => {
    const fileListener = { fileName }
    const watchFilePromise = new Promise((resolve, reject) => {
      fileListener.abort = () => reject(new UnusedFileWatchError())
      fileListener.receivedContent = fileContent => {
        delete fileListener.abort
        resolve(fileContent)
      }
    })
    _addFileListener(fileListener)
    return watchFilePromise
  }

  const cleanup = () => {
    if (fsextra.existsSync(data.tempDir)) {
      fsextra.removeSync(data.tempDir)
    }
    if (data.watch) {
      data.watch.close()
      data.allFileListener.filter(l => l.abort).forEach(l => l.abort())
      data.allFileListener = []
      data.watch = null
    }
  }
  process.on('exit', cleanup)

  return { cleanup, watchFile }
}

const fileWatcher = createFileWatcher()

const ScriptRunner = () => {
  const mockFile = tempFilePath('test.mocks', false)
  const data = {
    self: null,
    mockFile,
    cmd: 'env',
    params: ['bash', '-i', fixturesFilePath('setup-env.sh'), mockFile],
    resultFunc: null,
    mockOpts: []
  }

  const setup = () => {
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

  const handleCatchAll = err => {
    if (err instanceof chai.AssertionError) {
      should.fail(err.actual, err.expected, err.message)
    }
    if (err.stderr) {
      should.fail(`SCRIPT error: ${err.stderr}`)
    }
    throw err
  }

  const execute = () => {
    const commandPromise = toCommandPromise(data.cmd, data.params, fileWatcher)
    const mockPromises = data.mockOpts.map(toMockPromise(fileWatcher))
    const shellPromises = mockPromises.concat(commandPromise)
    return Promise.all(shellPromises)
      .then(result => {
        if (data.resultFunc) {
          const spawnResult = result[result.length - 1]
          data.resultFunc(spawnResult.stdout.toString().trim())
        }
      })
      .catch(handleCatchAll)
  }

  const mockCommand = (commandName, exitCode, retval = '') => {
    const bashFuncOpts = retval instanceof Function
      ? bashDynamicFunc(commandName, exitCode, retval)
      : bashStaticFunc(commandName, exitCode, retval)
    writeFile(data.mockFile, bashFuncOpts.output)

    if (bashFuncOpts.func) {
      data.mockOpts.push(bashFuncOpts)
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
