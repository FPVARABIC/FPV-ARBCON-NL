/** The fixture has no flight controller. Ownership is reported ACTIVE so
 *  the screens render their content; nothing about layout is stubbed. */
export function useMspOwnershipState(): 'ACTIVE' {
  return 'ACTIVE';
}

const IDENTITY = {status:'SUCCEEDED',identity:{firmware:{identifier:'BTFL',knownFamily:'BETAFLIGHT'},apiVersion:{mspProtocolVersion:0,apiVersionMajor:1,apiVersionMinor:47},board:{}}} as const;
export function useMspIdentificationState(){return IDENTITY;}

export function useMspRecoveryState(): 'READY' {
  return 'READY';
}
