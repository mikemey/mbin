const spawn = require('child-process-promise').spawn
const fsextra = require('fs-extra')
const chai = require('chai')
const should = chai.should()

const { createFileWatcher, UnusedFileWatchError } = require('./fileWatcher')
const { createMockFile, writeRetvalFile } = require('./mockFiles')

const fixturesFilePath = file => {
  const fullPath = `test/fixtures/${file}`
  if (fsextra.existsSync(fullPath)) {
    return fullPath
  }
  throw new Error(`file doesn't exist: ${fullPath}`)
}

const fileWatcher = createFileWatcher()

const __toCommandPromise = (cmd, params) => spawn(cmd, params, { capture: ['stdout', 'stderr'] })
  .finally(fileWatcher.cleanup)

const __toMockPromise = mockOpts => {
  return fileWatcher.watchFileContent(mockOpts.parametersFile)
    .then(fileContent => {
      const params = fileContent.split(/(?<!\\) /).map(param => param.replace('\\ ', ' '))
      const funcResult = mockOpts.retvalFunc(...params)

      if (!funcResult) {
        throw new Error(`command-mock returns no value: ${mockOpts.originalName}`)
      }
      writeRetvalFile(mockOpts, funcResult)
    })
    .catch(err => {
      fileWatcher.cleanup()
      throw err instanceof UnusedFileWatchError
        ? new Error(`mock not used: [${mockOpts.originalName}]`)
        : err
    })
}

const ScriptRunner = () => {
  const mockFile = createMockFile()
  const data = {
    self: null,
    mockFile,
    cmd: 'env',
    params: ['bash', '-i', fixturesFilePath('setup-env.sh'), mockFile.path],
    resultFunc: null,
    dynamicMockOpts: [],
    allMockCommands: []
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

  const mockEnvironment = (envName, envValue) => {
    data.mockFile.writeEnv(envName, envValue)
    return data.self
  }

  const mockCommand = (commandName, exitCode, retval = '') => {
    if (data.allMockCommands.includes(commandName)) {
      throw new Error(`command-mock defined twice: ${commandName}`)
    }
    data.allMockCommands.push(commandName)

    const bashFuncOpts = data.mockFile.writeFunc(commandName, exitCode, retval)
    if (bashFuncOpts.retvalFunc) {
      data.dynamicMockOpts.push(bashFuncOpts)
    }

    return data.self
  }

  const execute = () => {
    const commandPromise = __toCommandPromise(data.cmd, data.params)
    const mockPromises = data.dynamicMockOpts.map(__toMockPromise)
    const shellPromises = mockPromises.concat(commandPromise)
    return Promise.all(shellPromises)
      .then(result => {
        if (data.resultFunc) {
          const spawnResult = result[result.length - 1]
          data.resultFunc(spawnResult.stdout.toString().trim())
        }
      })
      .catch(__handleCatchAll)
  }

  const __handleCatchAll = err => {
    if (err instanceof chai.AssertionError) {
      should.fail(err.actual, err.expected, err.message)
    }
    if (err.stderr) {
      should.fail(`SCRIPT error: ${err.stderr}`)
    }
    throw err
  }

  data.self = { command, execute, expectOutput, fixturesFilePath, mockCommand, mockEnvironment }
  return data.self
}

module.exports = ScriptRunner
