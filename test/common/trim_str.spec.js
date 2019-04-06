require('chai')

const { Bocks } = require('../../bocks')

describe('trim_str tests', () => {
  const escape = v => v.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')

  const inputStr = new Map()
    .set('abc', 'abc')
    .set('abc def', 'abc def')
    .set('abc\t\ndef', 'abc\t\ndef')
    .set('', '')
    .set('   ', '')
    .set(' \n  \t  ', '')

    .set('abc01', 'abc01')
    .set('   abc02', 'abc02')
    .set('abc03  ', 'abc03')
    .set('   abc04 def  ', 'abc04 def')

    .set('\nabc05', 'abc05')
    .set('abc06\n', 'abc06')
    .set('\nabc07\n', 'abc07')
    .set('\nabc08\ndef\n', 'abc08\ndef')

    .set('\tabc09', 'abc09')
    .set('abc10\t', 'abc10')
    .set('\tabc11\n\t', 'abc11')
    .set('\n \t  \n   abc12 \n   \t def \n   \t  ', 'abc12 \n   \t def')

    .set('\r\n  abc13 \t def  \t  ', 'abc13 \t def')
    .set(' \r\nabc14 \n def  \n ', 'abc14 \n def')
    .set('\t  abc15 \t\n def \t \r\n ', 'abc15 \t\n def')

  inputStr.forEach((value, key) => {
    it(`trims string '${escape(key)}' --> '${escape(value)}'`, () => Bocks()
      .command('trim_str', key)
      .expectOutput(value)
      .execute()
    )
  })
})
