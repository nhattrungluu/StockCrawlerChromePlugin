export function generateProfitText(profit: number): string {
  const roundedProfit = Math.round(profit);
  if (profit > 0) {
    return `+${roundedProfit}   (ﾉ◕ヮ◕)) `;
  }

  if (profit < 0) {
    return `${roundedProfit}   '(°ロ°)☝'`;
  }

  return `${roundedProfit}   ༼ つ ◕_◕ ༽つ`;
}

export function generateClassNameBasedOnProfit(profit: number): string {
  if (profit > 0) {
    return "green";
  }

  if (profit < 0) {
    return "red";
  }

  return "";
}
