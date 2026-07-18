import { useState } from 'react'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseEther, isAddress } from 'viem'
import { arcTestnet } from './wagmi'

function truncateAddress(address) {
  return address.slice(0, 6) + '...' + address.slice(-4)
}

function openExplorerAddress(address) {
  window.open('https://testnet.arcscan.app/address/' + address, '_blank')
}

function openExplorerTx(hash) {
  window.open('https://testnet.arcscan.app/tx/' + hash, '_blank')
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

      <button className="btn-secondary" onClick={() => openExplorerAddress(address)}>
        View on ArcScan
      </button>

      <button className="btn-secondary" onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  )
}

function SendCard({ onSent }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [formError, setFormError] = useState('')

  const { sendTransaction, data: hash, isPending, reset } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const handleSend = () => {
    setFormError('')

    if (!isAddress(to)) {
      setFormError('Enter a valid address.')
      return
    }
    if (!amount || Number(amount) <= 0) {
      setFormError('Enter an amount greater than 0.')
      return
    }

    sendTransaction(
      { to, value: parseEther(amount) },
      {
        onSuccess: (txHash) => {
          onSent(txHash)
        },
      }
    )
  }

  const handleReset = () => {
    setTo('')
    setAmount('')
    setFormError('')
    reset()
  }

  if (hash && isConfirmed) {
    return (
      <div className="card">
        <p className="eyebrow">Send</p>
        <h2>Transaction confirmed</h2>
        <p className="muted">Real transaction, mined on Arc Testnet.</p>
        <button className="btn-secondary" onClick={() => openExplorerTx(hash)}>
          View transaction
        </button>
        <button className="btn-secondary" onClick={handleReset}>
          Send another
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <p className="eyebrow">Send</p>
      <h2>Send USDC</h2>
      <p className="muted">Real on-chain transfer on Arc Testnet.</p>

      <label className="field-label">Recipient address</label>
      <input
        className="text-input"
        placeholder="0x..."
        value={to}
        onChange={(e) => setTo(e.target.value)}
        disabled={isPending || isConfirming}
      />

      <label className="field-label">Amount (USDC)</label>
      <input
        className="text-input"
        placeholder="0.0"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={isPending || isConfirming}
      />

      {formError && <p className="error-text">{formError}</p>}

      <button
        className="btn-primary full-width"
        disabled={isPending || isConfirming}
        onClick={handleSend}
      >
        {isPending ? 'Confirm in wallet...' : isConfirming ? 'Confirming...' : 'Send'}
      </button>

      {hash && !isConfirmed && (
        <button className="btn-secondary" onClick={() => openExplorerTx(hash)}>
          View pending transaction
        </button>
      )}
    </div>
  )
}

function ReceiveCard() {
  const { address } = useAccount()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setCopied(false)
    }
  }

  return (
    <div className="card">
      <p className="eyebrow">Receive</p>
      <h2>Your address</h2>
      <p className="muted">Share this to receive USDC on Arc Testnet.</p>

      <div className="address-box">{address}</div>

      <button className="btn-primary full-width" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy address'}
      </button>
    </div>
  )
}

function ActivityCard({ txs }) {
  return (
    <div className="card">
      <p className="eyebrow">Activity</p>
      <h2>This session</h2>
      <p className="muted">
        Transactions sent from this app since you opened it. For full wallet
        history, view the account on the explorer.
      </p>

      {txs.length === 0 && <p className="muted">No transactions sent yet.</p>}

      {txs.length > 0 && (
        <div className="tx-list">
          {txs.map((tx) => (
            <button
              key={tx.hash}
              className="tx-row"
              onClick={() => openExplorerTx(tx.hash)}
            >
              <span>{truncateAddress(tx.hash)}</span>
              <span className="muted">{tx.time}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const { isConnected } = useAccount()
  const [tab, setTab] = useState('wallet')
  const [txs, setTxs] = useState([])

  const handleSent = (hash) => {
    const entry = { hash, time: new Date().toLocaleTimeString() }
    setTxs((prev) => [entry, ...prev])
  }

  return (
    <div className="page">
      <header className="header">
        <span className="logo">ARC Hub</span>
        <span className="badge">Testnet</span>
      </header>

      {isConnected && (
        <nav className="tabs">
          <button
            className={tab === 'wallet' ? 'tab active' : 'tab'}
            onClick={() => setTab('wallet')}
          >
            Wallet
          </button>
          <button
            className={tab === 'send' ? 'tab active' : 'tab'}
            onClick={() => setTab('send')}
          >
            Send
          </button>
          <button
            className={tab === 'receive' ? 'tab active' : 'tab'}
            onClick={() => setTab('receive')}
          >
            Receive
          </button>
          <button
            className={tab === 'activity' ? 'tab active' : 'tab'}
            onClick={() => setTab('activity')}
          >
            Activity
          </button>
        </nav>
      )}

      <main className="main">
        {(!isConnected || tab === 'wallet') && <WalletCard />}
        {isConnected && tab === 'send' && <SendCard onSent={handleSent} />}
        {isConnected && tab === 'receive' && <ReceiveCard />}
        {isConnected && tab === 'activity' && <ActivityCard txs={txs} />}
      </main>
    </div>
  )
}
