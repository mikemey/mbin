require('chai')

const { ScriptRunner } = require('./scriptRunner')

xdescribe('trim_str tests', () => {
  const runner = () => ScriptRunner()
  // const verboseRunner = () => ScriptRunner({ verbose: true })

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
    .set('\nabc06\n', 'abc06')
    .set('\nabc07\ndef\n', 'abc07\ndef')

    .set('\tabc08', 'abc08')
    .set('abc09\t', 'abc09')
    .set('\tabc10\t', 'abc10')
    .set('\tabc11\tdef', 'abc11\tdef')

    .set('\r\n  abc12 \t def  \t  ', 'abc12 \t def')
    .set(' \r\nabc13 \n def  \n ', 'abc13')
    .set('\t  abc14 \t\n def \t \r\n ', 'abc14 \t\n def')

  inputStr.forEach((value, key) => {
    it(`trims string '${escape(key)}' --> '${escape(value)}'`, () => runner()
      .command('trim_str', key)
      .expectOutput(value)
      .execute()
    )
  })
})
