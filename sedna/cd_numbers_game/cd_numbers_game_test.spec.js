const chai = require('chai')
const { createExpression } = require('./expression')
const { solveNumbersGame } = require('./index')
chai.should()

describe('expression formatter', () => {
  const testData = [{
    expression: createExpression(
      createExpression(1, createExpression(2, 3, '-'), '+'),
      createExpression(4, 5, '+'),
      '-'
    ),
    expectedResult: -9,
    expectedWeight: 5,
    expectedFormat: '1 + 2 - 3 - (4 + 5)'
  }, {
    expression: createExpression(
      createExpression(createExpression(1, 3, '+'), 3, '*'),
      createExpression(14, createExpression(4, 4, '+'), '-'),
      '/'
    ),
    expectedResult: 2,
    expectedWeight: 6,
    expectedFormat: '(1 + 3) * 3 / (14 - (4 + 4))'
  }, {
    expression: createExpression(25, createExpression(9, createExpression(3, 5, '*'), '+'), '-'),
    expectedResult: 1,
    expectedWeight: 4,
    expectedFormat: '25 - (9 + 3 * 5)'
  }, {
    expression: createExpression(25, createExpression(9, 3, '+'), '-'),
    expectedResult: 13,
    expectedWeight: 3,
    expectedFormat: '25 - (9 + 3)'
  }, {
    expression: createExpression(createExpression(25, 9, '-'), 3, '+'),
    expectedResult: 19,
    expectedWeight: 3,
    expectedFormat: '25 - 9 + 3'
  }, {
    expression: createExpression(
      createExpression(100, createExpression(9, 3, '-'), '*'),
      createExpression(5, createExpression(75, 25, '/'), '-'),
      '-'
    ),
    expectedResult: 598,
    expectedWeight: 6,
    expectedFormat: '100 * (9 - 3) - (5 - 75 / 25)'
  }]

  testData.forEach(data =>
    it(`formatted is ${data.expectedFormat}`, () => {
      data.expression.getResult().should.equal(data.expectedResult)
      data.expression.getWeight().should.equal(data.expectedWeight)
      data.expression.formatted.should.equal(data.expectedFormat)
    })
  )
})

describe('numbers solver', () => {
  const testData = [{
    numbers: [75, 1, 3, 1, 3, 6], target: 576, expected: [
      '(75 - 3) * (6 + 3 - 1)',
      '(75 - 3) * (6 + 1 + 1)',
      '(75 - 3) * (6 - 1 + 3)',
      '(75 / 3 - 1) * 6 * (3 + 1)'
    ]
  }, {
    numbers: [5, 2, 3, 10, 6, 4], target: 609, expected: ['((10 + 4) * 6 + 3) * (5 + 2)']
  }, {
    numbers: [75, 25, 7, 10, 3, 7], target: 834, expected: ['(75 - 7) * 10 + (25 - 3) * 7']
  }, {
    numbers: [50, 100, 9, 1, 9, 3], target: 727, expected: ['50 * (9 - 1) + (100 + 9) * 3']
  }, {
    numbers: [25, 50, 75, 9, 7, 2], target: 995, expected: ['(75 + 25 + 7 - 2) * 9 + 50']
  }, {
    numbers: [25, 75, 100, 3, 9, 5], target: 601, expected: []
  }, {
    numbers: [25, 75, 100, 3, 9, 5], target: 598, expected: []
  }]

  testData.forEach(data =>
    it(`when target is ${data.target}`, () => {
      const results = solveNumbersGame(data.numbers, data.target)

      results.bestResults
        .forEach(expr => eval(expr.formatted).should.equal(expr.getResult(), expr.formatted))

      const formattedResults = results.bestResults
        .filter(r => r.getResult() === data.target)
        .map(r => {
          console.log(r.formatted)
          return r.formatted
        })
      data.expected.forEach(expectation => {
        formattedResults.should.contain(expectation)
      })
    })
  )

  it('best results are sorted by weight', () => {
    const results = solveNumbersGame([25, 75, 100, 3, 9, 5], 601)

    results.bestResults
      .map(expression => `w: ${expression.getWeight()} - ${expression.formatted} = ${expression.getResult()}`)
      .should.deep.equal([
      'w: 5 - (100 + 25 - 3) * 5 - 9 = 601',
      'w: 5 - (100 - 3 + 25) * 5 - 9 = 601',
      'w: 6 - (100 - 75) * 25 - 9 - 5 * 3 = 601',
      'w: 6 - (100 - 75) * 25 - (5 * 3 + 9) = 601',
      'w: 6 - (100 - 75) * 25 - 5 * 3 - 9 = 601',
      'w: 3 - 100 * (9 - 3) = 600',
      'w: 3 - 75 * (5 + 3) = 600',
      'w: 4 - (75 + 25) * (9 - 3) = 600',
      'w: 4 - 100 * 5 + 75 + 25 = 600',
      'w: 4 - (75 + 25 + 100) * 3 = 600'
    ])
  })
})