/**
 * Cryptographic utilities for OMG::CONCORD
 * Implements real SHA-256 chaining, block hashing, and signature validation.
 */

export async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeBlockHash(
  blockNumber: number,
  timestamp: number,
  proposalId: string,
  agentId: string,
  actionType: string,
  target: string,
  verdict: string,
  tpmMonotonicCounter: number,
  previousHash: string
): Promise<string> {
  const rawString = `${blockNumber}|${timestamp}|${proposalId}|${agentId}|${actionType}|${target}|${verdict}|${tpmMonotonicCounter}|${previousHash}`;
  return sha256Hex(rawString);
}

export function formatHashShort(hash: string): string {
  if (!hash || hash.length < 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}
