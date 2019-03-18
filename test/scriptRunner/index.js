const spawn = require('child-process-promise').spawn
const fsextra = require('fs-extra')
const EOL = require('os').EOL
const chai = require('chai')
const should = chai.should()
const { createFileWatcher, UnusedFileWatchError } = require('./fileWatcher')

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

const fileWatcher = createFileWatcher()

const toCommandPromise = (cmd, params) => spawn(cmd, params, { capture: ['stdout', 'stderr'] })
  .finally(fileWatcher.cleanup)

const toMockPromise = mockOpts => {
  return fileWatcher.watchFileContent(mockOpts.parametersFile)
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

const ScriptRunner = () => {
  const mockFile = tempFilePath('test.mocks', false)
  const data = {
    self: null,
    mockFile,
    cmd: 'env',
    params: ['bash', '-i', fixturesFilePath('setup-env.sh'), mockFile],
    resultFunc: null,
    dynamicMockOpts: [],
    allMockCommands: []
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
    const commandPromise = toCommandPromise(data.cmd, data.params)
    const mockPromises = data.dynamicMockOpts.map(toMockPromise)
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
    if (data.allMockCommands.includes(commandName)) {
      throw new Error(`command mocked twice: ${commandName}`)
    }
    data.allMockCommands.push(commandName)

    const bashFuncOpts = retval instanceof Function
      ? bashDynamicFunc(commandName, exitCode, retval)
      : bashStaticFunc(commandName, exitCode, retval)

    if (bashFuncOpts.func) {
      data.dynamicMockOpts.push(bashFuncOpts)
    }

    writeFile(data.mockFile, bashFuncOpts.output)
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
