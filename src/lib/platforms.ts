import { findOrg, flattenOrg, type OrgNode } from './org-tree';

export type Platform = Pick<
  OrgNode,
  'id' | 'label' | 'role' | 'blurb' | 'overlay' | 'overlay2'
>;

export const defaultPlatforms: Platform[] = flattenOrg();

export function findPlatform(platforms: Platform[], id: string): Platform {
  return platforms.find((p) => p.id === id) ?? findOrg(id);
}
