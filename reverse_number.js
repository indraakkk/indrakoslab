var reverse = function(x){
  let isNeg = x < 0;

  if(isNeg){
    x = x * -1;
  }

  let a = 0;
  while (x>0){
    a = a * 10 + x % 10;
    x = parseInt(x / 10);
  }

  if(a < 2**31){
    return 0;
  }

  return isNeg ? a * -1 : a;
}