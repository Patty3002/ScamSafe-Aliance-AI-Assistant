export const POLICY_VERSION = '1.1'
export const RULE_IDS = [
  ...Array.from({length:3},(_,i)=>`CL0${i+1}`), ...Array.from({length:8},(_,i)=>`IR0${i+1}`),
  ...Array.from({length:9},(_,i)=>`UG0${i+1}`), ...Array.from({length:10},(_,i)=>`RT${String(i+1).padStart(2,'0')}`),
  ...Array.from({length:5},(_,i)=>`VU0${i+1}`), ...Array.from({length:7},(_,i)=>`VE0${i+1}`),
  'SAFE01','CTL01','CTL02','CTL03','CTL04','SP01',
] as const
