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
  const resultFrom = operand => operand.getResult ? operand.getResult() : operand
  const weightFrom = operand => operand.getWeight ? operand.getWeight() : 1

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
    return weight - otherExpression.getWeight()
  }

  const formatExpression = (addBraces = false) => {
    const formatSubExpression = (subExpression, isRightOperand) => {
      if (typeof subExpression === 'number') {
        return subExpression.toString()
      }

      const needsBraces = () => {
        if (op === '+') { return false }
        if (op === '-') {
          if (isRightOperand) {
            return subExpression.op === '+' || subExpression.op === '-'
          }
          return false
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