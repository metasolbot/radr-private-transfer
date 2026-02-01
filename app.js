// RADR Private Transfer App
// Combines ProofWallet + RADR SDK for privacy transfers

const CLAW_WALLETS = [
    { name: 'CLaw...', address: 'CLawNbmwnGcyAGBr8KsNbzHQkYr96ptTsEZVLzkqtjg2' },
    { name: 'c1aw...', address: 'c1awCJKvfH1iERbHhhzn1o1qCG2qGPxKGCz5ym2mTV5' },
    { name: 'cLAw...', address: 'cLAwMD5py6ZKAU3qhbYf2MVPnaHt2xX5v3S9couyM6v' },
    { name: 'cLaw...', address: 'cLaw2M5vpjdLzeAMeZsvdbzNxDTt1K9A49GQXbTD9vt' }
];

const SHADOWWIRE_API = 'https://shadow.radr.fun/shadowpay/api';
const HELIUS_RPC = 'https://viviyan-bkj12u-fast-mainnet.helius-rpc.com';

let currentWallet = null;
let currentKeypair = null;

function log(msg, type = '') {
    const logEl = document.getElementById('log');
    const div = document.createElement('div');
    div.className = type;
    div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
    console.log(msg);
}

function showStatus(msg, type = 'info') {
    const box = document.getElementById('status-box');
    box.className = `status ${type}`;
    box.textContent = msg;
    box.classList.remove('hidden');
}

function hideStatus() {
    document.getElementById('status-box').classList.add('hidden');
}

// Base58 decode helper
function decodeBase58(str) {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const index = ALPHABET.indexOf(char);
        if (index === -1) throw new Error(`Invalid base58 character: ${char}`);
        
        let carry = index;
        for (let j = 0; j < bytes.length; j++) {
            carry += bytes[j] * 58;
            bytes[j] = carry & 0xff;
            carry >>= 8;
        }
        while (carry > 0) {
            bytes.push(carry & 0xff);
            carry >>= 8;
        }
    }
    
    // Add leading zeros
    for (let i = 0; i < str.length && str[i] === '1'; i++) {
        bytes.push(0);
    }
    
    return new Uint8Array(bytes.reverse());
}

// Import wallet from private key
async function importWallet() {
    const privateKey = prompt('Enter private key (Base58):');
    if (!privateKey) return;
    
    try {
        log('Importing wallet...');
        
        // Decode private key
        const secretKey = decodeBase58(privateKey.trim());
        if (secretKey.length !== 64) {
            throw new Error(`Invalid key length: ${secretKey.length} (expected 64)`);
        }
        
        // Create keypair
        currentKeypair = solanaWeb3.Keypair.fromSecretKey(secretKey);
        currentWallet = currentKeypair.publicKey.toBase58();
        
        log(`Wallet imported: ${currentWallet.slice(0, 8)}...`);
        
        // Update UI
        document.getElementById('wallet-status').innerHTML = `
            <div class="wallet-address">${currentWallet}</div>
            <button class="btn btn-secondary" style="margin-top: 12px" onclick="disconnectWallet()">Disconnect</button>
        `;
        
        // Show other sections
        document.getElementById('balance-section').classList.remove('hidden');
        document.getElementById('transfer-section').classList.remove('hidden');
        document.getElementById('batch-section').classList.remove('hidden');
        
        // Populate recipients
        const recipientsList = document.getElementById('recipients-list');
        recipientsList.innerHTML = CLAW_WALLETS.map(w => `
            <div class="recipient-item">
                <span>${w.name}</span>
                <span class="addr">${w.address.slice(0, 8)}...</span>
            </div>
        `).join('');
        
        // Check balance
        await checkBalance();
        
        showStatus('Wallet connected!', 'success');
        setTimeout(hideStatus, 3000);
        
    } catch (err) {
        log(`Import failed: ${err.message}`, 'error');
        showStatus(`Error: ${err.message}`, 'error');
    }
}

function disconnectWallet() {
    currentWallet = null;
    currentKeypair = null;
    
    document.getElementById('wallet-status').innerHTML = `
        <button class="btn btn-secondary" onclick="importWallet()">Import Wallet</button>
    `;
    document.getElementById('balance-section').classList.add('hidden');
    document.getElementById('transfer-section').classList.add('hidden');
    document.getElementById('batch-section').classList.add('hidden');
    
    log('Wallet disconnected');
}

// Check ShadowWire balance
async function checkBalance() {
    if (!currentWallet) return;
    
    log('Checking ShadowWire balance...');
    
    try {
        const res = await fetch(`${SHADOWWIRE_API}/pool/balance/${currentWallet}`);
        const data = await res.json();
        
        const balanceSOL = (data.available || 0) / 1e9;
        document.getElementById('sw-balance').textContent = balanceSOL.toFixed(4);
        
        log(`ShadowWire balance: ${balanceSOL} SOL`);
        
    } catch (err) {
        log(`Balance check failed: ${err.message}`, 'error');
    }
}

// Sign message with keypair
async function signMessage(message) {
    const messageBytes = typeof message === 'string' 
        ? new TextEncoder().encode(message) 
        : message;
    const signature = nacl.sign.detached(messageBytes, currentKeypair.secretKey);
    return signature;
}

// Send private transfer using ShadowWire
async function sendPrivateTransfer() {
    const recipient = document.getElementById('recipient').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const transferType = document.getElementById('transfer-type').value;
    
    if (!recipient || !amount) {
        showStatus('Please fill in all fields', 'error');
        return;
    }
    
    if (amount < 0.1) {
        showStatus('Minimum amount is 0.1 SOL', 'error');
        return;
    }
    
    const btn = document.getElementById('send-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    
    try {
        log(`Initiating ${transferType} transfer of ${amount} SOL to ${recipient.slice(0, 8)}...`);
        
        // Create signature for auth
        const timestamp = Date.now();
        const message = `ShadowWire:${currentWallet}:${timestamp}`;
        const signature = await signMessage(message);
        const signatureBase64 = btoa(String.fromCharCode(...signature));
        
        // Call transfer API
        const res = await fetch(`${SHADOWWIRE_API}/pool/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: currentWallet,
                recipient: recipient,
                amount: amount,
                token: 'SOL',
                type: transferType,
                signature: signatureBase64,
                timestamp: timestamp
            })
        });
        
        const data = await res.json();
        log(`Response: ${JSON.stringify(data)}`);
        
        if (data.success || data.signature) {
            showStatus(`Transfer successful! TX: ${data.signature || 'pending'}`, 'success');
            log('Transfer complete!', 'success');
            await checkBalance();
        } else {
            throw new Error(data.error || data.message || 'Transfer failed');
        }
        
    } catch (err) {
        log(`Transfer failed: ${err.message}`, 'error');
        showStatus(`Error: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Privately';
    }
}

// Batch transfer to all cLaw wallets
async function batchTransfer() {
    const btn = document.getElementById('batch-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    
    let successCount = 0;
    
    try {
        for (const wallet of CLAW_WALLETS) {
            log(`Sending 0.1 SOL to ${wallet.name}...`);
            
            try {
                const timestamp = Date.now();
                const message = `ShadowWire:${currentWallet}:${timestamp}`;
                const signature = await signMessage(message);
                const signatureBase64 = btoa(String.fromCharCode(...signature));
                
                const res = await fetch(`${SHADOWWIRE_API}/pool/transfer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: currentWallet,
                        recipient: wallet.address,
                        amount: 0.1,
                        token: 'SOL',
                        type: 'external',
                        signature: signatureBase64,
                        timestamp: timestamp
                    })
                });
                
                const data = await res.json();
                
                if (data.success || data.signature) {
                    log(`✅ ${wallet.name}: Success`, 'success');
                    successCount++;
                } else {
                    log(`❌ ${wallet.name}: ${data.error || 'Failed'}`, 'error');
                }
            } catch (err) {
                log(`❌ ${wallet.name}: ${err.message}`, 'error');
            }
            
            // Small delay between transfers
            await new Promise(r => setTimeout(r, 1000));
        }
        
        showStatus(`Batch complete: ${successCount}/${CLAW_WALLETS.length} successful`, 
            successCount === CLAW_WALLETS.length ? 'success' : 'info');
        await checkBalance();
        
    } catch (err) {
        showStatus(`Batch error: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send 0.1 SOL to All (Private)';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    log('RADR Private Transfer App loaded');
    log('Import a wallet to begin');
});
