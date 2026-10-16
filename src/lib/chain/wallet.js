'use client';

// Owner actions from the user's browser wallet (Core, MetaMask...). No keys ever touch this app.
import { createWalletClient, custom } from 'viem';
import { CHAIN } from './vault';

export function hasWallet() {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

export async function connectWallet() {
  if (!hasWallet()) throw new Error('No browser wallet found. Install Core or MetaMask.');
  const wallet = createWalletClient({ chain: CHAIN, transport: custom(window.ethereum) });
  const [address] = await wallet.requestAddresses();
  try {
    await wallet.switchChain({ id: CHAIN.id });
  } catch {
    await wallet.addChain({ chain: CHAIN });
  }
  return { wallet, address };
}
