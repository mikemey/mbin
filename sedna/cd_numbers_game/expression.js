const evaluateResult = (left, right, op) => {
  switch (op) {
    case  '+':
      return left + right
    case  '-':
      return left - right
    case  '*':
      return left * right
    case  '/':
      return left / right
    default:
      return null
  }
}

const createExpression = (a, b, op, target) => {
  const resultFrom = operand => typeof operand === 'object' ? operand.getResult() : operand
  const weightFrom = operand => typeof operand === 'object' ? operand.weight : 1

  const result = evaluateResult(resultFrom(a), resultFrom(b), op)
  const difference = Math.abs(target - result)
  const weight = weightFrom(a) + weightFrom(b)

  const getResult = () => { return result }
  const getDifference = () => { return difference }
  const getWeight = () => { return weight }

  const compareTo = (otherExpression) => {
    if (difference !== otherExpression.getDifference()) {
      return difference - otherExpression.getDifference()
    }
    return weight - otherExpression.weight
  }

  const formatExpression = (addBraces = false) => {
    const formatSubExpression = (subExpression, isRightOperand) => {
      if (typeof subExpression === 'number') {
        return subExpression.toString()
      }

      const needsBraces = () => {
        if (op === '+') { return false }
        if (op === '-') {
          return subExpression.op === '+' && isRightOperand
        }
        return subExpression.op === '+' || subExpression.op === '-'
      }

      return subExpression.formatExpression(needsBraces())
    }

    const expressionString = `${formatSubExpression(a, false)} ${op} ${formatSubExpression(b, true)}`
    return addBraces
      ? `(${expressionString})`
      : expressionString
  }

  const formatted = formatExpression()

  return { a, b, op, formatted, getWeight, getResult, getDifference, compareTo, formatExpression }
}

module.exports = { createExpression }