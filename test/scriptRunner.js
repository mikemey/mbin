const spawn = require('child-process-promise').spawn
const fs = require('fs')
const chai = require('chai')
const should = chai.should()

const ScriptRunner = () => {
  const fixturesDir = file => {
    const fullPath = `test/fixtures/${file}`
    if (fs.existsSync(fullPath)) {
      return fullPath
    }
    throw new Error(`file doesn't exist: ${fullPath}`)
  }

  const data = {
    self: null,
    cmd: 'env',
    params: ['bash', '-i', fixturesDir('setup-env.sh')],
    resultFunc: null
  }

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
    should.fail(`SCRIPT error: ${err.syscall}: ${err.code}`)
  }

  const execute = () => spawn(data.cmd, data.params, { capture: ['stdin', 'stdout', 'stderr'] })
    .then(result => data.resultFunc(result.stdout.toString().trim()))
    .catch(err => err instanceof chai.AssertionError
      ? should.fail(err.actual, err.expected, err.message)
      : handleShellError(err)
    )

  data.self = { command, execute, expectOut, fixturesDir }
  return data.self
}

module.exports = ScriptRunner
