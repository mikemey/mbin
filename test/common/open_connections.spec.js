require('chai').should()

const { Bocks } = require('../../bocks')

describe('open_connections tests', () => {
  const Verbose = () => Bocks({ verbose: true })
  const openConnections = (...params) => Verbose()
    .command('open_connections', ...params)
  const openConnectionsSingle = (...params) => openConnections('-s', ...params)

  describe('input parameter checks', () => {
    const expectMissingProgramParameter = (...params) => openConnections(params)
      .expectOutput(/^Missing program parameter/)
      .expectExitCode(1)
      .execute()

    it('no parameters', () => expectMissingProgramParameter())
    it('single use no parameters', () => expectMissingProgramParameter('-s'))
  })

  describe('single runs', () => {
    it.only('calls lsof with correct parameters', () => {
      const programName = 'blabla'
      return openConnectionsSingle(programName)
        .mockCommand('lsof', 0, (p1, p2, p3) => {
          p1.should.equal('-i')
          p2.should.equal('tcp')
          p3.should.equal('-n')
          return `${programName}\n ${programName}`
        })
        .expectExitCode(0)
        .expectOutput(`connections matching '${programName}':        2    `)
        .execute()
    })
  })
})
