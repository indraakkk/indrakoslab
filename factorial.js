// Factorial Trailing Zeroes
var trailingZero = function(N){
    if(N < 5){
      return 0
    }
    let result = parseInt(N/5) + trailingZero(N/5)
    return result
}

// find number factorial
var factorial = function(N){
    if(N === 0){
      return 1
    }
    return N * factorial(N-1)
}