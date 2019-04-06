const fsextra = require('fs-extra')

const createMockFile = require('./mockFile')
const createCommandPromise = require('./commandPromise')

const DEFAULT_OPTIONS = {
  mockFile: 'bocks.mock',
  keepMockFile: false,
  logFile: 'bocks.log',
  verbose: false
}
const FORBIDDEN_COMMANDS = ['', 'command', 'output_log', 'source_profiles', 'local',
  'send_to_node', 'read_from_node', 'send_command_result', 'invoke_mock_callback', 'safe_json']

const safeCommandName = (originCommand, log) => {
  const commandName = originCommand.trim ? originCommand.trim() : originCommand
  if (FORBIDDEN_COMMANDS.includes(commandName)) {
    log('if (FORBIDDEN_COMMANDS.includes(commandName)) { --> throw new Error(cant mock command)')
    throw new Error(`can't mock command '${originCommand}'`)
  }
  return commandName
}

const toEscapedParameter = parameter => `"${parameter}"`

const fixturesFilePath = file => {
  const fullPath = `${__dirname}/fixtures/${file}`
  if (fsextra.existsSync(fullPath)) {
    return fullPath
  }
  throw new Error(`file doesn't exist: ${fullPath}`)
}

const Bocks = (optsOverride = {}) => {
  const options = Object.assign({}, DEFAULT_OPTIONS, optsOverride)

  const logMessage = options.verbose
    ? msg => console.log(`==> ${msg}`)
    : () => { }

  if (options.verbose) {
    logMessage('OPTIONS: ========================')
    console.log(options)
  }
  const mockFile = createMockFile(options.mockFile)
  const data = {
    self: null,
    mockFile,
    commands: ['env', 'bash', '-i', fixturesFilePath('setup-env.sh'), mockFile.path, options.verbose, options.logFile],
    getExecCommand: () => data.commands[7],
    resultExpectFunc: null,
    exitCodeExpectFunc: null,
    dynamicMockMap: new Map(),
    allMockCommands: []
  }

  const command = (...commands) => {
    const execCommand = safeCommandName(commands.shift(), logMessage)
    data.commands.push(execCommand, ...commands.map(toEscapedParameter))
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
    data.mockFile.writeEnv(envName, envValue)
    return data.self
  }

  const mockCommand = (originCommandName, exitCode = 0, retval = null) => {
    logMessage('START mockCommand')
    const commandName = safeCommandName(originCommandName, logMessage)
    if (data.allMockCommands.includes(commandName)) {
      logMessage('if (data.allMockCommands.includes(commandName)) { --> throw new Error(command-mock defined twice:)')
      throw new Error(`command-mock defined twice: ${originCommandName}`)
    }
    data.allMockCommands.push(commandName)

    const bashFuncOpts = data.mockFile.writeFunc(commandName, exitCode, retval)
    if (bashFuncOpts.retvalFunc) {
      logMessage('add dynamic mockCommand')
      data.dynamicMockMap.set(commandName, bashFuncOpts)
    }

    return data.self
  }

  const execute = () => {
    logMessage('START execute', true)

    const cpLogPrefix = `[command '${data.getExecCommand()}']:`
    const cpLog = msg => logMessage(`${cpLogPrefix} ${msg}`)
    return createCommandPromise(cpLog, data.dynamicMockMap, data.commands)
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
      .finally(() => {
        if (!options.keepMockFile) {
          logMessage('CLEANUP')
          data.mockFile.cleanup()
        }
      })
  }

  const __ExpectationFunction = expectation => {
    if (expectation instanceof Function) { return expectation }
    return output => {
      if (output !== expectation) {
        throw new Error(`expected '${output}' to equal '${expectation}'`)
      }
    }
  }

  data.self = { command, execute, expectOutput, expectExitCode, mockCommand, mockEnvironment }
  return data.self
}

module.exports = { Bocks, DEFAULT_OPTIONS }
