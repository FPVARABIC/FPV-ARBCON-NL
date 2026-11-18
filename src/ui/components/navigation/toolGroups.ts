import type {MainTabKey} from '../../../navigation/tabs';

/** Display groups only: route keys, capability gates and panel lifetimes stay owned by the shell. */
export const TOOL_GROUPS: readonly {label: string; tabs: readonly MainTabKey[]}[] = [
  {label: 'Werkbank', tabs: ['SETUP', 'MOTORS']},
  {label: 'Hardware', tabs: ['PORTS', 'GPS', 'CONFIGURATIONS', 'RECEIVER']},
  {label: 'Vlucht', tabs: ['PID', 'MODES', 'FAILSAFE']},
  {label: 'Voeding & beeld', tabs: ['POWER', 'OSD', 'VTX', 'LED']},
  {label: 'Diagnose & beheer', tabs: ['SENSORS', 'BLACKBOX', 'PRESETS', 'CLI']},
];

export const TOOL_GROUP_STARTS = new Map(TOOL_GROUPS.map(group => [group.tabs[0], group.label]));
