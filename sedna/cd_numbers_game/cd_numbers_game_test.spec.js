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
    expectedFormat: '1 + 2 - 3 - (4 + 5)'
  }, {
    expression: createExpression(
      createExpression(createExpression(1, 3, '+'), 3, '*'),
      createExpression(14, createExpression(4, 4, '+'), '-'),
      '/'
    ),
    expectedResult: 2,
    expectedFormat: '(1 + 3) * 3 / (14 - (4 + 4))'
  }, {
    expression: createExpression(25, createExpression(9, createExpression(3, 5, '*'), '+'), '-'),
    expectedResult: 1,
    expectedFormat: '25 - (9 + 3 * 5)'
  }, {
    expression: createExpression(25, createExpression(9, 3, '+'), '-'),
    expectedResult: 13,
    expectedFormat: '25 - (9 + 3)'
  }, {
    expression: createExpression(createExpression(25, 9, '-'), 3, '+'),
    expectedResult: 19,
    expectedFormat: '25 - 9 + 3'
  }]

  testData.forEach(data =>
    it(`formatted is ${data.expectedFormat}`, () => {
      data.expression.getResult().should.equal(data.expectedResult)
      data.expression.formatted.should.equal(data.expectedFormat)
    })
  )
})

describe('numbers solver', () => {
  const testData = [{
    numbers: [75, 1, 3, 1, 3, 6], target: 576, expected: [
      '(75 - 3) * (6 + 3 - 1)',
      '(75 - 3) * (1 + 1 + 6)',
      '(75 - 3) * (3 + 6 - 1)',
      '(75 / 3 - 1) * 6 * (3 + 1)'
    ]
  }, {
    numbers: [5, 2, 3, 10, 6, 4], target: 609, expected: ['(5 + 2) * (3 + 6 * (10 + 4))']
  }, {
    numbers: [75, 25, 7, 10, 3, 7], target: 834, expected: ['10 * (75 - 7) + 7 * (25 - 3)']
  }, {
    numbers: [50, 100, 9, 1, 9, 3], target: 727, expected: ['3 * (100 + 9) + 50 * (9 - 1)']
  }, {
    numbers: [25, 50, 75, 9, 7, 2], target: 995, expected: ['50 + 9 * (75 + 25 + 7 - 2)']
  }, {
    numbers: [25, 75, 100, 3, 9, 5], target: 601, expected: []
  }]

  testData.forEach(data =>
    it(`when target is ${data.target}`, () => {
      const results = solveNumbersGame(data.numbers, data.target)

      results.bestResults
        .forEach(expr => eval(expr.formatted).should.equal(expr.getResult()))

      const formattedResults = results.bestResults
        .filter(r => r.getResult() === data.target)
        .map(r => r.formatted)
      data.expected.forEach(expectation => {
        formattedResults.should.contain(expectation)
      })
    })
  )
})