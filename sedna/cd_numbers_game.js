#!/usr/bin/env node

const readline = require('readline')

function main () {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter numbers (separated by spaces): ', (numbersInput) => {
    const userInput = numbersInput
    const numbers = numbersInput
      .split(' ')
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n))

    rl.question('Enter target result (between 100 and 999): ', (targetInput) => {
      const target = parseInt(targetInput.trim())

      if (isValidTarget(target)) {
        console.log('\nSolving the numbers game...')
        const resultsRecorder = solveNumbersGame(numbers, target)
        printResults(resultsRecorder, userInput, target)
      } else {
        console.error('Invalid input. Please provide 6 numbers and a valid target.')
      }
      rl.close()
    })
  })
}

function printResults (resultsRecorder, input, target) {
  console.log('\nTop results:')
  resultsRecorder.bestResults.forEach(printExpression)

  console.log(`\nTotal: ${resultsRecorder.getCounter()}`)
  console.log(`From input: ${input} -> ${target}`)
}

const printExpression = expression => {
  console.log(`${expression.formatted} = ${expression.getResult()}`)
}

function isValidTarget (target) {
  return target >= 100 && target <= 999
}

const solveNumbersGame = (numbers, target) => {
  const recorder = ResultRecorder()
  const expressionCache = new Set()

  const alreadyProcessed = expression => {
    if (expressionCache.has(expression.formatted)) {
      return true
    }
    expressionCache.add(expression.formatted)
    return false
  }

  const recurse = (nums) => {
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const expressionsForPair = generateExpressions(nums[i], nums[j], target)

        for (const expression of expressionsForPair) {
          if (evaluateExpression(expression) !== null) {
            if (!alreadyProcessed(expression)) {
              recorder.updateBestResults(expression)
            }

            const remaining = nums.filter((_, idx) => idx !== i && idx !== j)
            recurse([...remaining, expression])
          }
        }
      }
    }
  }

  recurse(numbers)
  return recorder
}

const ResultRecorder = () => {
  const bestResults = [] // Top 10 results
  let counter = 0
  let biggestDiff = Infinity

  const sortBestResults = () => bestResults.sort((exprA, exprB) => exprA.compareTo(exprB))

  const updateBestResults = (expression) => {
    if (expression.getDifference() === 0) {
      counter++
    }

    if (expression.getDifference() <= biggestDiff || bestResults.length < 10) {
      bestResults.push(expression)
      sortBestResults()
      if (bestResults.length > 10) {
        bestResults.pop()
      }
      biggestDiff = Math.abs(bestResults[bestResults.length - 1].getDifference())
    }
  }

  const getCounter = () => counter

  return { updateBestResults, bestResults, getCounter }
}

const evaluateExpression = (expression) => {
  if (expression.getResult()) {
    return expression.getResult()
  }
  const { a, b, op } = expression

  const left = typeof a === 'object' ? a.getResult() : a
  const right = typeof b === 'object' ? b.getResult() : b

  expression.setResult((() => {
    switch (op) {
      case  '+':
        return left + right
      case  '-':
        return left - right
      case  '*':
        return left * right
      case  '/':
        return right !== 0 && left % right === 0 ? left / right : null
      default:
        return null
    }
  })())
  return expression.getResult()
}

const generateExpressions = (a, b, target) => {
  const expressions = []

  const expressionResult = expr => expr.getResult ? expr.getResult() : expr

  if (expressionResult(a) === 0 || expressionResult(b) === 0) {
    return expressions
  }

  const createExpressionWith = (a, b, op) => createExpression(a, b, op, target)

  const createSubtraction = (exprA, exprB) => {
    const resultA = expressionResult(exprA)
    const resultB = expressionResult(exprB)
    if (resultA - resultB > 0) {
      expressions.push(createExpressionWith(exprA, exprB, '-'))
    }
  }

  const createMultiplication = (exprA, exprB) => {
    const resultA = expressionResult(exprA)
    const resultB = expressionResult(exprB)
    if (resultA !== 1 && resultB !== 1) {
      expressions.push(createExpressionWith(exprA, exprB, '*'))
    }
  }

  const createDivision = (exprA, exprB) => {
    const resultA = expressionResult(exprA)
    const resultB = expressionResult(exprB)
    if (resultB > 1 && resultA % resultB === 0) {
      expressions.push(createExpressionWith(exprA, exprB, '/'))
    }
  }

  expressions.push(createExpressionWith(a, b, '+'))
  createSubtraction(a, b)
  createSubtraction(b, a)
  createMultiplication(a, b)
  createDivision(a, b)
  createDivision(b, a)

  return expressions
}

const createExpression = (a, b, op, target) => {
  const weightFrom = operand => typeof operand === 'object' ? operand.weight : 1
  const weight = weightFrom(a) + weightFrom(b)

  let difference = Infinity
  let result = null

  const setResult = res => {
    if (res) {
      difference = Math.abs(target - res)
    }
    result = res
  }

  const getResult = () => { return result}
  const getDifference = () => { return difference }

  const compareTo = (otherExpression) => {
    if (difference !== otherExpression.getDifference()) {
      return difference - otherExpression.getDifference()
    }
    return weight - otherExpression.weight
  }

  const formatExpression = (addBraces = false) => {
    const formatOperator = operator => {
      if (typeof operator === 'number') {
        return operator.toString()
      }

      const needsBraces = () => {
        if (op === '+' || op === '-') {
          return false
        }
        return operator.op === '+' || operator.op === '-'
      }

      return operator.formatExpression(needsBraces())
    }

    const expressionString = `${formatOperator(a)} ${op} ${formatOperator(b)}`
    return addBraces
      ? `(${expressionString})`
      : expressionString
  }

  const formatted = formatExpression()

  return { a, b, op, formatted, weight, setResult, getResult, getDifference, compareTo, formatExpression }
}

if (require.main === module) {
  main()
}

module.exports = { createExpression, solveNumbersGame, printExpression }