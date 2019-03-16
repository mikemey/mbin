const chai = require('chai')
chai.use(require('chai-match'))

const ScriptRunner = require('./scriptRunner')
describe('bash tests', () => {
  beforeEach(() => {
    console.log('beforeEach')
  })

  afterEach(() => {
    console.log('afterEach')
  })

  const fixsturesDirectory = file => `test/fixtures/${file}`

  describe('basics', () => {
    it('runs user home bash profile/rc', () => {
      // console.log('echo ${BASH_VERSION%%[^0-9]*}')
      const runner = ScriptRunner()
      const testFile = fixsturesDirectory('bash-basics')
      return runner
        .command('ls', testFile)
        .stdout(output => output.should.match(new RegExp(`.*${testFile}\n$`)))
        .execute()
    })
  })
})
