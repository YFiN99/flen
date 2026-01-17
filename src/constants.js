export const ROUTER_ADDRESS = "0x10fD4AD610849e36829e012E33D886055Eb08E94";
export const SYM_ADDRESS = "0xc48891E4E525D4c32b0B06c5fe77Efe7743939FD";
export const WETH_ADDRESS = "0xF6ED62078aa1Cf14B4B60bfefB17dF9c4BD8Ef79";

export const ROUTER_ABI = [
  // Add Liquidity
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  // Swap ETH -> Token
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  // Swap Token -> ETH
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  // Get Amounts Out
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) public view returns (uint256)"
];