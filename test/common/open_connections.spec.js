require('chai').should()

const { Bocks } = require('../../bocks')

describe('open_connections tests', () => {
  xit('runs open_connections', () => Bocks({ verbose: true })
    .command('open_connections')
    .expectOutput(out => {
      out.should.match(/Missing program parametexr/)
    })
    .execute()
  )
})
