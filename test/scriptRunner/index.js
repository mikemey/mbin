const fsextra = require('fs-extra')
const chai = require('chai')
const should = chai.should()

const logMessage = msg => console.log(`==> ${msg}`)

const { createMockFile } = require('./mockFiles')
const createCommandPromise = require('./commandPromise')

const fixturesFilePath = file => {
  const fullPath = `test/fixtures/${file}`
  if (fsextra.existsSync(fullPath)) {
    return fullPath
  }
  throw new Error(`file doesn't exist: ${fullPath}`)
}

const ScriptRunner = () => {
  const mockFile = createMockFile()
  const data = {
    self: null,
    mockFile,
    commands: ['env', 'bash', '-i', fixturesFilePath('setup-env.sh'), mockFile.path],
    resultExpectFunc: null,
    exitCodeExpectFunc: null,
    dynamicMockMap: new Map(),
    allMockCommands: []
  }

  const command = (...cmd) => {
    data.commands.push(...cmd)
    return data.self
  }

  const expectOutput = expectedOutput => {
    data.resultExpectFunc = __ExpectationFunction(expectedOutput)
    return data.self
  }

  const expectExitCode = expectedExitCode => {
    data.exitCodeExpectFunc = __ExpectationFunction(expectedExitCode)
    return data.self
  }

  const mockEnvironment = (envName, envValue) => {
    logMessage('START mockEnvironment')
    data.mockFile.writeEnv(envName, envValue)
    logMessage('END mockEnvironment')
    return data.self
  }

  const mockCommand = (commandName, exitCode, retval = null) => {
    logMessage('START mockCommand')
    if (data.allMockCommands.includes(commandName)) {
      logMessage('if (data.allMockCommands.includes(commandName)) { --> throw new Error(command-mock defined twice:)')
      throw new Error(`command-mock defined twice: ${commandName}`)
    }
    data.allMockCommands.push(commandName)

    const bashFuncOpts = data.mockFile.writeFunc(commandName, exitCode, retval)
    if (bashFuncOpts.retvalFunc) {
      data.dynamicMockMap.set(commandName, bashFuncOpts)
    }

    logMessage('END mockCommand')
    return data.self
  }

  const execute = () => {
    logMessage('START execute', true)
    return createCommandPromise(data.dynamicMockMap, data.commands)
      .then(commandResult => {
        logMessage('Promise.all(commandPromiseObj.promise).then(result => {')
        if (data.resultExpectFunc) {
          logMessage('data.resultExpectFunc')
          data.resultExpectFunc(commandResult.output)
        }
        if (data.exitCodeExpectFunc) {
          logMessage('data.exitCodeExpectFunc')
          data.exitCodeExpectFunc(commandResult.exitCode)
        }
        logMessage('END execute')
      })
      .catch(__handleCatchAll)
      .finally(() => {
        logMessage('CLEANUP')
        data.mockFile.cleanup()
      })
  }

  const __handleCatchAll = err => {
    logMessage('START __handleCatchAll')
    if (err instanceof chai.AssertionError) {
      logMessage('if (err instanceof chai.AssertionError) {')
      should.fail(err.actual, err.expected, err.message)
    }
    if (err.stderr) {
      logMessage('if (err.stderr) {')
      should.fail(`SCRIPT error: ${err.stderr}`)
    }
    logMessage('END __handleCatchAll')
    throw err
  }

  const __ExpectationFunction = expectation => expectation instanceof Function
    ? expectation
    : output => output.should.equal(expectation)

  data.self = { command, execute, expectOutput, expectExitCode, fixturesFilePath, mockCommand, mockEnvironment }
  return data.self
}

module.exports = ScriptRunner
