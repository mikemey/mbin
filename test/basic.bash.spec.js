const spawn = require('child-process-promise').spawn
const cp = require('child_process')
const chai = require('chai')
const should = chai.should()
chai.use(require('chai-match'))

describe('bash tests', () => {
  beforeEach(() => {
    console.log('beforeEach')
  })

  afterEach(() => {
    console.log('afterEach')
  })

  const scriptRunner = () => {
    const data = {
      self: null,
      cmd: null,
      params: null,
      resultFunc: null
    }

    const command = (cmd, paramsIn) => {
      data.cmd = cmd
      data.params = Array.isArray(paramsIn)
        ? paramsIn
        : [paramsIn]
      return data.self
    }

    const stdout = resultFunc => {
      data.resultFunc = resultFunc
      return data.self
    }

    const handleShellError = err => {
      if (err.stderr) {
        should.fail(`SCRIPT error: ${err.stderr}`)
      }
      should.fail(`SCRIPT error: ${err.syscall}: ${err.code}`)
    }

    const execute = () => {
      // const n = cp.fork(`${__dirname}/sub.js`)
      // n.on('message', m => {
      //   console.log('PARENT got message:', m)
      // })
      // // Causes the child to print: CHILD got message: { hello: 'world' }
      // n.send({ hello: 'world' });

      return spawn(data.cmd, data.params, { capture: ['stdin', 'stdout', 'stderr'] })
        .then(result => data.resultFunc(result.stdout.toString()))
        .catch(err => err instanceof chai.AssertionError
          ? should.fail(err.actual, err.expected, err.message)
          : handleShellError(err)
        )
    }
    data.self = { command, execute, stdout }
    return data.self
  }

  const fixsturesDirectory = file => `test/fixtures/${file}`

  describe('basics', () => {
    it('runs bash version 5', () => {
      // console.log('echo ${BASH_VERSION%%[^0-9]*}')
      const runner = scriptRunner()
      const testFile = fixsturesDirectory('bash-basics')
      return runner
        .command('ls', testFile)
        .stdout(output => {
          console.log('================== HEREREREREREREER')
          console.log(output)
          console.log('================== HEREREREREREREER')
          const fileRE = new RegExp(`.*${testFile}\n$`)
          return output.should.match(fileRE)
        })
        .execute()
    })
  })
})
