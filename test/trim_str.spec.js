require('chai')

const { ScriptRunner } = require('./scriptRunner')

describe('trim_str tests', () => {
  const runner = () => ScriptRunner()
  const verboseRunner = () => ScriptRunner({ verbose: true })

  const escape = v => v.replace(/\n/g, '\\n').replace(/\t/g, '\\t')

  const inputStr = new Map()
    .set('', '')
    .set('   ', '')
    .set(' \n  \t  ', '')

    .set('abc01', 'abc01')
    .set('   abc02', 'abc02')
    .set('abc03  ', 'abc03')
    .set('   abc04 def  ', 'abc04 def')

    .set('\nabc05', 'abc05')
    .set('abc06\n', 'abc06')
  //  .set('\nabc07\n', 'abc07')
  //  .set('\nabc08\ndef\n', 'abc08\ndef')

  //     .set('\tabc09', 'abc09')
  //     .set('abc10\t', 'abc10')
  //     .set('\tabc11\t', 'abc11')
  // .set('\tabc12\tdef', 'abc12\tdef')

  // .set('\r\n  abc13 \t def  \t  ', 'abc13 \t def')
  // .set(' \r\nabc14 \n def  \n ', 'abc14')
  // .set('\t  abc15 \t\n def \t \r\n ', 'abc15 \t\n def')

  inputStr.forEach((value, key) => {
    it.only(`trims string '${escape(key)}' --> '${escape(value)}'`, () => verboseRunner()
      .command('trim_str', key)
      .expectOutput(value)
      .execute()
    )
  })
})
