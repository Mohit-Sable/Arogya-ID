import crypto from 'crypto';

/**
 * Simple hash-chained append-only log.
 * Each entry's hash is computed from its content + the previous hash,
 * creating an immutable audit chain.
 * 
 * This is a simplified "blockchain-like" pattern for consent/audit trails
 * without an actual distributed ledger.
 */
let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';

export const computeChainHash = (data, prevHash = previousHash) => {
  const content = JSON.stringify(data) + prevHash;
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  previousHash = hash;
  return hash;
};

export const getPreviousHash = () => previousHash;

export const resetChain = (hash = '0000000000000000000000000000000000000000000000000000000000000000') => {
  previousHash = hash;
};
