import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import { ROUTER_ADDRESS, SYM_ADDRESS, WETH_ADDRESS, ROUTER_ABI, ERC20_ABI } from './constants';

const DEFAULT_TOKENS = [
  { symbol: 'SYM', name: 'Symbian Token', address: SYM_ADDRESS },
  { symbol: 'WETH', name: 'Wrapped ETH', address: WETH_ADDRESS },
  { symbol: 'FLT', name: 'Fluent Token', address: '0xa0a45220Af1874faD35ea8ea5d68B185a1A3b805' },
];

function App() {
  const [tokenAddress, setTokenAddress] = useState(SYM_ADDRESS);
  const [tokenInfo, setTokenInfo] = useState({ name: 'Symbian', symbol: 'SYM' });
  const [amount, setAmount] = useState(''); 
  const [amountEth, setAmountEth] = useState('0.1'); 
  const [estimate, setEstimate] = useState('0');
  const [status, setStatus] = useState('System Online');
  const [isEthToToken, setIsEthToToken] = useState(true);
  const [tab, setTab] = useState('swap');
  const [showModal, setShowModal] = useState(false);

  // Fungsi untuk mengganti token dari Modal
  const selectToken = (addr) => {
    setTokenAddress(addr);
    setShowModal(false);
  };

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!ethers.isAddress(tokenAddress)) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(tokenAddress, ["function name() view returns (string)", "function symbol() view returns (string)"], provider);
        const [name, symbol] = await Promise.all([contract.name(), contract.symbol()]);
        setTokenInfo({ name, symbol });
      } catch (err) { setTokenInfo({ name: 'Unknown Device', symbol: '???' }); }
    };
    fetchTokenInfo();
  }, [tokenAddress]);

  useEffect(() => {
    const getEstimate = async () => {
      if (tab !== 'swap' || !amount || amount <= 0 || !window.ethereum || !ethers.isAddress(tokenAddress)) {
        setEstimate('0');
        return;
      }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
        const path = isEthToToken ? [WETH_ADDRESS, tokenAddress] : [tokenAddress, WETH_ADDRESS];
        const amountsOut = await router.getAmountsOut(ethers.parseEther(amount), path);
        setEstimate(ethers.formatUnits(amountsOut[1], 18));
      } catch (err) { setEstimate('0'); }
    };
    getEstimate();
  }, [amount, isEthToToken, tokenAddress, tab]);

  const getDeadline = () => Math.floor(Date.now() / 1000) + 60 * 20;

  async function handleAction() {
    if (!window.ethereum) return alert("MetaMask not found!");
    try {
      setStatus("Awaiting Confirmation...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);

      if (tab === 'swap') {
        const val = ethers.parseEther(amount);
        if (isEthToToken) {
          await (await router.swapExactETHForTokens(0, [WETH_ADDRESS, tokenAddress], await signer.getAddress(), getDeadline(), { value: val })).wait();
        } else {
          const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
          setStatus("Permission Pending...");
          await (await token.approve(ROUTER_ADDRESS, val)).wait();
          setStatus("Executing Swap...");
          await (await router.swapExactTokensForETH(val, 0, [tokenAddress, WETH_ADDRESS], await signer.getAddress(), getDeadline())).wait();
        }
      } else {
        const valToken = ethers.parseEther(amount);
        const valEth = ethers.parseEther(amountEth);
        const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        setStatus("Approving " + tokenInfo.symbol + "...");
        await (await token.approve(ROUTER_ADDRESS, valToken)).wait();
        setStatus("Adding Liquidity...");
        await (await router.addLiquidityETH(tokenAddress, valToken, 0, 0, await signer.getAddress(), getDeadline(), { value: valEth })).wait();
      }
      setStatus("Operation Complete!");
    } catch (err) { setStatus("System Error!"); }
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#001d3d', color: 'white', minHeight: '100vh', fontFamily: 'Tahoma, sans-serif' }}>
      <h1 style={{ color: '#d1d7db', letterSpacing: '3px', textShadow: '3px 3px #000' }}>SYMBIAN<span style={{color: '#0082c8'}}>OS</span></h1>

      <div className="symbian-card">
        <div style={{ background: '#005295', padding: '25px', borderRadius: '30px', width: '400px', border: '2px solid #002544' }}>
          
          <div style={{ display: 'flex', background: '#003a6a', padding: '5px', borderRadius: '15px', marginBottom: '20px' }}>
            <div onClick={() => setTab('swap')} style={{ flex: 1, padding: '10px', cursor: 'pointer', borderRadius: '10px', background: tab === 'swap' ? 'linear-gradient(to bottom, #0082c8, #005295)' : 'transparent', fontWeight: 'bold' }}>SWAP</div>
            <div onClick={() => setTab('liquidity')} style={{ flex: 1, padding: '10px', cursor: 'pointer', borderRadius: '10px', background: tab === 'liquidity' ? 'linear-gradient(to bottom, #0082c8, #005295)' : 'transparent', fontWeight: 'bold' }}>POOL</div>
          </div>

          {/* BOX ATAS */}
          <div style={{ background: '#fff', padding: '15px', borderRadius: '18px', border: '3px solid #003a6a', textAlign: 'left' }}>
            <label style={{ color: '#005295', fontSize: '11px', fontWeight: 'bold' }}>FROM</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" style={{ background: 'none', border: 'none', color: '#000', fontSize: '24px', width: '50%', outline: 'none', fontWeight: 'bold' }} />
              {/* TOMBOL ATAS AKTIF */}
              <button onClick={() => { if(!isEthToToken) setShowModal(true); else setIsEthToToken(false); }} 
                style={{ background: '#005295', color: 'white', border: '1px solid #000', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isEthToToken ? 'ETH' : tokenInfo.symbol} ▿
              </button>
            </div>
          </div>

          <div className="reverse-btn" style={{ margin: '12px', color: '#d1d7db', fontSize: '22px', cursor: 'pointer' }} onClick={() => setIsEthToToken(!isEthToToken)}>⇅</div>

          {/* BOX BAWAH */}
          <div style={{ background: '#fff', padding: '15px', borderRadius: '18px', border: '3px solid #003a6a', textAlign: 'left', marginBottom: '25px' }}>
            <label style={{ color: '#005295', fontSize: '11px', fontWeight: 'bold' }}>TO / DEPOSIT</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {tab === 'swap' ? (
                <div style={{ fontSize: '24px', color: '#000', fontWeight: 'bold' }}>{parseFloat(estimate).toFixed(4)}</div>
              ) : (
                <input type="number" value={amountEth} onChange={(e) => setAmountEth(e.target.value)} style={{ background: 'none', border: 'none', color: '#000', fontSize: '24px', width: '50%', outline: 'none', fontWeight: 'bold' }} />
              )}
              {/* TOMBOL BAWAH SEKARANG AKTIF UNTUK MODAL */}
              <button onClick={() => { if(isEthToToken) setShowModal(true); else setIsEthToToken(true); }} 
                style={{ background: '#005295', color: 'white', border: '1px solid #000', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {!isEthToToken ? 'ETH' : tokenInfo.symbol} ▿
              </button>
            </div>
          </div>

          <button className="nokia-button" onClick={handleAction} disabled={status.includes("...")} style={{ 
            width: '100%', padding: '16px', borderRadius: '50px', background: 'linear-gradient(to bottom, #0082c8, #005295)', 
            color: 'white', border: '2px solid #fff', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {status.includes("...") && <div className="loading-spinner" style={{marginRight: '10px'}}></div>}
            {status.includes("...") ? 'PROCESSING' : (tab === 'swap' ? 'EXECUTE SWAP' : 'JOIN POOL')}
          </button>

          <div style={{ marginTop: '15px', background: '#003a6a', padding: '8px', borderRadius: '8px', fontSize: '12px' }}>
            STATUS: {status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* MODAL SEARCH FIX */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#d1d7db', padding: '25px', borderRadius: '25px', width: '360px', border: '5px solid #005295' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#005295', fontWeight: 'bold', marginBottom: '15px' }}>
              <span>SELECT DEVICE</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'red', border: 'none', color: 'white', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>X</button>
            </div>
            <input 
              type="text" 
              placeholder="Paste Address 0x..." 
              onChange={(e) => { if(ethers.isAddress(e.target.value)) selectToken(e.target.value); }}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #005295', marginBottom: '15px', boxSizing: 'border-box' }}
            />
            {DEFAULT_TOKENS.map(t => (
              <div key={t.address} onClick={() => selectToken(t.address)} 
                style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #999', color: '#000', textAlign: 'left', fontWeight: 'bold' }}>
                {t.symbol}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;