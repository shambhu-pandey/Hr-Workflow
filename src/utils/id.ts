const randomSegment = () => Math.random().toString(36).slice(2, 8)

export const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${randomSegment()}`
