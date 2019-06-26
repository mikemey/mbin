require('chai').should()

const { Bocks } = require('../../bocks')

describe('open_connections tests', () => {
  const Verbose = () => Bocks({ verbose: true })

  describe.only('input parameter checks', () => {
    const expectMissingProgramParameter = (...commands) => Bocks()
      .command(...commands)
      .expectOutput(/Missing program parameter/)
      .expectExitCode(1)
      .execute()

    it('no parameters', () => expectMissingProgramParameter('open_connections'))
    it('single use no parameters', () => expectMissingProgramParameter('open_connections', '-s'))
  })
})
