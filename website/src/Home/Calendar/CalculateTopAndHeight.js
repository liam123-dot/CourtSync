export function calculateTopAndHeight(outerStart, outerEnd, innerStart, innerEnd) {

    const dOuter = outerEnd - outerStart;
  
    const dStart = innerStart - outerStart;
    let top;
    if (dStart <= 0){
      top = 0;
    } else {
      top = (dStart / dOuter) * 100;
    }
  
    const dWH = innerEnd - innerStart;
    const height = (dWH / dOuter) * 100;
  
    return {top: top, height: height}
  
}