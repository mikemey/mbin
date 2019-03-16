const chai = require('chai')
chai.use(require('chai-match'))

const ScriptRunner = require('./scriptRunner')

describe('bash tests', () => {
  let runner

  beforeEach(() => {
    runner = ScriptRunner()
  })

  describe('basics', () => {
    it('uses bash version 5', () => runner
      .command('echo', `\${BASH_VERSION%%[^0-9]*}`)
      .expectOut(output => output.should.equal('5'))
      .execute()
    )

    it('runs user home bash profile/rc', () => {
      const testFile = runner.fixturesDir('basic-bash-question.sh')
      return runner
        .command('ll', testFile)
        .expectOut(output => output.should.match(new RegExp(`.*${testFile}$`)))
        .execute()
    })

    it('can execute scripts-under-tests', () => runner
      .command('timelog', 'hello')
      .expectOut(output => output.should.match(new RegExp(`^\\[[0-9\\-: ]*]: hello$`)))
      .execute()
    )
  })

   describe('interactive', () => {
     it('can answer question', () => runner
       .command(runner.fixturesDir('basic-bash-question.sh'))
       .expectOut(output => output.should.equal('success')
       .execute()
     )
   })
})
