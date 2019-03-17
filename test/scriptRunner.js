const spawn = require('child-process-promise').spawn
const fs = require('fs')
const EOL = require('os').EOL
const chai = require('chai')
const should = chai.should()

const SHE_BANG = `#!/usr/bin/env bash${EOL}`

const writeFile = (file, data, createNew = false) => {
  const options = createNew ? {} : { flag: 'a' }
  fs.writeFileSync(file, data, options)
}

const bashFunction = (commandName, exitCode) => {
  return `unalias ${commandName} ${EOL}` +
    `function ${commandName} () { ${EOL}` +
    `$(exit ${exitCode}) ${EOL}` +
    `} ${EOL}` +
    `export -f ${commandName} ${EOL}`
}

const bashEnvironment = (envName, envValue) => {
  return `export ${envName}="${envValue}" ${EOL}`
}

const ScriptRunner = () => {
  const fixturesDir = (file, checkExists = true) => {
    const fullPath = `test/fixtures/${file}`
    if (!checkExists || fs.existsSync(fullPath)) {
      return fullPath
    }
    throw new Error(`file doesn't exist: ${fullPath}`)
  }

  const mockFile = fixturesDir('.test.mocks', false)
  const data = {
    self: null,
    mockFile,
    cmd: 'env',
    params: ['bash', '-i', fixturesDir('setup-env.sh'), mockFile],
    resultFunc: null
  }

  const setup = () => { writeFile(data.mockFile, SHE_BANG, true) }
  const cleanup = () => { fs.unlinkSync(data.mockFile) }

  const command = (...cmd) => {
    data.params.push(...cmd)
    return data.self
  }

  const expectOut = resultFunc => {
    data.resultFunc = resultFunc
    return data.self
  }

  const handleShellError = err => {
    if (err.stderr) {
      should.fail(`SCRIPT error: ${err.stderr}`)
    }
    should.fail(`RUNNER error: ${err.syscall}: ${err.code}`)
  }

  const execute = () => spawn(data.cmd, data.params, { capture: ['stdin', 'stdout', 'stderr'] })
    .then(result => data.resultFunc(result.stdout.toString().trim()))
    .catch(err => err instanceof chai.AssertionError
      ? should.fail(err.actual, err.expected, err.message)
      : handleShellError(err)
    )

  const mockCommand = (commandName, exitCode) => {
    writeFile(data.mockFile, bashFunction(commandName, exitCode))
    return data.self
  }

  const mockEnvironment = (envName, envValue) => {
    writeFile(data.mockFile, bashEnvironment(envName, envValue))
    return data.self
  }

  data.self = { command, execute, expectOut, fixturesDir, mockCommand, mockEnvironment, cleanup }
  setup()
  return data.self
}

module.exports = ScriptRunner
