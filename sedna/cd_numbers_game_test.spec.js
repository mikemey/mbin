const chai = require('chai')
chai.should()
const { createExpression, formatExpression, printExpression, solveNumbersGame } = require('./cd_numbers_game')

describe('expression formatter', () => {
  it('when plus/minus operator', () => {
    const expr = createExpression(
      createExpression(1, createExpression(2, 3, '-'), '+'),
      createExpression(4, 5, '-'),
      '-'
    )
    expr.formatted.should.equal('1 + 2 - 3 - 4 - 5')
  })

  it('when expression and sub-expression have multiply/divide operator', () => {
    const expr = createExpression(
      createExpression(createExpression(1, 2, '-'), 3, '*'),
      createExpression(4, createExpression(5, 6, '*'), '-'),
      '/'
    )
    expr.formatted.should.equal('(1 - 2) * 3 / (4 - 5 * 6)')
  })
})

describe('numbers solver', () => {
  const testData = [{
    numbers: [75, 1, 3, 1, 3, 6], target: 576, expected: [
      '(6 + 1 + 1) * (75 - 3)',
      '(6 + 3 - 1) * (75 - 3)',
      '(1 + 1 + 6) * (75 - 3)',
      '(75 / 3 - 1) * 6 * (1 + 3)',
      '(75 - 3) * (6 + 1 + 1)'
    ]
  }, {
    numbers: [5, 2, 3, 10, 6, 4], target: 609, expected: ['(5 + 2) * (3 + 6 * (10 + 4))']
  }, {
    numbers: [75, 25, 7, 10, 3, 7], target: 834, expected: ['10 * (75 - 7) + 7 * (25 - 3)']
  }, {
    numbers: [50, 100, 9, 1, 9, 3], target: 727, expected: ['3 * (100 + 9) + 50 * (9 - 1)']
  }, {
    numbers: [25, 50, 75, 9, 7, 2], target: 995, expected: ['50 + 9 * (75 + 25 + 7 - 2)']
  }]

  testData.forEach(data => {
    it(`when target is ${data.target}`, () => {
      const results = solveNumbersGame(data.numbers, data.target)

      const formattedResults = results.bestResults
        .filter(r => r.getResult() === data.target)
        .map(r => r.formatted)
      data.expected.forEach(expectation => {
        formattedResults.should.contain(expectation)
      })
    })
  })
})