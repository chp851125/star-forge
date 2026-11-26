/** 座標:護手中心為原點,劍尖朝負 y。index = 階段 0~5 */
export const BLADES: { d: string; length: number; halfWidth: number }[] = [
  { d: 'M0-170L10-148V-8H-10V-148Z', length: 170, halfWidth: 10 },
  { d: 'M0-180L12-152L10-8H-10L-12-152Z', length: 180, halfWidth: 12 },
  { d: 'M0-186L13-156L11-8H-11L-13-156Z', length: 186, halfWidth: 14 },
  { d: 'M0-194L16-162L12-142L17-122L11-102L16-82L11-8H-11L-16-82L-11-102L-17-122L-12-142L-16-162Z', length: 194, halfWidth: 18 },
  { d: 'M0-218L24-172L20-8H-20L-24-172Z', length: 218, halfWidth: 24 },
  { d: 'M0-244L30-188L24-8H-24L-30-188Z', length: 244, halfWidth: 30 },
]

export const CRYSTAL = 'M0-11L7-2L0 13L-7-2Z'
export const STAR = 'M0-8L2-2 8 0 2 2 0 8-2 2-8 0-2-2Z'
