import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi'
import { arcTestnet } from './wagmi'

function truncateAddress(address) {
  return address.slice(0, 6) + '...' + address.slice(-4)
}

function WalletCard() {
  const { address, isConnected, chainId } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: arcTestnet.id,
    query: { enabled: isConnected },
  })

  const onArc = chainId === arcTestnet.id

  if (!isConnected) {
    return (
      <div className="card">
        <p className="eyebrow">Step 1</p>
        <h2>Connect a wallet</h2>
        <p className="muted">Real connection, no mock addresses.</p>
        <div className="connector-list">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              className="btn-primary"
              disabled={isPending}
              onClick={() => connect({ connector, chainId: arcTestnet.id })}
            >
              {connector.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const openExplorer = () => {
    window.open('https://testnet.arcscan.app/address/' + address, '_blank')
  }

  return (
    <div className="card">
      <p className="eyebrow">Wallet</p>
      <h2>{truncateAddress(address)}</h2>

      {!onArc && (
        <div className="warning">
          <p>Wrong network. This wallet is not on Arc Testnet.</p>
          <button
            className="btn-primary"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: arcTestnet.id })}
          >
            {isSwitching ? 'Switching' : 'Switch to Arc Testnet'}
          </button>
        </div>
      )}

      {onArc && (
        <div className="balance-row">
          <span className="muted">Balance</span>
          <span className="balance-value">
            {balanceLoading ? '-' : Number(balance?.formatted).toFixed(4) + ' ' + balance?.symbol}
          </span>
        </div>
      )}

      <button className="btn-secondary" onClick={openExplorer}>
        View on ArcScan
      </button>

      <button className="btn-secondary" onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  )
}

export default function App() {
  return (
    <div className="page">
      <header className="header">
        <span className="logo">ARC Hub</span>
        <span className="badge">Testnet</span>
      </header>
      <main className="main">
        <WalletCard />
      </main>
    </div>
  )
}
